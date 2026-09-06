# Cortex Fluent Home Workspace Specification

## Status

Approved through collaborative design (§1–§4) plus final amendments (CreateStage-as-hero, continuous create handoff, failure-safe File recovery, progressive library reveal, idempotent join resume). This document is the source for the implementation plan.

## Goal

Replace the marketing landing page with a single Fluent 2–inspired dark **product workspace** at `/`. The homepage itself is the product empty state: create a quiz from notes and join with a room code are real interactions, not CTAs beside marketing content.

Cortex identity comes from product mechanics (upload, room codes, quizzes, live rooms, status). Visual craftsmanship follows authentic Microsoft Fluent 2 dark language. Personality is not forced through decorative branding, unusual gradients, colorful game motifs, or visual gimmicks.

## Relationship to existing design docs

- [`design.md`](../../../design.md) and [`docs/design/`](../../../docs/design/) currently describe a light game-dashboard system. This slice **does not** rewrite the whole app to that light system or to Fluent overnight.
- This spec establishes **Fluent-inspired semantic tokens and HomeWorkspace** as the foundation for later migration. Document token decisions in design docs during implementation so the rest of Cortex can follow.
- Lobby, live game, and the full create-settings experience are **out of scope** for restyling in this pass, even if they temporarily contrast with the new home.

## Scope

### In scope

- Fluent-inspired semantic design tokens (centralized in `frontend/src/index.css` or an equivalent token module consumed by Tailwind)
- Restyle shadcn primitives **as needed for home** via those tokens (no second component system; no `@fluentui`)
- `/` as `HomeWorkspace` (public, auth-aware)
- Slim `HomeChrome`
- `CreateStage` (dominant create/upload surface)
- `JoinRail` (compact join surface)
- Signed-in progressive reveal: `QuizRows` + `LiveRoomRows` (dense lists) only when useful data exists; no large empty library sections for new users
- Continuous Home → `/game/create` interaction when a File is handed off (no second upload step)
- Failure-safe `/game/create` when no pending File exists (inline reattach; route never depends on handoff)
- `/dashboard` → redirect to `/`
- Ephemeral create/join intent handoff bridging home → auth → `/game/create` or join
- Clerk **modal/overlay** auth-on-commit when practical (preserve selected `File`; auto-resume join)
- Motion for Fluent-like layout transitions, elevation, hover/press, and stage evolution
- Inline Fluent states for upload/join errors, loading, and success on those surfaces
- Update relevant design documentation to record Fluent home tokens and the workspace decision

### Out of scope

- Installing `@fluentui/react-components` or `@fluentui/web-components`
- Redesigning lobby, live game, results, or full create-settings UI beyond accepting a prefilled file
- Collapsing `/game/create` or `/game/join` into the homepage
- Finished-game history (not durably persisted yet)
- Marketing sections (Features, Coverage, FinalCta, HowItWorks, SaaS mid-nav)
- Fake product demos or div-based quiz arenas on the home page
- `localStorage` / IndexedDB persistence of `File` objects
- Search, notifications, categories, covers, manual authoring, solo practice, sharing, analytics

## Design direction (Fluent 2)

Implement Fluent 2 as the primary language using Tailwind + shadcn + Motion:

| Principle | Application on home |
| --- | --- |
| Layered dark neutrals | App canvas vs stage vs join rail vs list rows |
| Subtle elevation | Soft borders + restrained tinted shadows; hierarchy by surface, not neon glow |
| Fluent geometry | Consistent radius scale (tighter on controls, softer on stage) |
| Accent | One restrained Microsoft-like blue for primary actions, focus, selection |
| Typography | Clean, precise, highly legible; mono only for room codes |
| Translucency | Optional subtle backdrop on chrome/rail where contrast remains AA |
| States | Strong focus, hover, pressed; inline error/loading on owning surfaces |
| Motion | Polished and restrained; `transform` / `opacity` / `layout`; honor `prefers-reduced-motion` |
| Density | Comfortable Fluent spacing; signed-in content as elegant rows, not tile dashboards |
| Hierarchy | **CreateStage is the hero.** Headline is short and restrained. No oversized marketing typography, long supporting copy, or excessive whitespace |

Do not dilute Fluent to “look less Microsoft.” Differentiate through Cortex’s real create/join/library content.

The page must feel like **opening Cortex**, not visiting a website advertising Cortex. Visual weight order: CreateStage → compact JoinRail → optional library rows. The headline supports orientation; it does not compete with CreateStage.

## Information architecture

### Routing

