import { describe, it, expect } from 'vitest';

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