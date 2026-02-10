import { expect } from 'vitest';

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