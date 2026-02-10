# AstroBookings Architectural Design Document

Backend API for a fictional space travel booking system demonstrating RESTful API design, TypeScript best practices, and business logic patterns for training and educational purposes.

## Table of Contents

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
  - [Folder Structure Philosophy](#folder-structure-philosophy)
- [Architecture Decisions Record (ADR)](#architecture-decisions-record-adr)

## Stack and tooling

### Technology Stack
- **Runtime**: Node.js >=18.18
- **Language**: TypeScript 5.9.3 (strict mode, ESM modules)
- **Framework**: Express 5.2.1 (minimalist web framework)
- **Database**: In-memory Map-based storage (no persistence)
- **Testing**: Playwright 1.57.0 (end-to-end API testing)
- **Type System**: Strict TypeScript with comprehensive interfaces

### Development Tools
- **Build Tool**: TypeScript Compiler (tsc)
- **Dev Server**: tsx (TypeScript execution without build)
- **Test Runner**: Playwright Test
- **Version Control**: Git (main branch, GitHub remote)
- **IDE Support**: Full TypeScript IntelliSense and type checking
- **Logging**: Custom console-based logger utility

### Development Workflow
```bash
npm install       # Install dependencies
npm run dev       # Development mode (tsx watch)
npm run build     # Compile TypeScript to JavaScript
npm run start     # Run production build
npm run test      # Execute Playwright tests
npm run test:ui   # Interactive test UI
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
```

### Folder Structure Philosophy
```
src/
├── index.ts           # Application entry point and Express setup
├── routes/            # HTTP layer - one file per resource
│   ├── rockets.ts     # Rocket endpoints
│   └── launches.ts    # Launch endpoints
├── services/          # Business logic - one service per domain
│   └── rocketService.ts
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
