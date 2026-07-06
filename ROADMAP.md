# SMP Novels Roadmap

Last updated: 2026-05-15

## Current Product State

The core interactive story loop is functional: users can authenticate, load chapters, view the live metrics HUD, and receive PDF-backed story context in the AI engine. The application is usable as a demo, but it is not yet a production-complete SaaS release.

## Roadmap Overview

### Phase 1: Stabilization

Goal: remove release blockers and make the current experience predictable.

- Implement the missing chapter authoring endpoint used by the admin UI.
- Add a persistent storage path for the novel data and saves that survives restarts.
- Add smoke tests for auth, chapter loading, WebSocket metrics, and AI responses.
- Harden error handling for backend/database outages.
- Verify chapter loading against a seeded novel on fresh environments.

Exit criteria:
- The frontend can load and author content without dead-end UI actions.
- The backend starts cleanly and serves the story on a fresh container.
- Basic automated checks pass in CI or a local test script.

### Phase 2: Product Completion

Goal: make the interactive novel feel like a finished application rather than a prototype.

- Complete the admin story editing workflow end-to-end.
- Replace placeholder game logic with real narrative state transitions.
- Add validation for chapter structure, choices, and interactive payloads.
- Improve user feedback for save states, auth failures, and chapter transitions.
- Add basic observability for API errors and slow responses.

Exit criteria:
- Narrative changes can be created, edited, and saved reliably.
- Story progression is consistent across page reloads and sessions.
- The UI clearly communicates success and failure states.

### Phase 3: Production Readiness

Goal: prepare the stack for real deployment and operational support.

- Add environment-specific configuration for frontend and backend URLs.
- Introduce rate limiting and stronger auth/session hardening.
- Move secrets to managed environment variables and document rotation.
- Add CI checks for linting, tests, and build validation.
- Define backup and restore procedures for MongoDB.

Exit criteria:
- A release candidate can be built and verified in CI.
- Operational runbooks exist for startup, rollback, and recovery.
- Deployment no longer depends on manual local assumptions.

### Phase 4: Scale and Monetization

Goal: support real SaaS usage patterns.

- Add subscription billing and entitlement enforcement.
- Introduce CDN and caching for static delivery.
- Separate authoring, runtime, and analytics concerns.
- Add role-based permissions for admin, author, and reader access.
- Plan horizontal scaling for backend and WebSocket traffic.

Exit criteria:
- Paid tiers can be enforced cleanly.
- The stack can grow without rewriting core flows.
- Platform economics and deployment costs are measurable.

## Near-Term Priorities

1. Implement the admin update endpoint.
2. Add smoke tests for the current happy path.
3. Seed or persist novel data for clean environment startup.
4. Add explicit environment configuration for frontend API targets.
