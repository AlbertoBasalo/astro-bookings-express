import { it, expect } from 'vitest';

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