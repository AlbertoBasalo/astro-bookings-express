# Agents Instructions

## Product Overview
- AstroBookings is a space travel booking backend API for training.
- Rockets managed via REST CRUD endpoints with business logic validation.

## Technical Implementation

### Tech Stack
- **Language**: TypeScript 5.9.3 (strict, ESM)
- **Framework**: Express 5.2.1
- **Database**: In-memory (Map-based)
- **Security**: None (demo/training only)
- **Testing E2E**: Playwright 1.57.0
- **Testing Unit**: Vitest 3.1.0
- **Logging**: Custom console logger

### Development workflow

```bash
npm install         # Set up project
npm run build       # Compile TypeScript
npm run dev         # Run development server (tsx)
npm run start       # Run production server
npm run test        # Execute Playwright E2E tests
npm run test:unit   # Execute Vitest unit tests
npm run test:dev    # Run Vitest in watch mode
npm run test:all    # Run all tests (unit + E2E)
npm run typecheck   # Type-check without build
```

### Folder structure
```text
.                         # Project root  
├── .agents/              # Primitive agent files (skills, specs, etc.)
├── AGENTS.md             # This file with instructions
├── ADD.md                # Architecture design doc
├── PRD.md                # Product requirements doc
├── src/                  # Source code
│   ├── index.ts          # Entry point
│   ├── routes/           # One file per resource
│   ├── services/         # One service per domain (with *.spec.ts unit tests)
│   ├── types/            # One type file per domain
│   └── utils/            # Shared utilities
└── tests/                # E2E tests mirror routes
```

### Implementation Rules
1. Layers: routes (HTTP), services (logic), types (models).
2. Files: `resources.ts`, `resourceService.ts`, `resource.ts` pattern.
3. Types: explicit DTOs (`CreateRequest`, `UpdateRequest`), no `any`.
4. Services: class with Map, `resource-${id++}` IDs, throw errors.
5. HTTP: POST→201, GET→200, PUT→200, DELETE→204, 400→validation, 404→not found.
6. Validation: return all errors at once, validate non-null/empty/ranges/enums.
7. Tests E2E: Playwright tests covering acceptance criteria and HTTP contracts in `tests/`.
8. Tests Unit: Vitest tests for service layer validation, logic, and error cases in `src/**/*.spec.ts`.
9. Logging: `logger.info/error/warn(component, message, data?)`.
10. No auth/security - training only, document clearly.

### Testing Strategy

**Dual Testing Approach:**
- **Unit Tests (Vitest)**: Test service layer in isolation
  - Focus: Business logic, validation rules, error handling, state management
  - Location: Colocated with services (`src/services/*.spec.ts`)
  - Run with: `npm run test:unit` or `npm run test:dev` (watch mode)
  - Pattern: Arrange-Act-Assert, uses `describe()`, `it()`, `expect()`
  - Mocking: Mock service dependencies (e.g., `LaunchService` mocks `RocketService`)

- **E2E Tests (Playwright)**: Test HTTP API contracts
  - Focus: Request/response flows, status codes, route handlers
  - Location: Separate test directory (`tests/*.spec.ts`)
  - Run with: `npm run test`
  - Pattern: Full HTTP request/response cycle testing

**When to write each:**
- Write unit tests when implementing or modifying service business logic
- Write E2E tests when implementing or modifying route handlers
- Both test types complement each other - unit tests are fast feedback, E2E tests are integration confidence

## Environment
- Code and documentation must be in English.
- Chat responses must be in the language of the user prompt.
- This is a Windows environment using git bash terminal.
- Repo: `https://github.com/AlbertoBasalo/astro-bookings-express`
- Server runs on `http://localhost:3000` (configurable via PORT env var).
- Node.js version >=18.18 required.

### Naming Conventions

Use slugs with hyphens for identifiers or non-code file names.

| Spec        | GitHub Label  | Git Branch    | Commit  |
|-------------|---------------|---------------|---------|
| feat-<slug> | enhancement   | feat/<slug>   | feat:   |
| bug-<slug>  | bug           | fix/<slug>    | fix:    |
| chore-<slug>| chore         | chore/<slug>  | chore:  |

Default git branch is `main`.
