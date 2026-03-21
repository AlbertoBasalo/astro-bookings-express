# AstroBookings Product Requirements Document

## Product Summary
AstroBookings is a training backend API for managing space travel bookings.
It provides REST resources for rockets, launches, customers, and bookings with in-memory storage and validation-focused business logic.

## Vision and Scope
The product demonstrates practical backend architecture and API design patterns for workshops and learning.

### In Scope
- Rocket management.
- Launch scheduling tied to rockets.
- Customer profile management.
- Booking management with seat availability control and total price calculation.
- Validation-first API behavior with explicit HTTP status codes.

### Out of Scope
- Authentication and authorization.
- Persistent database storage.
- Production-grade security hardening.
- Real payment provider integrations.
- UI or admin frontend.

## Functional Requirements

### FR1 Rocket Fleet Management
- Description: Users can create, list, read, update, and delete rockets with name, range, and capacity.
- Priority: High
- Status: Implemented

### FR2 Launch Scheduling and Capacity Baseline
- Description: Users can create, list, read, update, and delete launches linked to an existing rocket, with validation for future launchDateTime, positive price, and minPassengers within rocket capacity. availableSeats is initialized from rocket capacity.
- Priority: High
- Status: Implemented

### FR3 Customer Management
- Description: Users can create, list, read, update, and delete customers identified by email, including validation for email, name, and phone formats.
- Priority: High
- Status: Implemented

### FR4 Booking Management with Seat and Price Logic
- Description: Users can create, list, read, update, and delete bookings. Booking operations validate customer and launch references, enforce seat limits and launch availability, update launch availableSeats on create/update/delete, and compute totalPrice as seats x launch price.
- Priority: High
- Status: Implemented

### FR5 Launch Lifecycle State Management
- Description: Launches can move through explicit business states such as scheduled, confirmed, successful, cancelled, or suspended with transition rules.
- Priority: Medium
- Status: Implemented

### FR6 Payment and Refund Processing
- Description: Booking creation triggers payment handling through a mock gateway, and cancellation supports refund rules based on timing.
- Priority: Medium
- Status: NotStarted

## Technical Requirements

### TR1 Type-Safe Layered API
- Description: Implement backend using TypeScript and Express with layered flow from routes to services to types.
- Priority: High
- Status: Implemented

### TR2 In-Memory Map Storage
- Description: Store entities in memory using Map collections and incremental IDs for rocket, launch, and booking records.
- Priority: High
- Status: Implemented

### TR3 API Validation and Error Contract
- Description: Enforce request validation in services and return standard HTTP results: 201 for create, 200 for reads/updates, 204 for delete, 400 for validation errors, and 404 for missing entities.
- Priority: High
- Status: Implemented

### TR4 Automated Test Coverage
- Description: Maintain unit tests for service logic and end-to-end API tests for resource behavior and acceptance criteria.
- Priority: High
- Status: Implemented

## Current Inconsistencies to Track
- Payment and refund behavior is documented in product docs, but there is no payment gateway abstraction, no billing workflow, and no refund workflow in the current implementation.
- Capacity validation was previously marked as not started in the PRD, but it is already implemented across launch and booking flows.
