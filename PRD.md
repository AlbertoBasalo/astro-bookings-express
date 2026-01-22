# AstroBookings Product Requirements Document

A fictional space travel booking system backend API designed for training sessions and demonstrations, enabling customers to book seats on scheduled rocket launches to various destinations in space.

## Vision and Scope

AstroBookings aims to provide a comprehensive backend system for managing space travel bookings, from rocket fleet management to launch scheduling and customer reservations. The system addresses the need for a demonstration platform that showcases modern API development practices while simulating real-world space tourism operations.

The target users are training participants, developers learning API development, and demonstration audiences who need to understand how a booking system works. The system solves the problem of having a realistic yet simplified booking platform for educational purposes without the complexity of production-grade security and infrastructure.

### Scope

**In Scope:**
- Rocket fleet management (CRUD operations)
- Launch scheduling and lifecycle management
- Customer registration and management
- Booking system with seat allocation
- Payment processing (mock gateway)
- Capacity validation and business rules

**Out of Scope:**
- Production-grade security and authentication
- Persistent database storage (initial phase uses in-memory storage)
- Payment gateway integrations with real providers
- User interface/frontend application
- Multi-tenancy or organization management

## Functional Requirements

### {FR1} Rocket Fleet Management
- **Description**: Administrators can create, read, update, and delete rocket definitions including name, range capability, and passenger capacity.
- **Priority**: High
- **Status**: Implemented

### {FR2} Launch Scheduling
- **Description**: System operators can schedule launches for specific rockets with pricing, minimum passenger thresholds, and destination information.
- **Priority**: High
- **Status**: NotStarted

### {FR3} Launch Status Lifecycle
- **Description**: Launches transition through states (scheduled → confirmed → successful) with support for cancellation and suspension paths based on business rules.
- **Priority**: High
- **Status**: NotStarted

### {FR4} Customer Management
- **Description**: Customers can be registered and identified by email address with associated name and phone number information.
- **Priority**: High
- **Status**: NotStarted

### {FR5} Booking Creation
- **Description**: Customers can book multiple seats on a launch with validation against available capacity and rocket limits.
- **Priority**: High
- **Status**: NotStarted

### {FR6} Payment Processing
- **Description**: Customers are billed upon booking with payments processed through a mock payment gateway for demonstration purposes.
- **Priority**: Medium
- **Status**: NotStarted

### {FR7} Capacity Validation
- **Description**: System validates that bookings do not exceed rocket seat capacity and enforces minimum passenger thresholds for launch confirmation.
- **Priority**: High
- **Status**: NotStarted

## Technical Requirements

### {TR1} RESTful API Architecture
- **Description**: All functionality exposed through REST endpoints with JSON payloads following standard HTTP methods and status codes.
- **Priority**: High
- **Status**: Implemented

### {TR2} TypeScript Implementation
- **Description**: Backend implemented in TypeScript 5.9+ with Express 5.2+ framework for type safety and modern development practices.
- **Priority**: High
- **Status**: Implemented

### {TR3} In-Memory Data Storage
- **Description**: Initial implementation uses Map-based in-memory storage without database requirements for simplicity in training environments.
- **Priority**: High
- **Status**: Implemented

### {TR4} Automated Testing
- **Description**: Comprehensive test coverage using Playwright for end-to-end API testing with clear acceptance criteria validation.
- **Priority**: High
- **Status**: InProgress

### {TR5} Input Validation
- **Description**: All API endpoints validate input data with appropriate error messages and HTTP status codes for invalid requests.
- **Priority**: High
- **Status**: Implemented
