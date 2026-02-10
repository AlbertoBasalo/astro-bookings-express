---
name: testing-unit-vitest
description: "Provides patterns and best practices for writing unit tests with Vitest in the AstroBookings Express project. To be used when testing service layer business logic, validation rules, error handling, and state management without HTTP overhead."
--- 

# Unit Testing with Vitest - Skill Guide

## Overview
Write isolated unit tests for service layer business logic using Vitest, focusing on validation rules, error handling, and state management without HTTP overhead.

## Example Files

This skill includes **8 discoverable example files** with complete, copy-ready patterns:

| File | Pattern |
|------|---------|
| [1-basic-structure.example.ts](1-basic-structure.example.ts) | Arrange-Act-Assert test structure |
| [2-validation-rules.example.ts](2-validation-rules.example.ts) | Testing validation logic |
| [3-crud-operations.example.ts](3-crud-operations.example.ts) | Create, Read, Update, Delete tests |
| [4-boundary-conditions.example.ts](4-boundary-conditions.example.ts) | Min/max value testing |
| [5-string-transformations.example.ts](5-string-transformations.example.ts) | String trimming and formatting |
| [6-mocking-dependencies.example.ts](6-mocking-dependencies.example.ts) | Service dependency mocking |
| [7-error-scenarios.example.ts](7-error-scenarios.example.ts) | Error handling tests |
| [8-common-matchers.example.ts](8-common-matchers.example.ts) | Vitest matcher reference |

**Usage**: Reference these files directly in your code or copy patterns as needed.

## When to Use Unit Tests vs E2E Tests

**Unit Tests (Vitest)** - Ensure code quality during implementation:
- ✓ Write during development to validate business logic
- ✓ Fast feedback on validation rules and edge cases
- ✓ Catch bugs early in isolated components
- ✓ Test boundary conditions (min/max values)
- ✓ Verify error handling and state management
- ⚠ Run: `npm run test:unit` or `npm run test:dev` (watch)

**E2E Tests (Playwright)** - Verify acceptance criteria from specs:
- ✓ Confirm feature meets specifications
- ✓ Validate HTTP contracts and status codes
- ✓ Test complete request/response flows
- ✓ Ensure all layers integrate correctly
- ⚠ Run: `npm run test`

**Rule of thumb**: Write unit tests as you implement to ensure quality; write E2E tests to verify the feature meets acceptance criteria.

## Quick Reference

### Basic Test Structure (Arrange-Act-Assert)

See [1-basic-structure.example.ts](1-basic-structure.example.ts) for the fundamental test pattern.

Key points:
- Use `beforeEach()` to create fresh service instances
- Follow Arrange-Act-Assert pattern for clarity
- Use descriptive test names: `it('should [expected behavior]')`

## Key Patterns

### 1. Testing Validation Rules

See [2-validation-rules.example.ts](2-validation-rules.example.ts) for validation testing patterns.

Key patterns:
- Test valid data returns no errors
- Test each invalid field returns appropriate error
- Test multiple validation failures return all errors at once

### 2. Testing CRUD Operations

See [3-crud-operations.example.ts](3-crud-operations.example.ts) for comprehensive CRUD testing patterns.

Key patterns:
- **Create**: Test entity creation, ID generation, and validation errors
- **Read**: Test finding existing entities and handling missing ones
- **Update**: Test updates, non-existent entities, and field preservation
- **Delete**: Test deletion success and handling non-existent entities

### 3. Testing Boundary Conditions

See [4-boundary-conditions.example.ts](4-boundary-conditions.example.ts) for boundary testing patterns.

Key patterns:
- Test minimum valid value (edge case)
- Test maximum valid value (edge case)
- Test below minimum (invalid)
- Test above maximum (invalid)

### 4. Testing String Transformations

See [5-string-transformations.example.ts](5-string-transformations.example.ts) for string handling patterns.

Key patterns:
- Test whitespace trimming
- Test empty strings after trimming are rejected
- Test case transformations if applicable

### 5. Mocking Service Dependencies

See [6-mocking-dependencies.example.ts](6-mocking-dependencies.example.ts) for complete mocking patterns.

Key patterns:
- Create mock classes that implement same interface as real service
- Inject mocks via constructor during test setup
- Mock only what's needed for the test (don't over-mock)
- Test both successful and error scenarios with mocked dependencies

### 6. Testing Error Scenarios

See [7-error-scenarios.example.ts](7-error-scenarios.example.ts) for error handling patterns.

Key patterns:
- Test that errors are thrown for invalid operations
- Test error messages contain useful information
- Use `expect().toThrow()` for simple error testing
- Use try-catch for detailed error validation

## Common Matchers

See [8-common-matchers.example.ts](8-common-matchers.example.ts) for a comprehensive list of Vitest matchers.

## File Naming and Location
- Unit test files: `src/services/serviceName.spec.ts`
- Test file naming: Match the service file name with `.spec.ts` suffix
- Location: Colocated with the service file (same directory)

## Running Tests
```bash
npm run test:unit      # Run once (CI mode)
npm run test:dev       # Watch mode (development)
npm run test:all       # Run unit + E2E tests
```

## Best Practices

1. **One assertion per test** (when possible) - Makes failures easier to diagnose
2. **Test behavior, not implementation** - Test what the method does, not how
3. **Use descriptive test names** - `it('should return error when capacity exceeds maximum')`
4. **Arrange-Act-Assert pattern** - Clearly separate setup, execution, and verification
5. **Fresh state per test** - Use `beforeEach()` to reset service instances
6. **Test edge cases** - Minimum, maximum, boundary values, empty/null inputs
7. **Mock dependencies** - Isolate the service under test from its dependencies
8. **Avoid testing framework code** - Don't test Map.set(), Array.push(), etc.
9. **Test error paths** - Ensure errors are thrown with correct messages
10. **Keep tests simple** - If a test is complex, simplify the test or refactor the code

## Anti-Patterns to Avoid

❌ Testing multiple concerns in one test
❌ Depending on test execution order
❌ Testing private methods directly
❌ Over-mocking (mocking everything unnecessarily)
❌ Copying production code into tests
❌ Tests that depend on external state
❌ Vague test names like "test 1", "should work"

## Quick Checklist

When writing unit tests for a service:
- [ ] Test validation logic for all required fields
- [ ] Test validation logic for all optional fields
- [ ] Test boundary conditions (min, max, edge cases)
- [ ] Test successful CRUD operations
- [ ] Test error scenarios (not found, invalid data)
- [ ] Test ID generation works correctly
- [ ] Test data transformations (trimming, formatting)
- [ ] Test that errors contain correct field names and messages
- [ ] Mock any service dependencies
- [ ] Verify state changes (create/update/delete work as expected)
