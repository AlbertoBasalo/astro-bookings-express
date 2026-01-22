# Customer Management Specification

- **Reference**: [PRD](/PRD.md) FR3
- **Issue**: [#3](https://github.com/AlbertoBasalo/astro-bookings-express/issues/3)
- **Status**: Planned

## Problem Description

The system needs to maintain customer records for booking purposes. Without a customer management system, there is no way to track who is making bookings, contact them, or associate bookings with specific travelers. Customers must be uniquely identified and have their contact information stored for communication and booking association.

### User Stories

- As a booking operator, I want to **register customers with their contact details** so that I can associate bookings with specific travelers.
- As a system administrator, I want to **retrieve customer information by email** so that I can verify existing customers before creating bookings.
- As a customer service agent, I want to **update customer contact information** so that customers can keep their records current.

## Solution Overview

### User/App interface

RESTful API endpoints at `/customers`:
- POST `/customers` - Create new customer record
- GET `/customers` - List all customers
- GET `/customers/:email` - Get customer details by email (URL-encoded)
- PUT `/customers/:email` - Update customer information
- DELETE `/customers/:email` - Remove customer record

Request/Response format: JSON

### Model and logic

Customer model:
- `email` (string, required, unique identifier, valid email format)
- `name` (string, required, 2-100 characters)
- `phone` (string, required, valid phone format)

Validation rules:
- Email must be unique across all customers
- Email must be valid format
- Name cannot be empty and must be between 2-100 characters
- Phone must match international format pattern

### Persistence

In-memory Map-based storage with email as key.

## Acceptance Criteria

- [ ] WHEN a POST request is received at `/customers` with valid customer data THEN THE system SHALL create the customer record and return status 201 with the customer data.
- [ ] WHEN a POST request is received at `/customers` with an existing email THEN THE system SHALL return status 400 with error message "Email already exists".
- [ ] WHEN a POST request is received at `/customers` with invalid data THEN THE system SHALL return status 400 with all validation errors.
- [ ] WHEN a GET request is received at `/customers` THEN THE system SHALL return status 200 with an array of all customer records.
- [ ] WHEN a GET request is received at `/customers/:email` with an existing email THEN THE system SHALL return status 200 with the customer data.
- [ ] WHEN a GET request is received at `/customers/:email` with a non-existing email THEN THE system SHALL return status 404.
- [ ] WHEN a PUT request is received at `/customers/:email` with valid update data THEN THE system SHALL update the customer record and return status 200 with updated data.
- [ ] WHEN a DELETE request is received at `/customers/:email` with an existing email THEN THE system SHALL remove the customer record and return status 204.
- [ ] WHERE email validation THE system SHALL accept standard email formats and reject invalid formats.
