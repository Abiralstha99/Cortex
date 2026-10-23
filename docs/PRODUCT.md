# Cortex product behavior

This document describes the current user experience. **Implemented** statements come from application code. **Design target** statements come from [`v2_design.md`](design/v2_design.md) and [`UX_PATTERNS.md`](design/UX_PATTERNS.md) and are not claims of completion. Ideas without a supported flow are labeled **unimplemented**. For HTTP and socket contracts, use [`API.md`](API.md) and [`REALTIME.md`](REALTIME.md).

## Purpose and audience

Cortex turns study notes into a timed multiplayer quiz. A host prepares a quiz and opens a room; signed-in participants join, answer together, and see standings. The study-group audience is inferred from the product copy and flows; no user-research evidence is checked into the repository (`frontend/src/pages/HomeWorkspace.tsx`, `frontend/src/App.tsx`).

## Core journeys — implemented

Solo practice uses ready quizzes created by the user or played in a finished multiplayer game. The dashboard's Practice solo action opens a library with Created by me and Played with friends tabs. Create practice quiz accepts PDF/TXT notes, runs the existing asynchronous AI pipeline, and offers Start practice when the generated `SOLO_ONLY` quiz is ready. Generation errors can be retried. Solo-only quizzes appear alongside eligible multiplayer quizzes in Created by me, but cannot be selected for multiplayer hosting. Their row menu offers confirmed permanent deletion; multiplayer rows have no library deletion action. Each quiz shows Not started with Start practice, In progress with the answered count and Resume, or Completed with the latest score, Practice again, and View results. An unfinished attempt takes priority over an older result. A user can save or clear answers while moving among questions and submit only after every question has an answer. Practice is untimed and uses HTTP/PostgreSQL; the latest completed attempt shows the score, answers, and explanations.

1. **Create a quiz and room.** The host selects a PDF or plain-text file, or reuses an owned ready quiz. They choose question count, capacity (2–8 players), and public or private visibility. An upload creates the room first, opens its lobby, then starts quiz generation; a saved quiz is ready on room creation. The title is optional and defaults to the filename (`frontend/src/pages/CreateGame.tsx`, `backend/src/services/game.service.ts`).
2. **Join.** A signed-in player enters a six-character code, picks a listed public waiting room, or follows a lobby URL. The lobby attempts admission and reports missing, full, or already-started rooms. Account identity supplies the player name (`JoinRoomPanel.tsx`, `PublicRoomsList.tsx`, `backend/src/services/lobby.service.ts`).
3. **Host in the lobby.** The room shows its code, player/readiness list, capacity, connection state, and quiz status. The host can copy the code and retry failed generation after selecting the file again. Everyone, including the host, must mark ready; readiness is unavailable until the player joins over an active connection. Start is available in the host UI when the quiz is ready and at least two players are all ready. If the host leaves while waiting, the first remaining player becomes host (`frontend/src/pages/Lobby.tsx`, `components/lobby/QuizGenerationPanel.tsx`, `backend/src/services/lobby.service.ts`).
4. **Play.** A three-second countdown precedes the first question. Each round accepts MCQ, true/false, or fill-in-the-blank answers for up to 30 seconds, closing earlier if everyone answers. Choosing an MCQ or true/false answer submits immediately; blank answers use a text field and Submit answer button. Submission locks the question while the server checks it; private correctness and the correct answer then appear inline. The server keeps the question visible for at least two seconds after the latest accepted answer, including when the timer expires, so the final player can read the feedback. A 4.5-second leaderboard reveal follows every round, including the last. Correct answers are not broadcast to other players; explanations and source excerpts remain in the finished review. The server determines answers, score, rank, and phase changes (`frontend/src/pages/Game.tsx`, `backend/src/services/{answer,roundEnd}.service.ts`).
5. **Finish.** The live game screen shows winner(s), the current player's score/rank, the final leaderboard, a question review, and Return home actions near the summary and after the review. Review lists every played round, including unanswered rounds, with the player's answer, correct answer, explanation, and verified source quotes. Older quizzes without citations show a missing-source label; older games without recorded round order have no review. Tied top scorers share first place. Completion records game players, submitted answers, played order, ranks, scores, and finished status; there is no results-history screen (`GameResults.tsx`, `PostGameReview.tsx`, `backend/src/services/gameCompletion.{service,persistence,helpers}.ts`).

