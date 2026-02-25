# PRD: magic-favicon (Updated)

## Project Overview

| Field | Value |
|-------|-------|
| Name | magic-favicon |
| Type | Open-source JavaScript library |
| Core functionality | Transform favicons into dynamic progress bars, status indicators, and notification badges via Canvas |
| Target users | Web developers needing lightweight tab-level status signals |
| License | MIT |

---

## Problem Statement

- Browser tabs are underused as status surfaces.
- Developers need low-noise status visibility without title mutations.
- Existing favicon libraries are mostly legacy-only (pre-modern TS/ESM workflows).
- Few options combine progress, badges, status, and resilient animation behavior.

---

## Goals

1. Ship a modern TypeScript-first library with no runtime dependencies.
2. Provide first-class primitives: progress bar, pie, badge count, status dot, pulse.
3. Improve reliability for hidden/background tabs with worker-based ticking.
4. Keep the API dead-simple and chainable.
5. Include a local interactive demo and test scaffolding.

---

## Non-Goals

- Server-side rendering.
- Framework-specific wrappers in v1.
- Full icon editor/custom design tool.

---

## Scope and Priorities

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Progress bar | Horizontal overlay progress (0-100) | P0 | Implemented |
| Pie chart | Circular progress overlay (0-100) | P0 | Implemented |
| Badge count | Notification badge (`1-99`, `99+`) | P0 | Implemented |
| Status indicator | Success/warning/error dot | P1 | Implemented |
| Pulse animation | Repeating pulse overlay | P2 | Implemented |
| Reset | Restore original favicon | P0 | Implemented |
| Demo | Interactive browser demo | P0 | Implemented |
| Build outputs | ESM + CJS + UMD | P0 | Implemented |

---

## Technical Specs

- Runtime: Browser-only.
- Rendering: Canvas API to data URL favicon updates.
- Dependencies: Zero runtime dependencies.
- Packaging: ESM, CJS, UMD bundles with type declarations.
- Language: TypeScript.
- Animation reliability: Worker ticker with setInterval fallback.

---

## API Design

```ts
import favicon from "magic-favicon";

favicon.progress(50);
favicon.pie(75);
favicon.badge(3);
favicon.status("success");
favicon.pulse();
favicon.reset();

favicon.progress(50, { color: "#ff0000", preserveBase: true });
```

---

## Improvements Added to Original PRD

1. Added explicit `createMagicFavicon()` factory for multi-instance use-cases.
2. Added chainable API behavior as a DX baseline.
3. Added explicit status matrix with implementation state.
4. Added delivery artifacts as first-class scope (demo, tests, typed bundles).
5. Added acceptance criteria for background-tab resilience and reset correctness.

---

## Acceptance Criteria

- All public API methods compile with TypeScript types.
- `reset()` restores original favicon state reliably.
- Hidden-tab pulse continues to tick with worker support where available.
- Library builds cleanly into ESM/CJS/UMD + `.d.ts`.
- Demo allows manual verification of each feature.

---

## Future Enhancements (Post-v1)

- Optional React/Vue adapters.
- Additional glyphs/icons (checkmark, exclamation, spinner).
- Better canvas text scaling for high-DPI tiny badges.
- Optional queue mode for transitioning between states.
