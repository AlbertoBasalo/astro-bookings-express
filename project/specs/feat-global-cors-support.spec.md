# Feature Specification: Global CORS Support

> Status: Implemented

## 1. Problem Definition

Browser clients cannot reliably consume AstroBookings endpoints from a different origin unless the API explicitly supports CORS.
The product now includes a technical requirement to allow CORS calls for every endpoint and method, but implementation details and acceptance criteria are not yet specified.

Current impact:
- Frontend demos hosted on different ports/domains may fail due to blocked cross-origin requests.
- Preflight OPTIONS requests may fail, preventing non-simple requests from reaching API routes.
- Behavior is undefined across all resources (`/rockets`, `/launches`, `/customers`, `/bookings`, root, and health).

## 2. Solution Outline

Implement global CORS handling at the Express app level so that all routes and methods consistently support cross-origin access.

### 2.1 Scope

In scope:
- Enable CORS middleware globally in the server bootstrap.
- Ensure preflight OPTIONS requests are handled for all routes.
- Apply behavior uniformly to all existing endpoints and future endpoints by default.
- Preserve existing API responses and status-code contracts for non-CORS functionality.

Out of scope:
- Authentication/authorization origin policies.
- Dynamic per-tenant or per-user origin restrictions.
- Production-grade hardening beyond training scope.

### 2.2 Functional Behavior

1. All API endpoints must include CORS headers on responses to cross-origin requests.
2. Preflight OPTIONS requests must receive successful responses with the expected CORS headers.
3. All relevant HTTP methods used by the API (`GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS`) must be supported in CORS policy.
4. Existing endpoint behavior (payloads, validations, status codes) must remain unchanged apart from added CORS headers.

### 2.3 Technical Design

Implementation approach:
- Add and configure CORS middleware in `src/index.ts` before route registration.
- Use app-level middleware so route files remain focused on HTTP-resource logic.
- Keep configuration simple and explicit for training context (permissive origin policy unless future constraints are introduced).

Suggested middleware ordering:
1. CORS middleware
2. JSON parser middleware
3. Route registration

### 2.4 Validation and Error Handling

- CORS setup must not interfere with existing validation error contracts (`400`) or not-found handling (`404`).
- OPTIONS handling should not produce route-level validation errors.
- Server should continue to return normal status codes for non-preflight requests.

## 3. Acceptance Criteria

### AC1 Global Coverage
Given any existing API endpoint, when called from a different origin, then the response includes valid CORS headers.

### AC2 Preflight Support
Given a browser preflight request (OPTIONS) to any API route, when the request is processed, then the API returns a successful preflight response with required CORS headers.

### AC3 Method Coverage
Given cross-origin calls using `GET`, `POST`, `PUT`, `DELETE`, or `OPTIONS`, when sent to supported endpoints, then CORS policy allows them.

### AC4 No Behavioral Regression
Given current endpoint tests and service rules, when CORS is enabled, then existing route behavior and status code contracts remain unchanged.

### AC5 Test Coverage
Given the new CORS requirement, when tests are run, then automated coverage includes at least one E2E assertion for:
- CORS headers on a normal endpoint response.
- Successful OPTIONS preflight response.

## 4. Implementation Tasks

1. Add CORS dependency and TypeScript types.
2. Configure global CORS middleware in `src/index.ts`.
3. Add/extend E2E tests in `tests` to validate headers and preflight.
4. Run unit and E2E test suites.
5. Update docs if needed (PRD/ADD already updated).

## 5. Risks and Mitigations

Risk:
- Overly permissive CORS may be unsuitable for production use.
Mitigation:
- Keep permissive policy documented as training-scope decision; allow future tightening via configuration.

Risk:
- Middleware order issues can cause missing headers.
Mitigation:
- Place CORS middleware early in app bootstrap and verify with tests.

## 6. Definition of Done

- CORS middleware is globally active.
- Preflight requests succeed across routes.
- Automated tests cover key CORS behavior.
- Existing API contract remains stable.
- Feature implementation is documented and traceable to TR5 / ADR-09.
