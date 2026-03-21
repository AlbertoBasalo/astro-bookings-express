# Launch Lifecycle State Management Specification

- **Reference**: [PRD](../PRD.md) FR5 Launch Lifecycle Management
- **Slug**: feat-launch-lifecycle-management
- **Type**: feat
- **Status**: Verified

## Problem Description

Launches currently support basic CRUD operations but do not enforce lifecycle progression. Without explicit state transitions, operations can move launches into inconsistent operational states, and dependent behaviors like booking eligibility are ambiguous. The system needs a clear, testable lifecycle model so launch operations remain predictable and auditable.

### User Stories

- As a launch operator, I want to move a launch through defined lifecycle states so that operations follow consistent business rules.
- As a booking operator, I want launch state to control booking eligibility so that customers cannot book unavailable launches.
- As a system administrator, I want invalid lifecycle transitions to be rejected with clear errors so that data integrity is preserved.

## Solution Overview

### User/App interface

- Extend launch API behavior to expose current lifecycle state in launch responses.
- Provide a dedicated lifecycle transition action on a launch resource where an operator requests a target state change.
- Return clear validation errors for unsupported transitions, missing launch records, and state-based operation restrictions.

### Model and logic

- Define lifecycle states: scheduled, confirmed, suspended, successful, cancelled.
- Enforce explicit transition rules:
  - scheduled to confirmed or cancelled
  - confirmed to successful, suspended, or cancelled
  - suspended to confirmed or cancelled
  - successful and cancelled are terminal states
- Require transition validation before applying any state change.
- Apply state-based booking rule: only scheduled and confirmed launches are eligible for new bookings.

### Persistence

- Persist lifecycle state as part of each launch record in existing in-memory Map storage.
- Persist transition metadata needed for traceability (at minimum, updated timestamp; optional reason where required by rule).
- Keep lifecycle data and booking eligibility checks consistent across reads and updates.

## Acceptance Criteria

- [ ] WHEN a launch is created THEN THE System SHALL set its initial lifecycle state to scheduled.
- [ ] WHEN a launch is retrieved from list or detail endpoints THEN THE System SHALL include its current lifecycle state.
- [ ] WHEN a valid lifecycle transition is requested according to the defined transition rules THEN THE System SHALL update the launch state and return HTTP 200 with the updated launch.
- [ ] IF a lifecycle transition is requested that is not allowed from the current state THEN THE System SHALL return HTTP 400 with a validation error describing the invalid transition.
- [ ] WHEN a lifecycle transition is requested for a launch that does not exist THEN THE System SHALL return HTTP 404.
- [ ] WHILE a launch is in successful state THE System SHALL reject any further lifecycle transition requests with HTTP 400.
- [ ] WHILE a launch is in cancelled state THE System SHALL reject any further lifecycle transition requests with HTTP 400.
- [ ] WHILE a launch is in suspended, cancelled, or successful state THE System SHALL reject new booking creation for that launch with HTTP 400.
- [ ] WHEN a launch changes lifecycle state THEN THE System SHALL persist the new state and transition timestamp in in-memory storage so subsequent reads return the updated lifecycle data.
