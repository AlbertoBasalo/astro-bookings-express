# Booking Creation Specification

- **Reference**: [PRD](../PRD.md) FR4 Booking Creation
- **Type**: feat
- **Status**: Planned

## Problem Description

Customers need a way to reserve seats on scheduled launches. Without a booking system, there is no mechanism to allocate launch capacity to specific customers, track seat availability, or calculate total pricing. The system must validate bookings against rocket capacity and available seats to prevent overbooking while allowing customers to book multiple seats in a single transaction.

### User Stories

- As a customer, I want to **book one or more seats on a scheduled launch** so that I can secure my place on the space travel.
- As a booking operator, I want to **create bookings on behalf of customers** so that I can process reservations through the system.
- As a system administrator, I want to **view all bookings and retrieve booking details** so that I can track launch capacity utilization and customer reservations.

## Solution Overview

### User/App interface

RESTful API endpoints at `/bookings`:
- POST `/bookings` - Create new booking with seat allocation
- GET `/bookings` - List all bookings
- GET `/bookings/:id` - Get booking details by ID
- PUT `/bookings/:id` - Update booking (seats or launch)
- DELETE `/bookings/:id` - Cancel booking and release seats

Request/Response format: JSON

### Model and logic

Booking model:
- `id` (string, auto-generated, pattern: `booking-{number}`)
- `customerEmail` (string, required, must reference existing customer)
- `launchId` (string, required, must reference existing launch)
- `seats` (number, required, integer 1-10, must not exceed available seats)
- `totalPrice` (number, calculated, seats × launch price)

Validation rules:
- Customer email must reference an existing customer record
- Launch ID must reference an existing scheduled launch
- Seats must be a positive integer between 1 and 10
- Total requested seats across all bookings for a launch cannot exceed rocket capacity
- Available seats on the launch must accommodate the booking
- When updating booking, new seat count validation applies
- When deleting booking, seats are released back to launch available seats

Business logic:
- On booking creation: decrease launch `availableSeats` by booked `seats`
- On booking update: adjust launch `availableSeats` by seat difference
- On booking deletion: increase launch `availableSeats` by released `seats`
- Calculate `totalPrice` as `seats × launch.price`

### Persistence

In-memory Map-based storage with auto-increment ID pattern `booking-{number}`.
Bookings reference customers by email and launches by ID.

## Acceptance Criteria

- [ ] WHEN a POST request is received at `/bookings` with valid `customerEmail`, `launchId`, and `seats` THEN THE system SHALL create the booking, update launch available seats, calculate total price, and return status 201 with the booking data.
- [ ] WHEN a POST request is received at `/bookings` with a non-existent `customerEmail` THEN THE system SHALL return status 400 with error message "Customer not found".
- [ ] WHEN a POST request is received at `/bookings` with a non-existent `launchId` THEN THE system SHALL return status 400 with error message "Launch not found".
- [ ] WHEN a POST request is received at `/bookings` where `seats` exceeds available seats on the launch THEN THE system SHALL return status 400 with error message "Not enough available seats".
- [ ] WHEN a POST request is received at `/bookings` with invalid `seats` (zero, negative, or non-integer) THEN THE system SHALL return status 400 with validation error.
- [ ] WHEN a POST request is received at `/bookings` with missing required fields THEN THE system SHALL return status 400 with all validation errors.
- [ ] WHEN a GET request is received at `/bookings` THEN THE system SHALL return status 200 with an array of all booking records including calculated total prices.
- [ ] WHEN a GET request is received at `/bookings/:id` with an existing booking ID THEN THE system SHALL return status 200 with the booking data.
- [ ] WHEN a GET request is received at `/bookings/:id` with a non-existent booking ID THEN THE system SHALL return status 404.
- [ ] WHEN a PUT request is received at `/bookings/:id` with valid seat count changes THEN THE system SHALL update the booking, adjust launch available seats accordingly, recalculate total price, and return status 200 with updated data.
- [ ] WHEN a DELETE request is received at `/bookings/:id` with an existing booking ID THEN THE system SHALL remove the booking, restore seats to launch available seats, and return status 204.
- [ ] WHERE booking creation THE system SHALL decrement the launch available seats by the number of booked seats.
- [ ] WHERE booking deletion THE system SHALL increment the launch available seats by the number of released seats.
