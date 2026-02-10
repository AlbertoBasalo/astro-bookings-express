# Plan: Add Unit Testing with Vitest

**TL;DR:**  
Install Vitest (ESM-native, Jest-compatible) as `npm run test:dev` for isolated service testing. Unit tests focus on the services layer (validation logic, error scenarios, cross-service dependencies) separate from existing Playwright E2E tests. Update AGENTS.md and ADD.md to document the dual-testing approach, then create a pattern-focused skill guide for agents writing unit tests during coding.

## Steps

0. **Git branch**: Create a new branch for this work using `/branch` command, e.g., `add-vitest-unit-tests`.
   
1. **Install Vitest and dependencies**  
   Add `vitest` (latest), `@vitest/ui` (optional), and `@testing-library/core` for assertion helpers to package.json

2. **Create Vitest configuration** (vitest.config.ts - new file)  
   - Use TypeScript source directly (no build step)  
   - Configure test globs: `src/**/*.spec.ts`  
   - Exclude E2E test directory  
   - Enable ESM support (already native)  
   - Set up test environment as Node

3. **Update npm scripts** in package.json  
   - Add `"test:dev": "vitest --watch"` for development  
   - Clarify existing `npm run test` as E2E (Playwright)  
   - Add `"test:unit": "vitest"` for CI runs  
   - Add `"test:all": "npm run test:unit && npm run test"` for full suite

4. **Create unit test examples** for services layer  
   - src/services/rocketService.spec.ts → test validation, error cases, ID generation
   - src/services/customerService.spec.ts → test email validation, uniqueness, error handling
   - src/services/launchService.spec.ts → test cross-service reference validation, date handling
   - Pattern: Arrange-Act-Assert, group related tests with `describe()`, test happy path + boundary conditions + errors

5. **Update AGENTS.md** with new section  
   - Document dual testing approach (E2E for HTTP contracts, Unit for service isolation)  
   - Add unit test to workflow section  
   - List test layer responsibilities: services (unit), routes (E2E)

6. **Update .agents/ADD.md** (if it exists)  
   - Add Testing Architecture section  
   - Document separation: E2E tests cover routes → services → types; Unit tests cover services in isolation  
   - Explain why services aren't tested via HTTP in unit suite

7. **Create unit-test skill** .agents/skills/testing-unit-vitest/SKILL.md - new file  
   - Pattern: Basic Vitest setup, file naming (`*.spec.ts`), Arrange-Act-Assert structure  
   - Key patterns: Instantiate service, test validation rules with boundary conditions, test error throwing, test state changes  
   - Show mocking pattern for service dependencies (e.g., `LaunchService` depends on `RocketService`)  
   - Example test blocks for typical service methods  
   - Reference this skill in AGENTS.md workflow

## Verification

- Run `npm run test:dev` → Vitest starts in watch mode  
- Run `npm run test:unit` → All unit tests execute once  
- Run `npm run test` → Playwright E2E tests run as before  
- Run `npm run test:all` → Both suites run sequentially  
- Confirm `.agents/ADD.md` exists (if not, it will be created) and updated

## Decisions

- ✅ **Vitest chosen** over Jest: ESM-native, zero-config, faster feedback loop, Jest-compatible syntax  
- ✅ **Services-layer focus**: Validates business logic in isolation without HTTP overhead; E2E tests remain for route contracts  
- ✅ **Separate test runs**: `npm run test:dev` for unit (fast, dev), `npm run test` for E2E (comprehensive, slower)  
- ✅ **Pattern-focused skill**: Concise guide showing key patterns (validate, mock, assert) rather than exhaustive reference  
- ✅ **Test files colocated** with source (`src/services/*.spec.ts`) for discoverability