# Implementation Plan for feat-booking-creation.spec

**TL;DR:**  
Implement the booking creation feature with full CRUD operations. Create booking types, service with validation logic (seat availability, customer/launch existence), routes with RESTful endpoints, unit tests for service layer, and E2E tests for API contracts. Follow layered architecture: types → service → routes → tests.

## Steps

### Step 0: Prepare Git Branch
Create a new branch for this feature implementation
- [ ] Create branch `feat/booking-creation` from main

### Step 1: Define Booking Type and Contracts
Create type definitions for booking domain model and validation
- [ ] Create `src/types/booking.ts` with `Booking`, `CreateBookingRequest`, `UpdateBookingRequest` interfaces
- [ ] Define validation error types for booking-specific errors
- [ ] Add TypeScript strict types for all properties (id, customerEmail, launchId, seats, totalPrice)

### Step 2: Implement Booking Service
Build the service layer with business logic and validation
- [ ] Create `src/services/bookingService.ts` with `BookingService` class
- [ ] Implement in-memory Map storage with auto-increment ID pattern `booking-{number}`
- [ ] Implement `create()` method with validation: customer exists, launch exists, seats available (1-10 range, <= availableSeats)
- [ ] Implement `getAll()` and `getById()` methods for retrieval operations
- [ ] Implement `update()` method with seat adjustment logic (update availableSeats on launch)
- [ ] Implement `delete()` method with seat release logic (restore availableSeats on launch)
- [ ] Add helper method `calculateTotalPrice(seats, launchPrice)` for price calculation
- [ ] Inject `CustomerService` and `LaunchService` dependencies for cross-reference validation
- [ ] Implement seat availability tracking: decrement on create, adjust on update, increment on delete

### Step 3: Create Unit Tests for Booking Service
Test business logic and validation rules in isolation
- [ ] Create `src/services/bookingService.spec.ts`
- [ ] Test booking creation with valid data (happy path)
- [ ] Test validation errors: non-existent customer, non-existent launch, invalid seats (0, negative, > 10)
- [ ] Test seat availability validation: overbooking prevention, capacity checks
- [ ] Test total price calculation accuracy
- [ ] Test booking update with seat changes and availableSeats adjustment
- [ ] Test booking deletion and seat restoration
- [ ] Test auto-increment ID generation pattern

### Step 4: Implement Booking Routes
Create RESTful API endpoints with proper HTTP handling
- [ ] Create `src/routes/bookings.ts` with Express router
- [ ] Implement POST `/bookings` endpoint: validate request body, call service.create(), return 201 with booking data
- [ ] Implement GET `/bookings` endpoint: call service.getAll(), return 200 with array
- [ ] Implement GET `/bookings/:id` endpoint: call service.getById(), return 200 or 404
- [ ] Implement PUT `/bookings/:id` endpoint: validate request body, call service.update(), return 200 or 404
- [ ] Implement DELETE `/bookings/:id` endpoint: call service.delete(), return 204 or 404
- [ ] Add error handling for validation errors (400) and not found errors (404)
- [ ] Register bookings router in `src/index.ts` with `/bookings` path

### Step 5: Create E2E Tests for Booking API
Test complete API contracts and integration scenarios
- [ ] Create `tests/bookings.spec.ts` with Playwright test suite
- [ ] Test POST `/bookings` with valid data returns 201 and correct booking structure
- [ ] Test POST with non-existent customer returns 400 with appropriate error
- [ ] Test POST with non-existent launch returns 400 with appropriate error
- [ ] Test POST with insufficient available seats returns 400
- [ ] Test POST with invalid seats (zero, negative, > 10) returns 400
- [ ] Test POST with missing required fields returns 400 with all validation errors
- [ ] Test GET `/bookings` returns 200 with array of all bookings
- [ ] Test GET `/bookings/:id` with existing ID returns 200 with booking data
- [ ] Test GET with non-existent ID returns 404
- [ ] Test PUT with valid updates returns 200 and adjusts availableSeats correctly
- [ ] Test DELETE with existing ID returns 204 and restores availableSeats

### Step 6: Integration Testing and Validation
Verify cross-service interactions and data consistency
- [ ] Test booking creation decrements launch availableSeats correctly
- [ ] Test booking update adjusts availableSeats by seat difference
- [ ] Test booking deletion increments launch availableSeats correctly
- [ ] Test multiple bookings on same launch respect total capacity
- [ ] Verify totalPrice calculation matches seats × launch.price in all scenarios
- [ ] Run `npm run test:unit` to verify all service tests pass
- [ ] Run `npm run test` to verify all E2E tests pass

### Step 7: Code Review and Documentation
Final review and cleanup before merge
- [ ] Review code for TypeScript strict mode compliance
- [ ] Verify all validation rules match specification requirements
- [ ] Ensure error messages are clear and match acceptance criteria
- [ ] Confirm logging statements use `logger.info/error` appropriately
- [ ] Run `npm run typecheck` to verify no type errors
- [ ] Update CHANGELOG.md with feature description
- [ ] Commit changes with message `feat: implement booking creation with seat management`

## Verification Checklist

- [ ] All 13 acceptance criteria from spec are covered by tests
- [ ] Unit tests pass: `npm run test:unit`
- [ ] E2E tests pass: `npm run test`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Development server runs without errors: `npm run dev`
- [ ] Booking creation decrements availableSeats on launch
- [ ] Booking deletion restores availableSeats on launch
- [ ] Booking update correctly adjusts availableSeats (increase or decrease)
- [ ] Cannot overbook beyond rocket capacity
- [ ] TotalPrice calculated correctly as seats × launch.price

## Dependencies and Considerations

- **Service Dependencies**: BookingService requires CustomerService (email validation) and LaunchService (launch validation, seat management)
- **Data Consistency**: Seat availability must be transactional - update launch availableSeats atomically with booking operations
- **Validation Order**: Check customer exists → check launch exists → check seats available → create booking
- **Error Handling**: Return all validation errors at once (not fail-fast)
- **ID Pattern**: Follow existing pattern `booking-{number}` with auto-increment
- **Price Calculation**: Always recalculate on create/update, don't trust client input
