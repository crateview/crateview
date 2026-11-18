# Feature Specification: Run Registry Garbage Collection

**Feature Branch**: `74-add-a-button-to-run-registry-garbage-collection`

**Created**: 2026-11-18

**Status**: Draft

**Input**: Add a button to run garbage collection through an existing operator-provided maintenance job.

## User Scenarios & Testing

### User Story 1 - Run registry maintenance (Priority: P1)

A designated registry operator can start garbage collection from Crateview without separately opening the maintenance system.

**Why this priority**: Removes a manual handoff while keeping storage and write coordination under the operator's control.

**Independent Test**: Configure a test maintenance job, sign in as a designated operator, and follow the confirmation through to completion.

1. **Given** the feature is configured and no job is active, **when** the operator confirms the registry-wide action, **then** at most one run starts and the UI distinguishes acceptance from completion.
2. **Given** the confirmation is open, **when** the operator cancels, **then** no run starts.
3. **Given** another operator or maintenance process already started a run, **when** the operator visits the page or attempts to start one, **then** the active run is shown and no second run starts.
4. **Given** the job fails or its outcome cannot be determined, **when** the operator checks status, **then** the UI distinguishes failure from unknown outcome and does not automatically start another run.
5. **Given** the feature is disabled or the visitor lacks permission, **when** they open the UI or request a run directly, **then** no maintenance action is available to them.

### Edge Cases

- A submission may reach the maintenance job even when Crateview does not receive the response.
- Reloading the page during a run must not start another run or mistake acceptance for completion.
- If write safety cannot be established, the job must not run garbage collection.
- Manifest deletion does not initiate garbage collection and remains independently configurable.

## Requirements

### Functional Requirements

- **FR-001**: Crateview MUST keep the control off by default and expose it only to explicitly designated, authenticated operators after setup.
- **FR-002**: Crateview MUST require explicit confirmation that garbage collection applies to the whole configured registry and may interrupt writes.
- **FR-003**: Crateview MUST delegate execution to the configured maintenance job. That job MUST prevent overlapping runs, enforce write safety for the entire collection, and report its actual result.
- **FR-004**: Crateview MUST distinguish running, successful, failed, and unknown results; it MUST NOT retry a start automatically after an uncertain response.
- **FR-005**: An operator MUST be able to recover current run status after reload without submitting a start.
- **FR-006**: Anonymous, unauthorized, and disabled requests MUST NOT trigger maintenance. The action MUST NOT let a user select another registry or supply execution parameters.
- **FR-007**: The control, confirmation, and state messages MUST be keyboard-accessible and available in all supported UI languages.

### Key Entities

- **Registry operator**: An authenticated user explicitly permitted to manage garbage collection.
- **Garbage collection run**: A registry-wide maintenance attempt with an identifier, execution state, and outcome.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One confirmed start in the configured test deployment produces one run and a visible terminal result.
- **SC-002**: Canceled, disabled, unauthorized, and simultaneous duplicate start attempts produce no extra runs.
- **SC-003**: Refreshing during a run restores its reported state without starting another run; a lost response never shows a false success.
- **SC-004**: A test job unable to protect writes does not collect data and displays failure rather than success.

## Assumptions

- The first version targets a single configured Distribution registry and a pre-existing operator-provided job. The job can expose a trigger and authoritative run status. For status during collection, it must leave registry authentication reachable while blocking writes. If the registry is stopped, status recovery is available once authentication returns.
- The job owns maintenance windows and recovery, backups, registry write protection, and execution. Crateview does not supply a runner or execute registry commands directly.
- A scheduler, dry-run UI, cancellation, run history, estimates of reclaimed storage, and automatic collection after deletion are out of scope.
