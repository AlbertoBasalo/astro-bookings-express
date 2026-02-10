import { it, expect } from 'vitest';

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