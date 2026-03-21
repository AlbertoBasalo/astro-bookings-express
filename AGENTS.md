# Agents Instructions

- **Root_Folder**: /
- **Agents_Folder**: .agents
- **Agents_file**: AGENTS.md
- **Project_Folder**: project

## Product Overview

AstroBookings is a training API for space travel booking.

- It provides rockets, launches, customers, and bookings REST resources.

## Technical Implementation

### Tech Stack

- **Language**: TypeScript 5.9 (strict ESM)
- **Framework**: Express 5
- **Database**: In-memory Map storage
- **Security**: Minimal, training scope only
- **Testing**: Vitest (unit), Playwright (E2E)
- **Logging**: Project logger utilities

### Development workflow

```bash
# Set up the project
npm install
# Build/Compile the project
npm run build
# Run the project
npm run dev
npm run start
# Test the project
npm run test:unit
npm run test
npm run test:all
npm run typecheck
# Deploy the project
npm run start
```

### Folder structure

```text
.                         # Project root
├── AGENTS.md             # This file with instructions for AI agents
├── .agents/              # Agents related files (skills, prompts)
│   ├── prompts/          # Reusable prompts directory
│   └── skills/           # Custom agent skills
├── project/              # Project related files (specs, plans, docs)
│   └── specs/            # Specifications and plans
├── CHANGELOG.md          # Project history and updates
├── README.md             # Human friendly project overview
├── src/                  # Source code folder
├── tests/                # Test files
└── other_files/          # Other relevant files and folders
```

## Environment

- **OS dev**: Windows
- **Terminal**: bash
- **Git remote**: https://github.com/AlbertoBasalo/astro-bookings-express.git
- **Default branch**: main

## Behavior Guidelines

- Code and documentation must be in English.
- Chat responses must be in the language of the user prompt.
- Sacrifice grammar for conciseness when needed.
- Keep layered flow: routes to services to types.
- Validate all inputs in services and return full error lists.
- Use explicit DTO types and avoid any.
- Keep service storage in Map with incremental ids.
- Return 201 create, 200 read or update, and 204 delete.
- Return 400 for validation failures and 404 for missing records.
- Use logger info, warn, and error methods for service events.
- For launch lifecycle, enforce explicit state transitions in launch service.
- For payments, use an internal mock adapter and keep seat updates consistent.
- Do not revert unrelated local changes.

## Naming Conventions

Use slugs with hyphens for identifiers and non code file names.

Prefix specifications, branches, and commit messages with:

- feat: new features or significant changes.
- fix: bug fixes or minor improvements.
- chore: routine tasks and maintenance.
