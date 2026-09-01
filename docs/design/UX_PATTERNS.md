# Cortex UX patterns — redesign target

These rules apply the new theme to behavior already supported by Cortex. Preserve the existing route, API, socket, store, validation, and authentication contracts.

## Navigation and page structure

- Landing remains a focused public story with working sign-in, sign-up, and “How it works” actions.
- Authenticated non-game routes share the responsive shell. Desktop navigation is icon-led; mobile uses a four-item bottom bar. Labels and tooltips must remain accessible.
- Dashboard hierarchy is: clear Join and Host/Create actions, live public rooms, then supported recent/existing quiz content if already available from the quiz API. Do not reserve empty space for unsupported modules.
- Direct `/game/create` and `/game/join` routes remain complete even if the dashboard adds shortcuts or a join dialog.
- Lobby separates host-only controls from the player list and makes the room code readable at distance.
- Active game removes all dashboard chrome. Each phase—idle, countdown, question, submitted, round result, and final result—has one obvious focus.

## Existing flow behavior

### Create and generation

The only creation paths in this redesign are selecting an existing ready quiz or uploading a PDF/TXT source. Show generation as understandable discrete states based on data the client actually receives. Users may retry a failed generation through the existing endpoint; do not promise that an uploaded file is retained unless the backend guarantees it.

### Join and lobby

Room-code entry auto-uppercases, supports paste and Enter, and shows precise inline errors. The authenticated profile supplies player identity. Full, missing, or already-started rooms explain what happened and offer a working next action.

Player arrival/readiness updates remain socket-driven. Use restrained scale/fade motion for arrivals, retain a reduced-motion alternative, and keep Start disabled until the existing readiness and quiz requirements are met.

### Live rounds and results

Question hierarchy is timer, question, answers, then score/rank context. Desktop may use a 2×2 answer grid; mobile stacks answers. Each answer target is at least 56px high, locks visibly after submission, and confirms “Answer submitted.”

Correctness feedback pairs icon, label, and color. Incorrect feedback says “Not quite” and identifies the correct answer when the server reveals it. The leaderboard shows the available rankings and clearly identifies the current player; never calculate missing rank data in presentation code.

Final results emphasize placement and score, then expose only supported actions such as returning home. Replay, review, share, accuracy, and host analytics appear only when their required data and behavior exist.

## Forms and actions

- Use visible labels unless an accessible hidden label is unambiguous.
- Show validation next to the field with `aria-invalid`, `aria-describedby`, and an alert relationship where appropriate.
- Use specific verbs: “Join game,” “Host game,” “Launch lobby,” “Retry generation,” and “Return home.”
- Disable incomplete or pending actions and change the label to a specific progress state.
- Keep numeric room settings in the established stepper contract.
- Limit each area to one primary action.

## Loading, empty, error, and connection states

- Skeletons mirror room rows, dashboard modules, and final layout.
- Empty states explain the absence and provide one working action.
- Local validation and mutation failures stay inline; brief confirmations may use toast.
- Temporary disconnect uses a persistent non-blocking status banner: “Connection lost. Reconnecting...”
- Successful reconnection announces “Reconnected.” and dismisses after about two seconds.
- Terminal failure becomes blocking only when play cannot continue, with “Try again” and “Return home” only when both actions work.
- Never expose Redis, BullMQ, job IDs, worker terminology, or internal socket events.

## Responsive and accessibility behavior

Start with content order that works in one column, then enhance at existing breakpoints. Context-rail content moves into the main flow before it becomes cramped. Preserve semantic headings, keyboard order, focus visibility, status announcements, timer labeling, answer-lock announcements, and `prefers-reduced-motion` behavior.
