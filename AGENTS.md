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
- **Testing**: Playwright 1.57.0
- **Logging**: Custom console logger

### Development workflow

```bash
npm install        # Set up project
npm run build      # Compile TypeScript
npm run dev        # Run development server (tsx)
npm run start      # Run production server
npm run test       # Execute Playwright tests
npm run typecheck  # Type-check without build
```

### Folder structure
```text
.                         # Project root  
├── AGENTS.md             # This file with instructions
├── ADD.md                # Architecture design doc
├── PRD.md                # Product requirements doc
├── src/                  # Source code
│   ├── index.ts          # Entry point
│   ├── routes/           # One file per resource
│   ├── services/         # One service per domain
│   ├── types/            # One type file per domain
│   └── utils/            # Shared utilities
├── tests/                # E2E tests mirror routes
└── specs/                # API specs per resource
```

### Implementation Rules
1. Layers: routes (HTTP), services (logic), types (models).
2. Files: `resources.ts`, `resourceService.ts`, `resource.ts` pattern.
3. Types: explicit DTOs (`CreateRequest`, `UpdateRequest`), no `any`.
4. Services: class with Map, `resource-${id++}` IDs, throw errors.
5. HTTP: POST→201, GET→200, PUT→200, DELETE→204, 400→validation, 404→not found.
6. Validation: return all errors at once, validate non-null/empty/ranges/enums.
7. Tests: Playwright E2E covering acceptance criteria and boundaries.
8. Logging: `logger.info/error/warn(component, message, data?)`.
9. No auth/security - training only, document clearly.

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
