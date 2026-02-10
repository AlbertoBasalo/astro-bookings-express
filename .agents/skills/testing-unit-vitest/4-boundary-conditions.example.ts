import { describe, it, expect } from 'vitest';

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