## Roles and permissions — implemented

On the first protected API request for a signed-in Clerk account, the backend creates its local user record if it is missing. This also covers accounts created before a new local database was initialized.

| Role | Current behavior |
| --- | --- |
| Visitor | Can view the landing page and begin a file/code intent; must sign in to create or join. Protected routes redirect to Clerk login (`frontend/src/App.tsx`, `components/ProtectedRoute.tsx`). |
| Host | Creates a room, controls its public visibility at creation, uploads or reuses their quiz, retries failed room generation, toggles readiness, and sees the Start control. Room upload checks host ownership (`CreateGame.tsx`, `Lobby.tsx`, `backend/src/controllers/game.controller.ts`). |
| Player (host included) | Can join a waiting room with capacity, toggle their own readiness, leave the waiting lobby, submit one answer per round, and see feedback/results. Active-game answer and resume operations check membership (`backend/src/services/lobby.service.ts`, `socket/gameHandler.ts`). |

**Authorization gap:** The host-only Start control is a UI rule. The `start_game` socket handler does not pass the requesting user to the start service, so server-side host authorization is not enforced there (`backend/src/socket/lobbyHandler.ts`, `services/lobby.service.ts`).

## Screens and functional requirements

| Route/state | Implemented behavior | Design target where distinct |
| --- | --- | --- |
| `/` | Public explanation and create/join actions. A selected file or join code can continue after sign-in; signed-in users can see quiz and public-room lists. | Explain upload → generate → play, with clear working entry points. |
| `/login/*`, `/sign-up/*` | Clerk-managed authentication. Protected-route redirects retain the requested location. | Keep authentication and verification usable; show earned game results without an extra email gate. |
| `/dashboard` | Compact Create a quiz/Join game hero, owned quiz rows, then public waiting rooms. Selecting a quiz opens its details page. | Keep the library ahead of the live-room feed. |
| `/quizzes/:quizId` | Owner-scoped title, question count, expandable question previews, Host game shortcut, and confirmed Delete quiz action. While deletion is pending, Host game and quiz actions are disabled. If a quiz detail response lacks previews, the page keeps the quiz and Host game action available and explains that previews are unavailable. Quizzes in use by a live room or saved game cannot be deleted. | No editing action. |
| `/game/create` | Upload/past-quiz choice, optional title, question/player controls, public switch, Create room. A failed saved-quiz load has an inline retry that preserves setup choices. Uploads continue in the lobby. | Show truthful generation status and a usable failure path. |
| `/game/join` | Validates and uppercases a six-character alphanumeric code; also lists public rooms. | Explain invalid, missing, full, and disconnected states clearly. |
| `/game/lobby/:roomCode` | Attempts join; shows code/copy, players, ready controls, quiz status, host retry/Start, and Leave. Start moves joined players to game. | Keep code, player list, and disabled-Start reason readable on small screens. |
| `/game/:gameId` question | Countdown, progress, timer, type-appropriate answer controls, immediate submission and lock. Connected phase transitions announce the new phase and focus its heading; recovery does not move focus. | Keep the question and tappable answers central; use real game progress. |
| `/game/:gameId` feedback/results | Private inline feedback on the question; an animated round leaderboard; final winner(s), rank, score, and all played questions on one scrollable page with Return home. Review loads beneath the final leaderboard with retry/error states. | Pair color with text/icons and expose only supported actions. |

## Loading, error, empty, and reconnection states

**Implemented:** Protected routes wait for Clerk. Quiz/public-room lists show loading placeholders, error text, and empty states; public-room errors offer Try again. Upload type/size errors and room-creation errors appear inline. Failed generation is visible in the lobby; only the host sees the file reselect/retry action. Lobby shows joining and connection status and reports socket errors. The game shows connecting, reconnecting, offline retry, and unavailable/not-a-member states. On reconnection it requests the current phase and the member's answer state, then briefly announces confirmed recovery (`QuizPickerList.tsx`, `PublicRoomsList.tsx`, `Lobby.tsx`, `Game.tsx`, `hooks/useGameSocket.ts`).

