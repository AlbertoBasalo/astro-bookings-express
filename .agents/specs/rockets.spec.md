# Rocket Management API Specification

## Problem Description

- As a **system administrator**, I want to **create and manage rocket definitions** so that **launches can be scheduled with appropriate vehicles based on destination and passenger requirements**.

- As a **booking system**, I want to **retrieve rocket information including capacity and range** so that **available launches can be matched with customer destination and group size requests**.

- As a **system operator**, I want to **view, update, and delete rocket definitions** so that **the fleet can be maintained and updated as new rockets are added or retired**.

## Solution Overview

- Implement a RESTful API endpoint `/rockets` that provides CRUD operations for rocket management.
- Store rocket data in-memory using a simple data structure (array/Map) for the initial implementation without requiring a database.
- Each rocket entity will contain: a unique identifier, name, range (enumerated type), and capacity (numeric validation).
- The API will validate input data ensuring name is required, range matches allowed values, and capacity is within valid bounds.
- Endpoints will return appropriate HTTP status codes and JSON responses for success and error scenarios.

## Acceptance Criteria

- [ ] **WHEN** a POST request is made to `/rockets` with valid rocket data (name, range, capacity), **THEN** the system SHALL create a new rocket, assign a unique identifier, and return the created rocket with HTTP status 201.

- [ ] **WHEN** a POST request is made to `/rockets` with missing required fields (name, range, or capacity), **THEN** the system SHALL return HTTP status 400 with an error message describing the validation failure.

- [ ] **WHEN** a POST request is made to `/rockets` with an invalid range value (not one of: "suborbital", "orbital", "moon", "mars"), **THEN** the system SHALL return HTTP status 400 with an error message indicating the invalid range value.

- [ ] **WHEN** a POST request is made to `/rockets` with a capacity value outside the valid range (less than 1 or greater than 10), **THEN** the system SHALL return HTTP status 400 with an error message indicating the invalid capacity range.

- [ ] **WHEN** a GET request is made to `/rockets`, **THEN** the system SHALL return HTTP status 200 with a JSON array containing all existing rockets.

- [ ] **WHEN** a GET request is made to `/rockets/:id` with a valid rocket identifier, **THEN** the system SHALL return HTTP status 200 with the JSON representation of the requested rocket.

- [ ] **WHEN** a GET request is made to `/rockets/:id` with a non-existent rocket identifier, **THEN** the system SHALL return HTTP status 404 with an error message indicating the rocket was not found.

- [ ] **WHEN** a PUT request is made to `/rockets/:id` with valid rocket data and an existing identifier, **THEN** the system SHALL update the rocket with the provided data, validate all fields, and return HTTP status 200 with the updated rocket.

- [ ] **WHEN** a DELETE request is made to `/rockets/:id` with a valid rocket identifier, **THEN** the system SHALL remove the rocket from the system and return HTTP status 204 (No Content).
