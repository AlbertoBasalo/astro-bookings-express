import { describe, it, expect, beforeEach } from 'vitest';

// Create mock for dependency
class MockRocketService {
  private rockets = new Map([
    ['rocket-1', { id: 'rocket-1', name: 'Falcon 9', capacity: 5, range: 'orbital' }],
  ]);

  getRocketById(id: string) {
    return this.rockets.get(id);
  }
  
  findById(id: string) {
    const rocket = this.rockets.get(id);
    if (!rocket) throw new Error(`Rocket not found: ${id}`);
    return rocket;
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
      launchDate: '2025-06-01',
      pricePerSeat: 1000000
    };
    
    const errors = service.validateLaunchData(data);
    
    expect(errors.some(e => 
      e.field === 'minPassengers' && 
      e.message.includes('rocket capacity')
    )).toBe(true);
  });

  it('should throw error when rocket does not exist', () => {
    const data = {
      rocketId: 'nonexistent',
      launchDate: '2025-06-01',
      minPassengers: 3,
      pricePerSeat: 1000000
    };
    
    expect(() => service.create(data))
      .toThrow('Rocket not found');
  });
});