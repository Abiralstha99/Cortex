# Cortex design decisions

This log distinguishes approved target decisions from implementation evidence. Move a target decision into the implemented table only after the cited source exists.

## Approved target — implementation pending

| Decision | Rationale | Approval evidence | Boundary |
| --- | --- | --- | --- |
| Adopt a light game-dashboard system with blue-gray canvas, white surfaces, navy type, cool-blue primary actions, and restrained colorful accents. | Cortex should read as a polished multiplayer game rather than a utility dashboard. | [`design.md`](../../design.md) and the approved redesign specification. | Applies to existing frontend flows only. |
| Give authenticated pages a responsive icon-led shell while active gameplay remains distraction-free. | Navigation supports setup and discovery but must not compete with timed questions. | [`design.md`](../../design.md), sections 6, 7, 14, and 27. | Navigation exposes working routes only. |
| Redesign by vertical slices after shared foundations. | Each increment stays buildable, reviewable, and usable across desktop and mobile. | Approved Superpowers redesign specification. | No one-shot rewrite. |
| Defer unsupported controls and product features. | Visual redesign must not imply behavior or data contracts that do not exist. | Scope decision approved on 2026-09-01. | Includes search, notifications, topic/manual authoring, solo practice, sharing, editing, and analytics. |

## Implemented behavior that must survive migration

| Decision | Evidence | Boundary |
| --- | --- | --- |
| Room codes are a first-class game artifact. | `RoomCodeInput.tsx` normalizes six uppercase alphanumerics; lobby presentation emphasizes the code. | Preserve normalization, paste, Enter, labeling, and distance readability. |
| Game interaction is phase-driven with immediate full-surface feedback. | `Game.tsx`, `QuestionCard.tsx`, `AnswerFeedback.tsx`, `RoundResults.tsx`, and `GameResults.tsx`. | Keep server-authoritative correctness and store-driven phases. |
| The frontend progressively expands one content hierarchy. | Current landing, create/join, dashboard, lobby, and game layouts. | Do not create separate mobile product flows. |
| Existing primitives own focus, disabled, and invalid behavior. | `components/ui/button.tsx`, `input.tsx`, `select.tsx`, `switch.tsx`, and `tabs.tsx`. | Restyling must preserve keyboard and semantic behavior. |
| Use Inter with an 8px spacing rhythm, calibrated radii, low-contrast borders, and rare soft shadows. | `frontend/src/index.css` defines the approved semantic tokens and Inter imports; `frontend/src/components/ui/` applies the foundation without changing Radix structure. | Implemented in `feat(ui): establish redesign foundation`; existing route-level consumers retain temporary aliases until Task 8. |
| Authentication includes password, Google SSO, and Clerk-requested verification branches. | Clerk `SignIn`/`SignUp` usage in `Login.tsx` and `SignUp.tsx`, `AuthLayout.tsx`, and `clerk/appearance.ts`. | Visual changes must not replace Clerk orchestration or bypass a branch. |
| Live game state stays in socket hooks and Zustand stores. | `useLobbySocket.ts`, `useGameSocket.ts`, `lobbyStore.ts`, and `gameStore.ts`. | Components present state; they do not recreate game rules. |