| Route | Behavior after this slice |
| --- | --- |
| `/` | `HomeWorkspace` — single product home for guests and signed-in users |
| `/dashboard` | Redirect to `/` (preserve deep-link habit without a second home) |
| `/game/create` | Remains focused create/settings route; accepts optional prefilled `File` from handoff |
| `/game/join` | Remains focused join route for deep links and fuller join UX |
| `/login/*`, `/sign-up/*` | Remain for Clerk deep links; home prefers modal/overlay for auth-on-commit |
| Lobby / game | Unchanged contracts and (for this pass) unchanged styling |

### Page composition (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ HomeChrome: BrandMark                          Account/Sign │
├───────────────────────────────────┬─────────────────────────┤
│ ~70% main                         │ ~30% JoinRail           │
│ Short restrained product headline │ Elevated compact column │
│ CreateStage (HERO / most weight)  │ Room code + Join        │
│ idle → selected-file (same stage) │ Inline validation       │
├───────────────────────────────────┴─────────────────────────┤
│ Progressive (only if useful data): QuizRows · LiveRoomRows  │
└─────────────────────────────────────────────────────────────┘
```

Mobile: stack CreateStage, then JoinRail, then any progressive lists. Join must not compete visually with Create as a second full-width hero. For a new user with no useful library data, CreateStage + JoinRail can be essentially the entire workspace.

### Removed from home

LandingNav marketing anchors, Features, HowItWorks, Coverage, FinalCta, and any fake demo/arena beside actions.

## Interaction design

### Create (primary)

Mental model across Home and `/game/create`:

**Select material → configure quiz → generate → lobby**

Not: Upload → leave page → upload/create experience starts again.

1. User drops or selects PDF/TXT on `CreateStage`.
2. Validation reuses / extracts the rules currently owned by `UploadPanel` (accepted types, 10MB). No duplicated validation path.
3. On accept, the **same surface** evolves (Motion `layout`) from drop idle → selected-file state showing name, type, size, and a strong Continue action. This must not feel like a multi-screen wizard on home.
4. Continue:
   - **Signed in:** write `File` into the ephemeral handoff store → navigate to `/game/create`.
   - **Signed out:** open Clerk modal/overlay (preferred) so the selected `File` remains in memory; after success, proceed to the same handoff → `/game/create`. If overlay is impossible and a full redirect is required, create intent is preserved and the stage is focused for reattach (document this fallback; prefer overlay).
5. Advanced settings (question count, max players, public/private, past-quiz picker) stay on `/game/create`, not on home.

### Continuous create on `/game/create`

When `/game/create` receives a prefilled `File` from handoff:

- Do **not** show another upload step.
- Immediately acknowledge the selected file (name/status clearly visible).
- Transition directly into quiz configuration (advanced settings).
- Keep the existing generate → lobby contract.

When **no** pending `File` is available (direct navigation, refresh, lost in-memory state, failed auth redirect):

- `/game/create` must **never** depend on pending File state existing.
- Show an inline reattach/select-file state and allow the user to continue normally.
- Do not throw, unexpectedly redirect, or leave the create page broken.
- Prefilled File is an **enhancement** to `/game/create`, not a requirement for the route.

### Join (secondary rail)

1. `RoomCodeInput` with existing six-character normalize/validate.
2. Join:
   - **Signed in:** resume existing join path with that code (navigate into lobby/join flow without requiring a second Join click after navigation).
   - **Signed out:** store validated room code in ephemeral handoff → Clerk modal/overlay → on success **auto-resume join once** (do not make the user click Join again).
3. For post-auth join auto-resume: **consume (take-and-clear) the pending join intent before executing the resume/navigation side effect** so the operation is idempotent and cannot fire twice (e.g. Strict Mode double-effect).
4. Errors for invalid codes stay inline on the rail. Prefer inline Fluent states over dialogs/toasts for surface-owned feedback.

### Progressive library reveal

Do **not** automatically render empty “Your Quizzes” and “Live Rooms” sections just because the user is signed in. Keep the homepage visually calm.

- Show **Your Quizzes** only when useful quiz data exists (`listQuizzes` returns one or more quizzes).
- Show **Live Rooms** only when useful public-room data exists.
- Loading and error states must still be handled properly (compact inline status, not large empty-state blocks stacked under Create/Join).
- Do not invent content or fake activity to populate these sections.
- For a new user with no useful data, CreateStage + JoinRail can essentially be the entire workspace.
- For returning users, the workspace grows beneath those controls as real content becomes available.

When shown: dense Fluent rows (not cards). Row actions: host from a quiz via existing contracts; join from a live room. Honest data boundary: do not invent “recent games” until finished-game persistence exists.

### Auth UX principles

- Auth only on commit (Continue / Join), not on page entry.
- Prefer Clerk modal/overlay for File preservation and join auto-resume.
- Do not overuse dialogs/toasts; inline states own surface feedback.

## Architecture and component boundaries

### Orchestration-light home

`HomeWorkspace` composes children and wires intents. It must not accumulate auth, upload validation, routing side effects, and data-fetching in one file.

Suggested ownership:

| Unit | Responsibility |
| --- | --- |
| `HomeWorkspace` | Layout grid; compose chrome, stage, rail, lists; pass callbacks / shared intent API |
| `HomeChrome` | BrandMark + Sign in / AccountMenu |
| `CreateStage` | Drop/select UI, selected-file evolution, Continue; calls shared upload validation helpers extracted from `UploadPanel` |
| `JoinRail` | Room code + Join; inline errors; requests join intent |
| `QuizRows` | Fetch/present owned quizzes as dense rows (query colocated or thin hook) |
| `LiveRoomRows` | Present existing public-room feed as dense rows (reuse list/query logic; restyle presentation) |
| Ephemeral intent module | Bridge only: pending `File` / create intent / pending room code; consume + clear deterministically |

### Ephemeral handoff store

- Exists solely to bridge Home → auth/create → `/game/create` (and join auto-resume).
- In-memory only (module singleton or tiny Zustand slice if that matches repo patterns). **No `localStorage` for `File`.**
- Not a general global app store unless an existing store is clearly the right home; default to a focused ephemeral module.
- Lifecycle: write on intent → **consume (take-and-clear) before side effects** on destination mount or post-auth resume. Join resume must take-and-clear before navigate so double-mount cannot resume twice.
- `/game/create` treats missing handoff as normal: show inline file select and proceed; never throw or hard-redirect solely because handoff is empty.

### Upload validation

Extract shared validation (MIME/extension, 10MB, error copy) from `UploadPanel` into a small shared helper used by both `UploadPanel` and `CreateStage`. Do not fork a second ruleset.

### Tokens first

Establish Fluent-inspired semantic tokens before building home components. Components consume tokens (Tailwind theme / CSS variables), not one-off hex values. This is the migration on-ramp for the rest of Cortex.

### Motion

- Stage idle ↔ selected-file: `layout` transition on the same surface.
- Hover/press elevation on stage and primary controls.
- Entrances for chrome/stage/rail; library reveal when signed in.
- Only `transform`, `opacity`, and Motion `layout`. Respect `useReducedMotion` / CSS reduced-motion (instant states).

## Accessibility

- WCAG 2.2 AA contrast on dark Fluent surfaces.
- Visible focus rings on all interactive controls.
- Drop zone operable by keyboard (activation control + file input).
- Labels, inline errors (`role="alert"` where appropriate), and status text not color-only.
- Minimum comfortable targets (~44×44px) for primary actions.
- Reduced motion: no layout animation; show end states immediately.

## Verification

- Focused component/page tests for: validation reuse; Continue handoff consume/clear; join auto-resume take-and-clear before navigate (idempotent under double invoke); `/dashboard` redirect; reduced-motion path.
- **Failure-safe create:** direct navigation / refresh to `/game/create` with no pending File shows inline reattach and remains usable (no throw, no forced redirect).
- Progressive library: sections absent when data empty; present when data exists; loading/error compact.
- `npm run build` and `npm run lint` in `frontend/`.
- Manual: guest create/join auth-on-commit with overlay; signed-in library growth; mobile stack; keyboard; contrast; CreateStage visual dominance over headline.

## Delivery sequence (for implementation plan)

1. Fluent semantic tokens (+ document in design docs / DESIGN_DECISIONS)
2. HomeChrome + HomeWorkspace shell (empty stage/rail placeholders)
3. CreateStage + shared upload validation extract + Motion stage evolution
4. JoinRail + ephemeral join intent + auto-resume
5. Clerk overlay auth-on-commit wiring
6. File handoff → `/game/create` consume path
7. QuizRows + LiveRoomRows progressive reveal
8. `/dashboard` redirect; remove retired marketing landing sections
9. Polish states, a11y, lint/build

## Success criteria

Someone understands Cortex within seconds because they can **use** create and join on a calm Fluent dark workspace—not because they read marketing sections. CreateStage carries the most visual weight; the headline stays short and restrained; Join is compact; library sections appear only when useful data exists; Home → configure feels continuous when a File is handed off and remains usable when it is not; join auto-resume is idempotent; deep links remain valid; no `@fluentui`; no fake demos; tokens are centralized for later app migration.
