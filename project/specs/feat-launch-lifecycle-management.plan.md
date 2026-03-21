# Implementation Plan for feat-launch-lifecycle-management.spec

**TL;DR:**  
Implement launch lifecycle state management as a service-enforced state machine with explicit transition endpoint behavior, launch DTO updates, booking eligibility checks, and full unit/E2E coverage. Keep layered flow (`routes -> services -> types`), in-memory Map storage, explicit DTOs, and full validation error lists.

## Status and Scope

- Spec status: Planned
- Feature status: InProgress
- Target branch: `feat/launch-lifecycle-management` (to be created from `main`)

## Environment Checks

- [x] Node runtime available (`v24.3.0`, requirement is `>=18.18`)
- [x] npm available (`11.10.0`)
- [x] Baseline typecheck passes (`npm run typecheck`)
- [ ] Create feature branch `feat/launch-lifecycle-management`

## Steps

### Step 1: Align domain model and DTO contracts
Add lifecycle fields and transition DTOs in launch types.
- [ ] Update `src/types/launch.ts` with `LaunchStatus` union: `scheduled | confirmed | suspended | successful | cancelled`
- [ ] Extend `Launch` with `status` and `statusUpdatedAt` (ISO timestamp)
- [ ] Add explicit DTO for transitions: `TransitionLaunchRequest` with `targetStatus` and optional `reason`
- [ ] Keep request/response DTOs explicit and avoid `any`

### Step 2: Implement lifecycle transition rules in service layer
Enforce state machine in launch service with full validation error arrays.
- [ ] Add transition map in `src/services/launchService.ts` based on spec rules only:
  - `scheduled -> confirmed | cancelled`
  - `confirmed -> successful | suspended | cancelled`
  - `suspended -> confirmed | cancelled`
  - `successful` and `cancelled` terminal
- [ ] Initialize new launches with `status: scheduled` and `statusUpdatedAt` at create time
- [ ] Add `transitionLaunchStatus(id, request)` method that validates launch existence and transition validity
- [ ] Return/throw structured validation error arrays for invalid transitions (including terminal-state attempts)
- [ ] Log lifecycle events with `logger.info/warn/error`

### Step 3: Protect launch update semantics and compatibility
Ensure regular launch updates do not bypass lifecycle transition rules.
- [ ] Keep lifecycle changes out of generic `updateLaunch` payloads
- [ ] Validate `updateLaunch` still preserves existing constraints (future datetime, price, minPassengers)
- [ ] Keep Map storage behavior unchanged (incremental IDs, in-memory state)
- [ ] Confirm reads (`getAllLaunches`, `getLaunchById`) include lifecycle fields

### Step 4: Enforce booking eligibility from launch lifecycle
Reject new bookings for ineligible launch states per spec.
- [ ] In `src/services/bookingService.ts`, validate launch status before seat availability check
- [ ] Allow booking creation only for `scheduled` and `confirmed`
- [ ] Reject `suspended`, `successful`, and `cancelled` with HTTP 400 validation error via existing route error mapping
- [ ] Keep seat accounting consistency unchanged (create/update/delete booking)

### Step 5: Expose lifecycle transition in routes
Add route behavior for transition action while preserving current REST contracts.
- [ ] Extend `src/routes/launches.ts` with transition action endpoint (e.g. `PUT /launches/:id/status`)
- [ ] Parse transition DTO explicitly and delegate to `launchService.transitionLaunchStatus`
- [ ] Return `200` with updated launch on success
- [ ] Return `404` for missing launch and `400` for invalid transition/validation failures via `handleServiceError`

### Step 6: Update unit tests (service-focused)
Cover lifecycle state machine and booking eligibility at service level.
- [ ] Update `src/services/launchService.spec.ts` to include initial status and all allowed/forbidden transitions
- [ ] Add tests for terminal states rejecting further transitions with validation error payloads
- [ ] Add tests verifying transition persists `statusUpdatedAt` changes
- [ ] Update `src/services/bookingService.spec.ts` with launch-status eligibility checks
- [ ] Use robust time assertions (`>=` monotonic checks) to avoid timestamp flakiness

### Step 7: Update E2E tests (API contract-focused)
Validate lifecycle acceptance criteria through HTTP behavior.
- [ ] Add/extend tests in `tests/launches.spec.ts` for transition endpoint success/failure paths
- [ ] Verify launch list/detail include lifecycle fields (`status`, `statusUpdatedAt`)
- [ ] Add/extend tests in `tests/bookings.spec.ts` to reject bookings for `suspended/successful/cancelled` launches
- [ ] Verify status codes and error body shape (`400` validation arrays, `404` not found)

### Step 8: Final verification and quality gate
Run full checks and document implementation completion.
- [ ] Run `npm run test:unit`
- [ ] Run `npm run test`
- [ ] Run `npm run typecheck`
- [ ] Update `CHANGELOG.md` with lifecycle management feature entry
- [ ] Prepare commit message: `feat: implement launch lifecycle state transitions`

## Data Model Impact (ER)

- `Launch` gains:
  - `status: LaunchStatus`
  - `statusUpdatedAt: string` (ISO datetime)
- Business rule additions:
  - Only explicit transition endpoint can change launch lifecycle state
  - Booking creation allowed only when launch status is `scheduled` or `confirmed`

## Open Questions and Blockers

- Blocker: transition rules differ between [project/specs/feat-launch-lifecycle-management.spec.md](project/specs/feat-launch-lifecycle-management.spec.md#L29) and [project/ADD.md](project/ADD.md#L190).  
  Spec says `scheduled -> confirmed | cancelled`; ADD includes `scheduled -> suspended` too. Plan follows the spec, but this needs product/architecture confirmation before implementation to prevent contract drift.
