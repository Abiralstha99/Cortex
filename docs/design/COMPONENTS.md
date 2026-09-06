# Cortex component contracts

This inventory records the redesigned components that exist in source. The approved design documentation remains visual truth, while these interfaces preserve current routes, Clerk orchestration, API payloads, socket events, Zustand ownership, validation, and accessibility behavior.

## Shared foundation

| Component | Actual interface | Implemented responsibility |
| --- | --- | --- |
| `PageShell` | `children`, optional `maxWidth`, `className`, and `aside` | Owns the authenticated content frame, desktop sidebar, compact header, mobile bottom navigation, and optional context rail. It omits all app chrome for live `/game/:gameId` routes while retaining it for create and join. |
| `AppSidebar` | No props | Renders the shared Home, Create, and Join route inventory from `app-navigation.ts`, accessible icon names and tooltips, plus the account menu. |
| `MobileBottomNav` | No props | Renders the same working destinations and account action in the mobile content order. |
| `AppHeader` | No props | Provides the mobile brand link and authenticated account action without search or notification controls. |
| `AuthLayout` | `heading`, `subtitle`, `children` | Frames Clerk-owned sign-in, sign-up, SSO, MFA, and verification content without replacing Clerk state or callbacks. |
| `BrandMark` | Optional `to` and `className` | Renders the shared Cortex wordmark as a route link. |
| `EmptyState` | `title`, optional `description`, `action`, and `className` | Renders an explanation and at most one supplied working action. |
| `ConnectionBanner` | `state`, `onRetry`, `onExit` | Presents reconnecting and restored live regions, plus the terminal offline action surface. It does not own socket state. |

## UI primitives

The primitives under `frontend/src/components/ui/` preserve native or Radix behavior while consuming the semantic tokens in `frontend/src/index.css`.

- `Button` accepts native button props, `asChild`, semantic variants `default`, `destructive`, `outline`, `secondary`, `ghost`, and `link`, plus the existing size variants. Deprecated color-named variants are not supported.
- `Input` and `Label` retain native labeling, invalid state, disabled state, and a visible 3px focus treatment.
- `Badge` is limited to compact semantic metadata. `Card` provides a neutral structured surface. `Skeleton` mirrors its caller's supplied geometry.
- `Tabs`, `Toggle`, and `ToggleGroup` preserve Radix selection and keyboard behavior. Their variants use semantic active-state tokens; shared toggle styles live in `toggle-variants.ts` so component modules remain Fast Refresh compatible.
- `Switch`, `Select`, and `DropdownMenu` preserve Radix focus management and keyboard interaction while using the approved targets, surfaces, borders, focus rings, and floating shadow.
- `Toaster` remains available for brief notices, not persistent connection state.

## Existing flow components

| Area | Actual interfaces and responsibilities |
| --- | --- |
| HomeWorkspace | `HomeChrome`, `CreateStage`, and `JoinRail` provide the authenticated Home experience. `CreateStage` accepts `onContinue`, keyboard/drop-zone interactions, reduced-motion support, and focus/pressed states; `JoinRail` accepts `onJoin`. Progressive rows `QuizRows` and `LiveRoomRows` render library and public-room feeds. The HomeWorkspace composes these slots and preserves existing routing and intent-resume behavior. |
| Dashboard | `DashboardHero` accepts an optional `firstName` and routes to the existing Join and Create pages. `LiveRoomCard` accepts a `PublicWaitingRoomSummary` and `onJoin(roomCode)`. `PublicRoomsList` owns the existing query/socket synchronization and passes real payloads to cards; `LiveRoomsSection` supplies section structure. |
| Room code | `RoomCodeInput` accepts `id`, `value`, `onChange`, optional `error`, `autoFocus`, `className`, and `label`. It is the shared six-character uppercase-alphanumeric normalization, labeling, and inline-error contract. |
| Create and join | `CreateRoomPanel` receives controlled quiz selection, player limit, question count, and visibility values. `QuizPickerList` receives `quizzes`, `isLoading`, optional `error`, `selectedId`, and `onSelect`. `RoomSettings` receives controlled players, questions, visibility, and optional `maxQuestions`. `UploadPanel` receives controlled file and optional title/count values with handlers. `RoomPreviewCard` receives quiz title, question count, player limit, and visibility. `QuizGenerationPanel` receives `isHost` and reads existing generation state from the lobby store. `HowJoiningWorks` and `JoinRoomPanel` present the existing direct join flow. No component adds an authoring mode. |
| Lobby | `PlayerCard` receives `player`, `isHost`, and `isSelf`; it presents socket-owned identity and readiness with a reduced-motion arrival fallback. Lobby page markup retains host start, self readiness, room-code copy, generation state, and leave behavior. |
| Game | `Countdown` receives `countdownMs`. `Timer` receives `startedAt` and `timeLimit`. `QuestionCard` receives `question`, `options`, `onSubmit`, `disabled`, and `selectedIndex`. `AnswerFeedback`, `RoundResults`, `Leaderboard`, and `GameResults` receive server/store payloads and player identifiers. They present the current phase without calculating correctness, round timing, or missing rankings in the browser. |

## Supported additions

The redesign added only focused presentation boundaries for existing behavior: `AppSidebar`, `MobileBottomNav`, `DashboardHero`, `LiveRoomCard`, `PlayerCard`, and `ConnectionBanner`. None introduces a route, payload, socket event, store owner, or unsupported product action.

## Unsupported inventory

`SearchInput`, notifications, category browsing, illustrated quiz-cover systems, quiz-detail actions, manual/topic authoring, solo practice, share-result controls, host analytics, and quiz editing are outside this redesign. They require separate product and data contracts.
