# AstroBookings Architectural Design Document

Backend API for a fictional space travel booking system demonstrating RESTful API design, TypeScript best practices, and business logic patterns for training and educational purposes.

## Table of Contents

- [AstroBookings Architectural Design Document](#astrobookings-architectural-design-document)
  - [Table of Contents](#table-of-contents)
  - [Stack and tooling](#stack-and-tooling)
    - [Technology Stack](#technology-stack)
    - [Development Tools](#development-tools)
    - [Development Workflow](#development-workflow)
  - [Systems Architecture](#systems-architecture)
    - [Overview](#overview)
    - [System Components](#system-components)
    - [Component Interactions](#component-interactions)
  - [Software Architecture](#software-architecture)
    - [Architecture Pattern: Layered Architecture](#architecture-pattern-layered-architecture)
    - [Design Patterns](#design-patterns)
    - [Data Flow](#data-flow)
    - [Testing Architecture](#testing-architecture)
      - [E2E Tests (Playwright)](#e2e-tests-playwright)
      - [Unit Tests (Vitest)](#unit-tests-vitest)
      - [Mocking Strategy](#mocking-strategy)
      - [Testing Pyramid](#testing-pyramid)
      - [Test Organization](#test-organization)
  - [Architecture Decisions Record (ADR)](#architecture-decisions-record-adr)
    - [ADR 1: In-Memory Storage Only](#adr-1-in-memory-storage-only)
    - [ADR 2: Layered Monolithic Architecture](#adr-2-layered-monolithic-architecture)
    - [ADR 3: TypeScript Strict Mode with Explicit Types](#adr-3-typescript-strict-mode-with-explicit-types)
    - [ADR 4: Express 5 with Native Async Support](#adr-4-express-5-with-native-async-support)
    - [ADR 5: End-to-End Testing with Playwright](#adr-5-end-to-end-testing-with-playwright)
    - [ADR 6: No Authentication or Authorization](#adr-6-no-authentication-or-authorization)
    - [ADR 7: Resource-Based Folder Organization](#adr-7-resource-based-folder-organization)
    - [ADR 8: Custom Logger Utility Instead of Framework](#adr-8-custom-logger-utility-instead-of-framework)

## Stack and tooling

### Technology Stack
- **Runtime**: Node.js >=18.18
- **Language**: TypeScript 5.9.3 (strict mode, ESM modules)
- **Framework**: Express 5.2.1 (minimalist web framework)
- **Database**: In-memory Map-based storage (no persistence)
- **Testing E2E**: Playwright 1.57.0 (end-to-end API testing)
- **Testing Unit**: Vitest 3.1.0 (service layer unit testing)
- **Type System**: Strict TypeScript with comprehensive interfaces

### Development Tools
- **Build Tool**: TypeScript Compiler (tsc)
- **Dev Server**: tsx (TypeScript execution without build)
- **Test Runners**: Playwright Test (E2E), Vitest (Unit)
- **Version Control**: Git (main branch, GitHub remote)
- **IDE Support**: Full TypeScript IntelliSense and type checking
- **Logging**: Custom console-based logger utility

### Development Workflow
```bash
npm install       # Install dependencies
npm run dev       # Development mode (tsx watch)
npm run build     # Compile TypeScript to JavaScript
npm run start     # Run production build
npm run test      # Execute Playwright E2E tests
npm run test:ui   # Interactive E2E test UI
npm run test:unit # Execute Vitest unit tests  
npm run test:dev  # Run Vitest in watch mode
npm run test:all  # Run all tests (unit + E2E)
npm run typecheck # Type-check without build
```

## Systems Architecture

### Overview
AstroBookings follows a **layered monolithic architecture** with clear separation of concerns:
- HTTP layer (routes) handles request/response and status codes
- Service layer contains business logic and validation
- Type layer defines domain models and contracts
- In-memory storage simulates data persistence

### System Components

```
┌─────────────────────────────────────────────────┐
│            Client (HTTP Requests)               │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           Express Application                   │
│  ┌───────────────────────────────────────────┐  │
│  │  Middleware: JSON Parser                  │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Routes Layer                             │  │
│  │  - Health endpoints (/, /health)          │  │
│  │  - Resource routes (/rockets, /launches)  │  │
│  └──────────────┬────────────────────────────┘  │
└─────────────────┼───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Service Layer                         │
│  - Business logic                               │
│  - Validation rules                             │
│  - Data transformation                          │
│  - In-memory storage management                 │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Data Storage                          │
│  - Map<string, Entity> collections              │
│  - Auto-incrementing ID generation              │
│  - No persistence (training/demo)               │
└─────────────────────────────────────────────────┘
```

### Component Interactions
1. **HTTP Request** → Express routes receive and parse requests
2. **Route Handler** → Extracts parameters, delegates to service layer
3. **Service Layer** → Validates input, applies business rules, manages data
4. **Storage** → Services interact with in-memory Map structures
5. **Response** → Route handler formats response with appropriate HTTP status

## Software Architecture

### Architecture Pattern: Layered Architecture

**Layers:**
1. **Presentation Layer** (`src/routes/`)
   - Express router definitions
   - Request/response handling
   - HTTP status code management
   - Error formatting

2. **Business Logic Layer** (`src/services/`)
   - Domain validation
   - Entity creation and manipulation
   - Business rule enforcement
   - Error handling with typed exceptions

3. **Domain Model Layer** (`src/types/`)
   - TypeScript interfaces and types
   - Request/response contracts
   - Validation error structures
   - Domain enumerations

4. **Utility Layer** (`src/utils/`)
   - Cross-cutting concerns (logging)
   - Helper functions
   - Common utilities

### Design Patterns

**Service Pattern**
- Services encapsulate business logic
- Single responsibility per service
- Stateful in-memory storage within service instances
- Example: `RocketService` manages rocket CRUD operations

**Repository Pattern** (Simplified)
- Services act as repositories
- Map-based storage simulates database operations
- ID generation and entity lifecycle management

**DTO Pattern** (Data Transfer Objects)
- Separate request/response types from domain entities
- `CreateRocketRequest`, `UpdateRocketRequest` for input
- `Rocket` entity for output
- `ValidationError` for error responses

**Factory Pattern**
- ID generation: `generateId()` methods in services
- Entity construction with validation

### Data Flow

**Create Entity Flow:**
```
POST /rockets
  → Router extracts body
  → Service validates data
  → Service generates ID
  → Service stores in Map
  → Returns entity with 201 status
```

**Read Entity Flow:**
```
GET /rockets/:id
  → Router extracts ID parameter
  → Service queries Map
  → Returns entity with 200 or 404
```

**Update Entity Flow:**
```
PUT /rockets/:id
  → Router extracts ID and body
  → Service validates existence
  → Service validates updated data
  → Service updates Map entry
  → Returns updated entity with 200
```

**Delete Entity Flow:**
```
DELETE /rockets/:id
  → Router extracts ID
  → Service removes from Map
  → Returns 204 No Content
### Testing Architecture

**Dual Testing Strategy:**

AstroBookings implements a complementary dual testing approach to ensure both integration correctness and business logic reliability:

**1. End-to-End Tests (Playwright)**
- **Purpose**: Validate complete HTTP request/response cycles and API contracts
- **Scope**: Full stack integration from HTTP request to response
- **Location**: `tests/*.spec.ts` (separate directory)
- **When to Use**: Testing route handlers, status codes, HTTP flows, acceptance criteria
- **Pattern**: 
  ```typescript
  test('should create rocket with valid data', async ({ request }) => {
    const response = await request.post('/rockets', {
      data: { name: 'Falcon 9', capacity: 100, status: 'active' }
    });
    expect(response.status()).toBe(201);
    const rocket = await response.json();
    expect(rocket.name).toBe('Falcon 9');
  });
  ```

**2. Unit Tests (Vitest)**
- **Purpose**: Test service layer business logic in complete isolation
- **Scope**: Individual service methods, validation rules, error handling, state management
- **Location**: `src/services/*.spec.ts` (colocated with services)
- **When to Use**: Testing validation logic, CRUD operations, business rules, error conditions
- **Pattern**: Arrange-Act-Assert with mocking
  ```typescript
  describe('RocketService validation', () => {
    it('should reject empty rocket name', () => {
      const service = new RocketService();
      expect(() => service.create({ name: '', capacity: 100, status: 'active' }))
        .toThrow('Rocket name cannot be empty');
    });
  });
  ```

**Test Responsibilities by Layer:**

| Layer | E2E Tests (Playwright) | Unit Tests (Vitest) |
|-------|------------------------|---------------------|
| Routes | ✓ HTTP status codes<br>✓ Request parsing<br>✓ Response formatting | ✗ (tested via E2E) |
| Services | ✓ Integration behavior | ✓ Business logic<br>✓ Validation rules<br>✓ Error handling<br>✓ State management |
| Types | ✓ Contract validation | ✗ (compile-time) |

**Mocking Strategy:**

Unit tests mock service dependencies to maintain isolation:

```typescript
// Example: LaunchService unit test mocks RocketService
class MockRocketService {
  private rockets = new Map<string, Rocket>();
  
  create(data: CreateRequest): Rocket {
    const rocket: Rocket = { id: `rocket-${Date.now()}`, ...data };
    this.rockets.set(rocket.id, rocket);
    return rocket;
  }
  
  findById(id: string): Rocket {
    const rocket = this.rockets.get(id);
    if (!rocket) throw new Error(`Rocket not found: ${id}`);
    return rocket;
  }
}

describe('LaunchService', () => {
  let launchService: LaunchService;
  let mockRocketService: MockRocketService;
  
  beforeEach(() => {
    mockRocketService = new MockRocketService();
    launchService = new LaunchService(mockRocketService);
  });
  
  it('should validate rocket exists', () => {
    const validRequest = {
      rocketId: 'nonexistent',
      launchDate: '2025-06-01',
      minPassengers: 50,
      pricePerSeat: 1000000
    };
    
    expect(() => launchService.create(validRequest))
      .toThrow('Rocket not found');
  });
});
```

**Testing Pyramid:**

```
       /\
      /  \       E2E Tests (Playwright)
     /____\      - Test HTTP contracts
    /      \     - Acceptance criteria
   /        \    - Integration flows
  /__________\   
 /            \  Unit Tests (Vitest)
/______________\ - Service logic
                 - Validation rules
                 - Business rules
                 - Error handling
```

**Why Both?**
- **Unit Tests**: Fast feedback on business logic changes, precise error messages, easy to debug
- **E2E Tests**: Confidence in API contracts, validates full stack behavior, matches acceptance criteria
- **Together**: Unit tests catch logic bugs during development; E2E tests catch integration issues before deployment

**Test Organization:**
- E2E test files mirror route files: `routes/rockets.ts` → `tests/rockets.spec.ts`
- Unit test files are colocated: `services/rocketService.ts` → `services/rocketService.spec.ts`
- Both use descriptive test names: `'should reject empty rocket name'` over `'test1'`
- Tests document expected behavior and serve as living examples

### Testing Architecture

AstroBookings implements a **dual testing strategy** that covers both integration (E2E) and isolation (unit) perspectives:

#### E2E Tests (Playwright)
**Purpose**: Validate HTTP API contracts and full request/response cycles
- **Location**: `tests/*.spec.ts` (separate directory)
- **Scope**: Routes → Services → Types integration
- **Focus**: HTTP status codes, request/response formats, acceptance criteria
- **Run**: `npm run test` or `npm run test:ui`
- **Pattern**: Real HTTP requests against running server

**Example E2E Test Structure:**
```typescript
// tests/rockets.spec.ts
test('POST /rockets creates new rocket', async ({ request }) => {
  const response = await request.post('/rockets', {
    data: { name: 'Falcon 9', range: 'orbital', capacity: 7 }
  });
  expect(response.status()).toBe(201);
  const rocket = await response.json();
  expect(rocket.id).toBeDefined();
});
```

#### Unit Tests (Vitest)
**Purpose**: Validate service layer business logic in isolation
- **Location**: `src/services/*.spec.ts` (colocated with services)
- **Scope**: Service methods, validation logic, state management
- **Focus**: Business rules, error handling, edge cases, boundary conditions
- **Run**: `npm run test:unit` or `npm run test:dev` (watch mode)
- **Pattern**: Direct service instantiation with mocked dependencies

**Example Unit Test Structure:**
```typescript
// src/services/rocketService.spec.ts
describe('RocketService', () => {
  let service: RocketService;
  
  beforeEach(() => {
    service = new RocketService();
  });

  describe('validateRocketData', () => {
    it('should return error when capacity exceeds maximum', () => {
      // Arrange
      const invalidData = { name: 'Test', range: 'mars', capacity: 11 };
      
      // Act
      const errors = service.validateRocketData(invalidData);
      
      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('capacity');
    });
  });
});
```

#### Mocking Strategy
For services with dependencies (e.g., `LaunchService` depends on `RocketService`):
- Create mock implementations that return controlled test data
- Inject mocks via constructor or module replacement
- Focus unit tests on the service under test, not its dependencies

**Example Mock:**
```typescript
// src/services/launchService.spec.ts
class MockRocketService {
  getRocketById(id: string) {
    return { id: 'rocket-1', capacity: 5, ... };
  }
}

const service = new LaunchService(mockRocketService);
```

#### Testing Pyramid
```
       ┌────────────┐
       │  E2E (Few) │  → Full integration, slower
       ├────────────┤
       │ Unit (Many)│  → Isolated, fast feedback
       └────────────┘
```

**When to Write Each:**
- **Unit tests**: When implementing/modifying service methods, validation rules, or business logic
- **E2E tests**: When implementing/modifying route handlers or API contracts
- Both complement each other: unit tests provide fast feedback during development, E2E tests provide confidence in integration

#### Test Organization
- Unit tests mirror service structure: `rocketService.ts` → `rocketService.spec.ts`
- E2E tests mirror route structure: `routes/rockets.ts` → `tests/rockets.spec.ts`
- Shared test utilities can be placed in `tests/helpers/` or `src/utils/testing/`

```

### Folder Structure Philosophy
```
src/
├── index.ts           # Application entry point and Express setup
├── routes/            # HTTP layer - one file per resource
│   ├── rockets.ts     # Rocket endpoints
│   └── launches.ts    # Launch endpoints
├── services/          # Business logic - service + unit tests
│   ├── rocketService.ts
│   └── rocketService.spec.ts  # Unit tests for rocket service
├── types/             # Type definitions - one file per domain
│   └── rocket.ts
└── utils/             # Shared utilities
    └── logger.ts

tests/                 # End-to-end tests mirror routes
├── rockets.spec.ts    # Test all rocket scenarios
├── launches.spec.ts   # Test all launch scenarios
└── smoke.spec.ts      # Basic health checks

specs/                 # Specifications for each resource
├── rockets.spec.md                 # Rocket acceptance criteria
└── feat-launch-scheduling.spec.md  # Launch scheduling acceptance criteria
```

## Architecture Decisions Record (ADR)

### ADR 1: In-Memory Storage Only
- **Decision**: Use Map-based in-memory storage without database persistence
- **Status**: Accepted
- **Context**: This is a training/demo application requiring simple setup without external dependencies. Data persistence is not required; system restarts reset state.
- **Consequences**: 
  - ✓ Zero configuration, immediate startup
  - ✓ No database driver dependencies
  - ✓ Perfect for demonstrations and learning
  - ✗ Data lost on restart (acceptable for training)
  - ✗ Not scalable or production-ready (intentional)

### ADR 2: Layered Monolithic Architecture
- **Decision**: Implement a traditional layered architecture with routes, services, and types
- **Status**: Accepted
- **Context**: Clear separation of concerns aids learning; small application doesn't require microservices or complex patterns. Educational value in demonstrating standard industry structure.
- **Consequences**:
  - ✓ Easy to understand for learners
  - ✓ Clear separation of concerns
  - ✓ Testable in isolation
  - ✓ Scalable to additional resources
  - ✗ Some boilerplate for simple operations (acceptable trade-off)

### ADR 3: TypeScript Strict Mode with Explicit Types
- **Decision**: Use strict TypeScript configuration with explicit type definitions for all domain entities
- **Status**: Accepted
- **Context**: Demonstrates professional TypeScript practices; catches errors at compile time; serves as educational example.
- **Consequences**:
  - ✓ Compile-time type safety
  - ✓ Excellent IDE support
  - ✓ Self-documenting code
  - ✓ Demonstrates best practices
  - ✗ More verbose than JavaScript (intentional for learning)

### ADR 4: Express 5 with Native Async Support
- **Decision**: Use Express 5.x which has native async/await support
- **Status**: Accepted
- **Context**: Express 5 simplifies error handling in async routes and is the modern standard.
- **Consequences**:
  - ✓ Cleaner async code
  - ✓ Modern framework version
  - ✓ Built-in error handling improvements
  - ✗ Slightly different from older Express tutorials (acceptable)

### ADR 5: End-to-End Testing with Playwright
- **Decision**: Use Playwright for API testing instead of unit testing frameworks
- **Status**: Accepted
- **Context**: E2E tests validate the entire stack and HTTP contracts; demonstrates real-world API testing; tests acceptance criteria directly.
- **Consequences**:
  - ✓ Tests real HTTP behavior
  - ✓ Validates full request/response cycle
  - ✓ Easier to write for beginners
  - ✓ Matches acceptance criteria format
  - ✗ Slightly slower than unit tests (acceptable for small project)

### ADR 6: No Authentication or Authorization
- **Decision**: Omit all security layers including authentication, authorization, CORS, and rate limiting
- **Status**: Accepted
- **Context**: Training application focused on API design and business logic; security adds complexity that distracts from core learning objectives.
- **Consequences**:
  - ✓ Simpler learning experience
  - ✓ Focus on core concepts
  - ✓ Faster development and testing
  - ✗ Not production-ready (by design)
  - ⚠ Must be clearly documented as demo-only

### ADR 7: Resource-Based Folder Organization
- **Decision**: Organize code by technical layer (routes, services, types) rather than by feature
- **Status**: Accepted
- **Context**: Small application with few resources; layer-based organization is standard and easier to teach; scales well for adding new resources.
- **Consequences**:
  - ✓ Industry-standard pattern
  - ✓ Clear technical boundaries
  - ✓ Easy to locate file by type
  - ✗ Related files are separated (acceptable for small project)

### ADR 8: Custom Logger Utility Instead of Framework
- **Decision**: Implement a simple custom logger wrapping console instead of using a logging framework
- **Status**: Accepted
- **Context**: Demonstrates utility creation; avoids dependency bloat; console output sufficient for training purposes.
- **Consequences**:
  - ✓ No external dependencies
  - ✓ Simple implementation to understand
  - ✓ Sufficient for demos
  - ✗ Limited features compared to Winston/Pino (acceptable trade-off)
