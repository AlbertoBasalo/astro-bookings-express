# AstroBookings Product Requirements Document

A fictional space travel booking system backend API designed for training sessions and demonstrations, enabling bookings for rocket launches with comprehensive management capabilities.

## Vision and Scope

AstroBookings aims to provide a complete backend solution for managing space travel bookings, from rocket fleet management to launch scheduling and customer reservations. The system demonstrates real-world API design patterns and business logic implementation in a simplified, educational context.

The target users include training participants, developers learning backend development, and demonstration audiences. The product solves the need for a realistic, comprehensive example of a booking system with domain-specific business rules and validation logic.

### Scope

The system covers:
- Rocket fleet management with CRUD operations
- Launch scheduling with capacity validation
- Customer registration and management
- Booking creation with seat allocation
- Payment processing through mock gateway
- Launch lifecycle management (scheduled → confirmed → successful/cancelled/suspended)

Out of scope for initial phase:
- Authentication and authorization mechanisms
- Persistent database storage (in-memory only)
- Production-grade security features
- Real payment gateway integration
- Admin user interface

## Functional Requirements

### FR1 Rocket Fleet Management
- **Description**: System administrators can create, read, update, and delete rocket definitions with name, range (suborbital/orbital/moon/mars), and capacity (1-10 seats).
- **Priority**: High
- **Status**: Implemented

### FR2 Launch Scheduling
- **Description**: System operators can schedule launches for specific rockets with pricing, dates, and minimum passenger thresholds.
- **Priority**: High
- **Status**: Implemented
	- Endpoints: `/launches` with create (POST), list (GET), detail (GET /:id), update (PUT /:id), and delete (DELETE /:id)
	- Validation: future `launchDateTime`, positive `price`, `minPassengers` within rocket capacity, and valid `rocketId`
	- Derived fields: `availableSeats` initialized to linked rocket capacity

### FR3 Customer Management
- **Description**: The system maintains customer records identified by email, including name and phone number for booking purposes.
- **Priority**: High
- **Status**: Implemented

### FR4 Booking Creation
- **Description**: Customers can book one or more seats on a launch, with validation against rocket capacity and available seats.
- **Priority**: High
- **Status**: NotStarted

### FR5 Launch Lifecycle Management
- **Description**: Launches transition through defined states (scheduled → confirmed → successful) with cancellation and suspension paths based on business rules.
- **Priority**: Medium
- **Status**: NotStarted

### FR6 Payment Processing
- **Description**: Customer bookings trigger billing upon confirmation with processing through a mock payment gateway.
- **Priority**: Medium
- **Status**: NotStarted

### FR7 Capacity Validation
- **Description**: All booking and launch requests validate against rocket seating capacity to prevent overbooking.
- **Priority**: High
- **Status**: NotStarted

## Technical Requirements

### TR1 TypeScript + Express API
- **Description**: Backend implemented using TypeScript 5.9.3 with Express 5.2.1 framework for type-safe RESTful API development.
- **Priority**: High
- **Status**: Implemented

### TR2 In-Memory Storage
- **Description**: Data persistence uses Map-based in-memory storage without external database dependencies for simplified deployment and testing.
- **Priority**: High
- **Status**: Implemented

### TR3 Comprehensive API Testing
- **Description**: End-to-end test coverage using Playwright 1.57.0 to validate all API endpoints and business rules.
- **Priority**: High
- **Status**: Implemented

### TR4 Input Validation
- **Description**: All API endpoints validate request data with appropriate HTTP status codes (400 for validation errors, 404 for not found, 201 for creation).
- **Priority**: High
- **Status**: Implemented

### TR5 Development Workflow
- **Description**: Support for development mode (tsx), production build (tsc), and type-checking with npm scripts for efficient development experience.
- **Priority**: Medium
- **Status**: Implemented
