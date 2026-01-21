# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-12-19

### Added
- Rocket Management API endpoint `/rockets` with full CRUD operations
  - POST `/rockets` - Create new rocket with validation
  - GET `/rockets` - Retrieve all rockets
  - GET `/rockets/:id` - Retrieve specific rocket by ID
  - PUT `/rockets/:id` - Update existing rocket
  - DELETE `/rockets/:id` - Delete rocket
- Rocket service with in-memory storage
- Comprehensive validation for rocket data:
  - Name (required, non-empty)
  - Range (enum: suborbital, orbital, moon, mars)
  - Capacity (integer between 1 and 10)
- End-to-end tests covering all acceptance criteria

### Changed
- None

### Fixed
- None

## [0.1.0] - 2024-12-19

### Added
- Initial project setup with Express and TypeScript
- Health check endpoint `/health`
- Basic smoke tests
