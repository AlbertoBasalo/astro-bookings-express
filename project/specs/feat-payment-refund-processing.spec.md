# Payment and Refund Processing Specification

- **Reference**: [PRD](../PRD.md) FR6 Payment Processing
- **Type**: feat
- **Status**: Draft

## Problem Description

Booking creation currently reserves seats and calculates price, but does not perform billing. Booking cancellation also does not process refunds. This leaves booking outcomes incomplete for training scenarios and creates risk of seat and money state drifting apart. The system needs a mock charge on booking creation and a mock refund on booking cancellation, with clear consistency rules for both successful and failed payment actions.

### User Stories

- As a booking operator, I want to **charge a booking during creation** so that only financially confirmed bookings are stored.
- As a booking operator, I want **cancellation to trigger a refund** so that customers are reimbursed when a booking is canceled.
- As a system maintainer, I want **payment and seat state changes to stay consistent** so that launch capacity and financial status never conflict.

## Solution Overview

### User/App interface

- Keep booking create and booking cancel as the main integration points.
- On booking create, trigger a mock charge as part of the request flow.
- On booking cancel, trigger a mock refund as part of the request flow.
- Include payment outcome details in booking responses so callers can verify charge or refund result.

### Model and logic

- Extend booking domain behavior to include payment lifecycle states relevant to training:
  - charged for successful booking creation
  - refunded for successful cancellation
- Apply transactional consistency rules at business level:
  - Create succeeds only when seat allocation and charge both succeed.
  - Cancel succeeds only when refund and seat release both succeed.
- Define deterministic failure handling:
  - If charge fails, booking is not created and seats remain unchanged.
  - If refund fails, cancellation is not completed and seats remain allocated.
- Use an internal mock payment adapter with predictable success and failure behavior for testing flows.

### Persistence

- Keep all state in in-memory maps.
- Persist booking financial state together with booking data.
- Persist mock payment and refund transaction records with references to booking id and amount.
- Ensure seat availability and payment records are updated atomically from the API consumer perspective.

## Acceptance Criteria

- [ ] WHEN a valid booking creation request is received THEN THE AstroBookings API SHALL attempt a mock charge for the booking total before finalizing creation.
- [ ] WHEN seat allocation and mock charge both succeed THEN THE AstroBookings API SHALL create the booking with charged payment status, decrement available seats, and return 201.
- [ ] IF mock charge fails during booking creation THEN THE AstroBookings API SHALL return a payment failure response, SHALL NOT create the booking, and SHALL NOT change available seats.
- [ ] WHEN a cancellation request is received for an existing charged booking THEN THE AstroBookings API SHALL attempt a mock refund for the full booking amount.
- [ ] WHEN mock refund succeeds for a cancellation request THEN THE AstroBookings API SHALL mark booking as refunded and canceled, release the booked seats, and return 204.
- [ ] IF mock refund fails during cancellation THEN THE AstroBookings API SHALL return a refund failure response, SHALL NOT cancel the booking, and SHALL NOT release seats.
- [ ] WHEN booking data is retrieved after successful charge or refund events THEN THE AstroBookings API SHALL expose the current payment status and related transaction identifiers.
- [ ] WHERE payment and seat updates are part of booking create or cancel flows THE AstroBookings API SHALL keep financial state and seat availability consistent after each request.
- [ ] WHEN booking create or cancel validation fails before payment processing THEN THE AstroBookings API SHALL return 400 with validation errors and SHALL NOT invoke mock charge or refund.
