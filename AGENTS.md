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
1. **Architecture**: Layered design - routes (HTTP) → services (logic) → types (models)
2. **Naming**: `resources.ts`, `resourceService.ts`, `resource.ts` pattern
3. **Types**: Explicit DTOs, no `any`, strict TypeScript
4. **Services**: Class with Map storage, auto-increment IDs, throw on validation errors
5. **HTTP Status**: 201 (created), 200 (success), 204 (deleted), 400 (validation), 404 (not found)
6. **Validation**: Return all errors at once, validate required/empty/ranges/enums
7. **Logging**: Use `logger.info/error/warn(component, message, data?)`
8. **Testing**: Unit tests (`*.spec.ts`) ensure code quality during implementation; E2E tests (`tests/*.spec.ts`) verify acceptance criteria
9. **Security**: None - training only, clearly documented

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