**Design target:** Use truthful status language, one working recovery action where possible, and no invented generation percentage. Distinguish an active reconnect attempt from confirmed reconnection or terminal loss. Do not expose internal queue or storage terms in product copy (`docs/design/UX_PATTERNS.md`).

**Limits:** Closing a lobby tab does not perform Leave. Public rooms that expire may remain in a focused feed until refetch/reconnect. A generation retry requires choosing the source file again (`docs/limitations.md`, `QuizGenerationPanel.tsx`).

## Accessibility and responsive behavior

**Implemented:** Current components include labeled inputs and controls, visible focus treatment, text status/error cues, labeled timer/progress, and reduced-motion branches. The game has a narrow single-column layout; dashboard uses mobile bottom navigation with safe-area padding; create/join have a separate pregame shell (`RoomCodeInput.tsx`, `QuestionCard.tsx`, `Game.tsx`, `PageShell.tsx`, `MobileBottomNav.tsx`). This describes code, not a completed accessibility audit.

**Design target:** Maintain keyboard operation, readable mobile order, touch targets of at least 44px where practical, visible focus, non-color-only feedback, restrained timer announcements, and a WCAG AA contrast target. The guide calls for semantic single-select answer grouping; the current answers are separate buttons with `aria-pressed`, so grouping remains a target to verify (`docs/design/v2_design.md`).

## Constraints and known limitations

- The current browser upload flow supports PDF/plain text up to 10 MiB; the backend also accepts Markdown, which the browser control does not offer. Source text needs at least 50 readable words. The UI question stepper offers 5–50 in increments of five; server room validation permits 1–50, and selected/generated quiz length can reduce the room's round count (`frontend/src/lib/upload-validation.ts`, `RoomSettings.tsx`, `backend/src/services/quiz/load.service.ts`).
- Saved quizzes must belong to the host and be ready/nonempty. A room can exist before generation succeeds, but play cannot start without a ready quiz. Waiting rooms have a finite lifetime. Public/private visibility cannot be changed after creation (`backend/src/services/game.service.ts`, `docs/limitations.md`).
- Final scores and answers are saved, but the product has no prior-game viewing route. Completion does not update rating, wins, or games-played counters (`backend/src/services/gameCompletion.persistence.ts`, `frontend/src/App.tsx`).
- Live sockets are configured for one backend instance. Public question and round-result payloads omit answer keys, explanations, and source excerpts. The submitting player's private feedback and recoverable submission include the correct answer; explanations and sources appear in the finished review (`backend/src/socket/index.ts`, `services/answer.service.ts`, `services/gamePlay.helpers.ts`).

**Unimplemented, not confirmed requirements:** Search, notifications, quiz categories/covers, manual/topic authoring, quiz editing, result sharing/replay, accuracy or host analytics, projector mode, and manual Next question have no complete current flow. Visual examples in `v2_design.md` do not establish these capabilities.

## Acceptance criteria

These are code-backed expectations for functional checks, not a claim that a full browser-to-server game has been exercised.

- A visitor can reach create/join through sign-in; a valid PDF/TXT upload or owned ready quiz creates a room and opens its lobby.
- A six-character code is normalized; missing, full, and started rooms do not admit a new player. Public waiting rooms can be selected.
- Player readiness is shared in the lobby. Start requires a ready quiz, at least two players, and everyone ready. Host-only server authorization remains an open gap.
- A live question has type-appropriate answer controls, a timer, single submission, and no answer key in its initial public payload. Feedback, round ranking, and final ranking come from the server.
- A reconnecting game member can recover the current phase and personal answer state; a nonmember or unavailable game gets an unavailable state.
- At mobile and desktop widths, create/join/lobby/game actions should remain keyboard- and touch-operable with visible focus, readable status, and reduced-motion behavior. This design acceptance target still needs rendered/manual verification.
