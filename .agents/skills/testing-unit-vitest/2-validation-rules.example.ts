import { describe, it, expect } from 'vitest';

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