# Unit Testing with Vitest - Skill Guide

## Overview
Write isolated unit tests for service layer business logic using Vitest, focusing on validation rules, error handling, and state management without HTTP overhead.

## Quick Reference

### Basic Test Structure (Arrange-Act-Assert)
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName(); // Fresh instance per test
  });

  it('should [expected behavior]', () => {
    // Arrange - Set up test data
    const input = { /* test data */ };

    // Act - Execute the method under test
    const result = service.methodUnderTest(input);

    // Assert - Verify the outcome
    expect(result).toBe(expectedValue);
  });
});
```

## Key Patterns

### 1. Testing Validation Rules
```typescript
describe('validateData', () => {
  it('should return no errors for valid data', () => {
    const validData = { name: 'Valid', capacity: 5 };
    
    const errors = service.validateData(validData);
    
    expect(errors).toHaveLength(0);
  });

  it('should return error when field is invalid', () => {
    const invalidData = { name: '', capacity: 5 };
    
    const errors = service.validateData(invalidData);
    
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      field: 'name',
      message: 'Name is required'
    });
  });

  it('should return multiple errors for multiple invalid fields', () => {
    const invalidData = { name: '', capacity: -1 };
    
    const errors = service.validateData(invalidData);
    
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors.map(e => e.field)).toContain('name');
    expect(errors.map(e => e.field)).toContain('capacity');
  });
});
```

### 2. Testing CRUD Operations
```typescript
describe('createEntity', () => {
  it('should create entity with valid data', () => {
    const data = { name: 'Test', capacity: 5 };
    
    const entity = service.createEntity(data);
    
    expect(entity).toBeDefined();
    expect(entity.id).toBeTruthy();
    expect(entity.name).toBe('Test');
  });

  it('should generate sequential IDs', () => {
    const entity1 = service.createEntity({ name: 'First', capacity: 3 });
    const entity2 = service.createEntity({ name: 'Second', capacity: 4 });
    
    expect(entity1.id).toBe('entity-1');
    expect(entity2.id).toBe('entity-2');
  });

  it('should throw error for invalid data', () => {
    const invalidData = { name: '', capacity: 5 };
    
    expect(() => service.createEntity(invalidData)).toThrow();
  });
});

describe('getEntityById', () => {
  it('should return entity when it exists', () => {
    const created = service.createEntity({ name: 'Test', capacity: 5 });
    
    const found = service.getEntityById(created.id);
    
    expect(found).toBeDefined();
    expect(found?.name).toBe('Test');
  });

  it('should return undefined when entity does not exist', () => {
    const found = service.getEntityById('non-existent-id');
    
    expect(found).toBeUndefined();
  });
});

describe('updateEntity', () => {
  it('should update entity with valid data', () => {
    const created = service.createEntity({ name: 'Original', capacity: 3 });
    
    const updated = service.updateEntity(created.id, { name: 'Updated' });
    
    expect(updated.name).toBe('Updated');
    expect(updated.capacity).toBe(3); // unchanged
  });

  it('should throw error when updating non-existent entity', () => {
    expect(() => service.updateEntity('non-existent', { name: 'Test' }))
      .toThrow('Entity not found');
  });

  it('should preserve fields not included in update', () => {
    const created = service.createEntity({ name: 'Test', capacity: 5 });
    
    const updated = service.updateEntity(created.id, { capacity: 7 });
    
    expect(updated.name).toBe('Test'); // preserved
    expect(updated.capacity).toBe(7); // updated
  });
});

describe('deleteEntity', () => {
  it('should delete existing entity and return true', () => {
    const created = service.createEntity({ name: 'ToDelete', capacity: 2 });
    
    const result = service.deleteEntity(created.id);
    
    expect(result).toBe(true);
    expect(service.getEntityById(created.id)).toBeUndefined();
  });

  it('should return false when deleting non-existent entity', () => {
    const result = service.deleteEntity('non-existent-id');
    
    expect(result).toBe(false);
  });
});
```

### 3. Testing Boundary Conditions
```typescript
describe('validation boundaries', () => {
  it('should accept minimum valid value', () => {
    const data = { name: 'Test', capacity: 1 }; // MIN = 1
    
    const errors = service.validateData(data);
    
    expect(errors).toHaveLength(0);
  });

  it('should accept maximum valid value', () => {
    const data = { name: 'Test', capacity: 10 }; // MAX = 10
    
    const errors = service.validateData(data);
    
    expect(errors).toHaveLength(0);
  });

  it('should reject value below minimum', () => {
    const data = { name: 'Test', capacity: 0 };
    
    const errors = service.validateData(data);
    
    expect(errors.some(e => e.field === 'capacity')).toBe(true);
  });

  it('should reject value above maximum', () => {
    const data = { name: 'Test', capacity: 11 };
    
    const errors = service.validateData(data);
    
    expect(errors.some(e => e.field === 'capacity')).toBe(true);
  });
});
```

### 4. Testing String Transformations
```typescript
it('should trim whitespace from string fields', () => {
  const data = { name: '  Trimmed  ', capacity: 5 };
  
  const entity = service.createEntity(data);
  
  expect(entity.name).toBe('Trimmed');
});

it('should reject empty string after trimming', () => {
  const data = { name: '   ', capacity: 5 };
  
  const errors = service.validateData(data);
  
  expect(errors.some(e => e.field === 'name')).toBe(true);
});
```

### 5. Mocking Service Dependencies
When a service depends on another service:

```typescript
// Create mock for dependency
class MockRocketService {
  private rockets = new Map([
    ['rocket-1', { id: 'rocket-1', capacity: 5 }],
  ]);

  getRocketById(id: string) {
    return this.rockets.get(id);
  }
}

describe('LaunchService', () => {
  let service: LaunchService;
  let mockRocketService: MockRocketService;

  beforeEach(() => {
    mockRocketService = new MockRocketService();
    service = new LaunchService(mockRocketService); // Inject mock
  });

  it('should validate against rocket capacity', () => {
    const data = {
      rocketId: 'rocket-1',
      minPassengers: 6, // Exceeds capacity of 5
      // ... other fields
    };
    
    const errors = service.validateLaunchData(data);
    
    expect(errors.some(e => 
      e.field === 'minPassengers' && 
      e.message.includes('rocket capacity')
    )).toBe(true);
  });
});
```

### 6. Testing Error Scenarios
```typescript
it('should throw error with validation details', () => {
  const invalidData = { name: '', capacity: 0 };
  
  try {
    service.createEntity(invalidData);
    fail('Should have thrown an error');
  } catch (error: any) {
    const errors = JSON.parse(error.message);
    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);
  }
});

// Alternative using expect().toThrow()
it('should throw error for invalid data', () => {
  const invalidData = { name: '', capacity: 0 };
  
  expect(() => service.createEntity(invalidData)).toThrow();
});
```

## Common Matchers

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality for objects/arrays
expect(value).toStrictEqual(expected);  // Strict deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeGreaterThanOrEqual(3);
expect(number).toBeLessThan(10);
expect(number).toBeLessThanOrEqual(10);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toContainEqual({ id: 1 });

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('Error message');
expect(() => fn()).toThrow(ErrorType);
```

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
