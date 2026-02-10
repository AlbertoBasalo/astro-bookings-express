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