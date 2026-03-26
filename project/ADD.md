# AstroBookings Architecture Design Document (ADD)

This document defines the architecture of AstroBookings as a brownfield training API.
It reflects current implementation reality and the target evolution for pending features.

## Table of Contents

- [AstroBookings Architecture Design Document (ADD)](#astrobookings-architecture-design-document-add)
  - [Table of Contents](#table-of-contents)
  - [1. Purpose and Scope](#1-purpose-and-scope)
  - [2. Brownfield Baseline](#2-brownfield-baseline)
  - [3. Architecture Drivers](#3-architecture-drivers)
  - [4. System Context](#4-system-context)
  - [5. Component Architecture](#5-component-architecture)
    - [5.1 High-level structure](#51-high-level-structure)
    - [5.2 Logical component diagram](#52-logical-component-diagram)
    - [5.3 Ownership and responsibilities](#53-ownership-and-responsibilities)
  - [6. Runtime Flows](#6-runtime-flows)
    - [6.1 Launch creation](#61-launch-creation)
    - [6.2 Booking creation](#62-booking-creation)
    - [6.3 Booking update and delete consistency](#63-booking-update-and-delete-consistency)
  - [7. Data Design and Consistency](#7-data-design-and-consistency)
  - [8. API and Error Contract](#8-api-and-error-contract)
  - [9. Testing Strategy](#9-testing-strategy)
  - [10. Operational Constraints](#10-operational-constraints)
  - [11. Security Posture](#11-security-posture)
  - [12. Evolution Plan for FR5 and FR6](#12-evolution-plan-for-fr5-and-fr6)
    - [12.1 FR5 Launch lifecycle states](#121-fr5-launch-lifecycle-states)
    - [12.2 FR6 Payment and refund processing](#122-fr6-payment-and-refund-processing)
  - [13. Architecture Decision Records (Concise ADRs)](#13-architecture-decision-records-concise-adrs)
    - [ADR-01 Layered monolith for clarity](#adr-01-layered-monolith-for-clarity)
    - [ADR-02 In-memory Map storage](#adr-02-in-memory-map-storage)
    - [ADR-03 Validation in services](#adr-03-validation-in-services)
    - [ADR-04 Explicit HTTP contract](#adr-04-explicit-http-contract)
    - [ADR-05 Dual test strategy](#adr-05-dual-test-strategy)
    - [ADR-06 No auth and no real payments in core scope](#adr-06-no-auth-and-no-real-payments-in-core-scope)
    - [ADR-07 FR5 state machine via domain rules](#adr-07-fr5-state-machine-via-domain-rules)
    - [ADR-08 FR6 payment adapter with mock gateway](#adr-08-fr6-payment-adapter-with-mock-gateway)
    - [ADR-09 Global CORS enablement](#adr-09-global-cors-enablement)

## 1. Purpose and Scope

AstroBookings is a training backend API for space travel booking operations.
It provides REST resources for rockets, launches, customers, and bookings.

This ADD covers:
- Current architecture for implemented requirements (FR1-FR4, TR1-TR4).
- Brownfield constraints and tradeoffs.
- Controlled evolution path for FR5 (launch lifecycle) and FR6 (payment/refund).

This ADD does not introduce production infrastructure that is not present in code.

## 2. Brownfield Baseline

Implemented and stable:
- Rocket CRUD with validation.
- Launch CRUD linked to rockets, with future date, positive price, minPassengers validation.
- Customer CRUD by email with format validation.
- Booking CRUD with seat reservation, availableSeats updates, and totalPrice calculation.
- TypeScript strict ESM + Express 5 layered flow.
- In-memory Map storage with incremental IDs.
- Unit tests (Vitest) + E2E tests (Playwright).

Not implemented yet:
- Payment and refund processing behavior (FR6).

## 3. Architecture Drivers

Primary drivers:
- Teaching value over production complexity.
- Predictable REST behavior and explicit status codes.
- Clear separation: routes -> services -> types.
- Validation-first service layer.
- Fast local setup with zero external dependencies.

Key constraints:
- No persistent database.
- No authentication or authorization.
- No real payment integration.
- Keep existing folder structure and coding style.

## 4. System Context

Actors:
- API consumers (training participants, test suites, demo clients).

External systems:
- None required at runtime.

Boundary:
- Single Node.js process exposing HTTP endpoints.
- All state is process memory and resets on restart.

## 5. Component Architecture

### 5.1 High-level structure

- Entry point: Express app bootstrap.
- Routes layer: HTTP resource endpoints.
- Services layer: business rules, validation, state changes.
- Types layer: request/entity contracts.
- Utils layer: logging and route helper utilities.
- Tests:
  - Unit tests for services.
  - E2E tests for API behavior.

### 5.2 Logical component diagram

```text
Client/Test
   |
HTTP JSON
   v
Express App (src/index.ts)
   |
   +--> Routes (src/routes/*)
           |
           +--> Services (src/services/*)
                    |
                    +--> In-memory Maps + Incremental IDs

Cross-cutting: logger + route helpers
Verification: Vitest (unit) + Playwright (e2e)
```

### 5.3 Ownership and responsibilities

Routes:
- Parse input and params.
- Delegate to services.
- Map outcomes to HTTP status codes.

Services:
- Validate domain rules.
- Enforce referential integrity (customer/launch/rocket references).
- Manage seat consistency and total price calculations.
- Emit domain-level errors consumed by route helpers.

Types:
- Define DTOs and entities for compile-time safety.

## 6. Runtime Flows

### 6.1 Launch creation

1. Validate rocket reference.
2. Validate launchDateTime, price, minPassengers.
3. Initialize availableSeats from rocket capacity.
4. Return 201 with launch payload.

### 6.2 Booking creation

1. Validate customer and launch references.
2. Validate seats range and seat availability.
3. Decrease launch availableSeats.
4. Compute totalPrice = seats x launch.price.
5. Return 201 with booking payload.

### 6.3 Booking update and delete consistency

- Update recalculates seat difference and adjusts launch availableSeats.
- Delete restores seats to launch before removing booking.
- Missing entities return 404 through route-level mapping.

## 7. Data Design and Consistency

Current in-memory stores:
- rockets: Map<string, Rocket>
- launches: Map<string, Launch>
- customers: Map<string, Customer>
- bookings: Map<string, Booking>

Consistency rules currently enforced:
- Launch references an existing rocket.
- Booking references existing customer and launch.
- Booking seat counts cannot exceed launch availability.
- Launch availableSeats is adjusted on booking create/update/delete.

Known brownfield limitation:
- Multi-entity updates are not transactional across process failures.
- Acceptable for training due to in-memory and single-process scope.

## 8. API and Error Contract

HTTP conventions:
- 201 on create.
- 200 on read and update.
- 204 on delete.
- 400 on validation failures.
- 404 on missing resources.

Validation behavior:
- Services collect validation errors.
- Validation errors are returned as structured arrays where applicable.
- Route helpers normalize not-found and validation responses.

## 9. Testing Strategy

Unit tests (Vitest):
- Focus on service rules, validation, seat accounting, and edge cases.

E2E tests (Playwright):
- Validate endpoint behavior, response codes, and workflow acceptance.

Coverage intent:
- Service logic correctness through fast unit feedback.
- API contract confidence through end-to-end assertions.

## 10. Operational Constraints

Deployment model:
- Local/dev single service process.
- No container/orchestration assumptions in this architecture.

Runtime constraints:
- State loss on restart.
- Not horizontally scalable with in-memory state.

## 11. Security Posture

Security is intentionally minimal by product scope.

Current posture:
- No authN/authZ.
- No payment credentials.
- No production hardening guarantees.

Implication:
- Suitable for workshops and demos only.

## 12. Evolution Plan for FR5 and FR6

### 12.1 FR5 Launch lifecycle states

Implemented model extension:
- Add launchStatus field with states:
  - scheduled
  - confirmed
  - successful
  - cancelled
  - suspended

Implemented transition policy (service-enforced):
- scheduled -> confirmed | cancelled
- confirmed -> successful | cancelled | suspended
- suspended -> confirmed | cancelled
- successful -> terminal
- cancelled -> terminal

API impact:
- Keep existing launch CRUD.
- Add explicit status transition operation in launches service/route.
- Reject invalid transitions with 400 and explicit errors.

### 12.2 FR6 Payment and refund processing

Planned architecture addition:
- Introduce internal payment adapter abstraction (mock implementation only).
- Record payment/refund outcome in booking domain metadata.

Behavioral rules:
- Booking create triggers mock charge attempt.
- Booking cancellation triggers mock refund policy evaluation.
- Seat restoration must remain consistent even if payment fails.

Brownfield-safe approach:
- Keep single-process orchestration in booking service.
- Add compensating logic to preserve launch seat consistency.
- Avoid introducing external infrastructure.

## 13. Architecture Decision Records (Concise ADRs)

### ADR-01 Layered monolith for clarity

Status: Accepted

Decision:
- Keep a single deployable service with routes, services, and types layers.

Rationale:
- Maximizes readability and teaching value for backend fundamentals.

Consequences:
- Simple and testable architecture.
- Limited independent scaling of components.

### ADR-02 In-memory Map storage

Status: Accepted

Decision:
- Use Map-based repositories with incremental IDs.

Rationale:
- Zero setup, deterministic behavior for workshops.

Consequences:
- Fast local usage.
- State loss on restart; no persistence guarantees.

### ADR-03 Validation in services

Status: Accepted

Decision:
- Concentrate business validation in service layer, not routes.

Rationale:
- Centralized rule enforcement and reusable logic.

Consequences:
- Consistent behavior across endpoints.
- Requires explicit error mapping at route boundary.

### ADR-04 Explicit HTTP contract

Status: Accepted

Decision:
- Enforce 201/200/204 success and 400/404 error mapping.

Rationale:
- Predictable API behavior for training and testing.

Consequences:
- Cleaner E2E assertions.
- Requires disciplined route helper usage.

### ADR-05 Dual test strategy

Status: Accepted

Decision:
- Keep Vitest for service unit tests and Playwright for API E2E tests.

Rationale:
- Combines fast logic feedback with full contract verification.

Consequences:
- Strong confidence in behavior.
- Two test frameworks to maintain.

### ADR-06 No auth and no real payments in core scope

Status: Accepted

Decision:
- Keep security and payment integrations out of production-grade scope.

Rationale:
- Preserve focus on core domain workflows.

Consequences:
- Simpler system and onboarding.
- Not suitable for production deployment.

### ADR-07 FR5 state machine via domain rules

Status: Proposed

Decision:
- Implement launch lifecycle as explicit transition rules in launch service.

Rationale:
- Prevent invalid lifecycle jumps and encode policy transparently.

Consequences:
- Clear domain behavior.
- Additional validation paths and test matrix.

### ADR-08 FR6 payment adapter with mock gateway

Status: Proposed

Decision:
- Add payment/refund adapter abstraction with in-process mock implementation.

Rationale:
- Enables realistic flow without external dependencies.

Consequences:
- Better training realism.
- Requires compensation logic to avoid seat/payment inconsistencies.

### ADR-09 Global CORS enablement

Status: Proposed

Decision:
- Enable CORS globally for all routes and methods, including preflight OPTIONS handling.

Rationale:
- Browser-based tools and demos require cross-origin access across all resource endpoints.

Consequences:
- Improved interoperability for frontend clients and API explorers.
- Broader origin access surface, acceptable for current training scope.
