# Launch Scheduling Specification

- **Reference**: [PRD](/PRD.md) FR2 Launch Scheduling
- **Issue**: [#2](https://github.com/AlbertoBasalo/astro-bookings-express/issues/2)
- **Status**: Draft

## Problem Description

Launch operations need a way to schedule future flights for specific rockets with clear pricing and minimum passenger thresholds so that sales, capacity management, and downstream processes can rely on an authoritative launch plan.

### User Stories

- As a system operator, I want to schedule a launch for a chosen rocket with date, price, and minimum passenger count so that I can open the launch for booking.
- As a booking system, I want to list and retrieve launch schedules with their pricing and capacity details so that bookings can validate seat availability and fares.
- As a system operator, I want to update or cancel a launch schedule so that incorrect or outdated launch plans do not remain available.

## Solution Overview

### User/App interface

- Provide a RESTful `/launches` resource supporting create, list, detail, update, and delete operations for launch schedules.
- Each launch record exposes its rocket identifier, launch datetime, price per seat, minimum passenger threshold, and available seats based on the linked rocket capacity.

### Model and logic

- Launch contains a generated identifier, `rocketId` reference, `launchDateTime` (future ISO timestamp), `price` (positive numeric), `minPassengers` (integer within rocket capacity), and derived `availableSeats` starting at the rocket capacity.
- Validation aggregates errors: non-existent rocket references, past or invalid dates, non-positive prices, and minimum passenger counts outside 1..capacity.
- Updates revalidate all editable fields and preserve linkage to the selected rocket.

### Persistence

- Store launch schedules in in-memory collections aligned with existing Map-based storage, with IDs using the `resource-{id}` pattern.

## Acceptance Criteria

- [ ] WHEN a POST request is made to `/launches` with valid `rocketId`, future `launchDateTime`, positive `price`, and `minPassengers` within the rocket capacity, THEN THE System SHALL create the launch, set `availableSeats` to the rocket capacity, and return HTTP 201 with the launch payload.
- [ ] WHEN a POST request is made to `/launches` with a `rocketId` that does not exist, THEN THE System SHALL return HTTP 400 detailing that the rocket reference is invalid.
- [ ] WHEN a POST request is made to `/launches` with `launchDateTime` missing, malformed, or in the past, THEN THE System SHALL return HTTP 400 describing the date validation errors.
- [ ] WHEN a POST request is made to `/launches` with `price` less than or equal to zero or `minPassengers` outside the range 1..capacity, THEN THE System SHALL return HTTP 400 listing the corresponding validation errors.
- [ ] WHEN a GET request is made to `/launches`, THEN THE System SHALL return HTTP 200 with a JSON array of all launch schedules.
- [ ] WHEN a GET request is made to `/launches/:id` for an existing launch, THEN THE System SHALL return HTTP 200 with the launch schedule payload.
- [ ] WHEN a GET request is made to `/launches/:id` for a non-existent launch, THEN THE System SHALL return HTTP 404 indicating the launch was not found.
- [ ] WHEN a PUT request is made to `/launches/:id` with valid updates to `launchDateTime`, `price`, or `minPassengers`, THEN THE System SHALL revalidate all fields, persist changes, and return HTTP 200 with the updated launch.
- [ ] WHEN a DELETE request is made to `/launches/:id`, THEN THE System SHALL remove the launch schedule and return HTTP 204 with no body.
