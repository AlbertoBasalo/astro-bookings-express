# Agents Instructions

## Product Overview
- Fictional space travel booking system backend API for training and demos.
- Manages rockets with CRUD operations via REST endpoints.
- In-memory storage; no database or security for demo purposes.

## Technical Implementation

### Tech Stack
- Language: **TypeScript 5.9.3**
- Framework: **Express 5.2.1**
- Database: **In-memory (Map-based)**
- Security: **None (demo/training only)**
- Testing: **Playwright 1.57.0**
- Logging: **Console**

### Development workflow
```bash
# Set up the project
npm install

# Build/Compile the project
npm run build

# Run the project
npm run dev          # Development mode with tsx
npm run start        # Production mode (requires build)

# Test the project
npm run test         # Run Playwright tests
npm run test:ui      # Run Playwright tests with UI

# Type-check only
npm run typecheck
```

### Folder structure
```text
.                         # Project root  
├── AGENTS.md             # This file with instructions for AI agents
├── README.md             # The main human documentation file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── playwright.config.ts  # Playwright test configuration
├── src/                  # Source code
│   ├── index.ts          # Express app entry point
│   ├── routes/           # API route handlers
│   │   └── rockets.ts    # Rockets CRUD endpoints
│   ├── services/         # Business logic
│   │   └── rocketService.ts  # Rocket service with in-memory storage
│   └── types/            # TypeScript type definitions
│       └── rocket.ts     # Rocket types and interfaces
├── tests/                # Playwright test files
│   ├── rockets.spec.ts   # Rocket API tests
│   └── smoke.spec.ts     # Smoke tests
├── specs/                # API specifications
│   └── rockets.spec.md   # Rockets API spec
├── dist/                 # Compiled JavaScript output
├── playwright-report/    # Test report HTML files
└── test-results/         # Test execution results
```

## Environment
- Code and documentation must be in English.
- Chat responses must be in the language of the user prompt.
- Sacrifice grammar for conciseness in responses.
- This is a windows environment using git bash terminal.
- My default branch is `main`.
- Remote repo URL is `https://github.com/AlbertoBasalo/astro-bookings-express`
- Server runs on `http://localhost:3000` (configurable via PORT env var).
- Node.js version: >=18.18 required.
