# Cortex component contracts — redesign target

This inventory maps the current component tree to the approved design. Preserve each component's behavior and data ownership while changing its presentation. A target component is not considered implemented until source evidence is added to [`DESIGN_DECISIONS.md`](DESIGN_DECISIONS.md).

## Shared foundation

| Component | Target responsibility | Migration rule |
| --- | --- | --- |
| `PageShell` | Responsive authenticated shell and content frame | Evolve it to own desktop sidebar and mobile bottom navigation; do not wrap gameplay |
| `AppHeader` | Compact top bar and account actions | Keep only supported actions; no inert search or notifications |
| `AuthLayout` | Branded but quiet frame for Clerk flows | Preserve all custom password, Google SSO, MFA, and verification branches |
| `BrandMark` | Cortex wordmark | Keep one recognizable treatment across public and authenticated surfaces |
| `EmptyState` | Explanation plus one next action | Add optional illustration only when a coherent asset system exists |
| `ConnectionBanner` | Reconnecting, restored, and terminal connection feedback | Extract from game-page markup only if reuse produces a clearer boundary |

## UI primitives

Keep the existing `components/ui/` primitives and migrate their tokens and variants in place.

- `Button`: primary, secondary/outline, tertiary/ghost, and destructive semantic variants; remove color-named variants after consumers migrate.
- `Input` and `Label`: 48–52px controls, target focus ring, inline invalid state, and explicit labeling.
- `Badge`: compact semantic or category metadata only; never use it for major game feedback.
- `Card`: neutral structured surfaces with standard card or large-panel radius.
- `Tabs`, `Toggle`, and `ToggleGroup`: selection among views or settings with primary-soft active state.
- `Switch` and `Select`: preserve Radix keyboard behavior while adopting target tokens.
- `DropdownMenu`: account and compact overflow actions only.
- `Skeleton`: match the final layout rather than rendering a generic spinner.
- `Toaster`: brief confirmations and recoverable notices, not persistent connection state.

Do not introduce a general modal or drawer solely to satisfy an illustration in `design.md`. In this redesign, the dashboard's Join action routes to the complete `/game/join` page and reuses the existing room-code form contract.

## Existing feature components

- Landing components (`LandingNav`, `Hero`, `Features`, `HowItWorks`, `Coverage`, `FinalCta`) keep the current product story and working actions while adopting the game-dashboard visual language. Do not claim unsupported quiz modes or analytics.
- Dashboard components (`HostJoinCards`, `LiveRoomsSection`, `PublicRoomsList`) become the functional hero and live-game context. Public rooms remain driven by the existing live feed.
- `RoomCodeInput` remains the single normalization and accessibility contract for six-character room codes.
- Quiz-room components (`QuizPickerList`, `RoomSettings`, `UploadPanel`, `RoomPreviewCard`, `HowJoiningWorks`, `QuizGenerationPanel`) keep existing quiz selection, file upload, settings, retry, and status behavior. Do not add topic or manual creation choices.
- Lobby components and page markup keep room membership, readiness, host controls, room-code sharing, and generation status socket-driven.
- Game components (`Countdown`, `QuestionCard`, `Timer`, `AnswerFeedback`, `RoundResults`, `Leaderboard`, `GameResults`) remain phase-driven from the game store. Restyle them without moving correctness, timing, or score decisions into the browser.

## Target additions for existing flows

New files are justified only where a responsibility repeats or the shell becomes clearer:

- `Sidebar` and `MobileBottomNav`: render only working destinations and never appear during active play.
- `DashboardHero`: exposes Join and Host/Create using existing routes.
- `LiveRoomCard`: reusable presentation for the existing public-room payload; do not fabricate category, difficulty, or popularity.
- `PlayerCard`: consistent lobby identity/readiness surface driven by existing player data.

Prefer these focused additions over a large page component, but do not split a component merely to rename its markup.

## Unsupported inventory

`SearchInput`, notifications, category browsing, illustrated quiz-cover systems, quiz-detail actions, manual/topic authoring, solo practice, share-result controls, host analytics, and quiz editing are outside this redesign. They require separate product and data contracts.
