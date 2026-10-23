# Cortex UX patterns — redesign target

These rules apply the [`v2_design.md`](v2_design.md) visual theme to behavior already supported by Cortex. The target is paper/cream surfaces, near-black ink, selective coral and geometric accents, expressive display type, and editorial serif prompts. Preserve the existing route, API, socket, store, validation, and authentication contracts.

## Navigation and page structure

- Landing remains a focused public story with working sign-in, sign-up, and “How it works” actions.
- Authenticated non-game routes share the existing responsive shell, styled with the approved warm palette and typography. Keep all working navigation labels and destinations accessible at desktop and mobile sizes.
- Dashboard hierarchy is: compact Create a quiz/Join game hero, owned quiz rows, then live public rooms. Use open editorial spacing, fine rules, and restrained surfaces; do not reserve empty space for unsupported modules.
- Direct `/game/create` and `/game/join` routes remain complete even if the dashboard adds shortcuts or a join dialog.
- Lobby separates host-only controls from the player list and makes the room code readable at distance.
- Active game removes distracting dashboard chrome. Use a narrow centered question column, visible progress, serif prompt, and calm answer choices. Each phase—idle, countdown, question, submitted, round result, and final result—has one obvious focus.

## Existing flow behavior

### Create and generation

The only creation paths in this redesign are selecting an existing ready quiz or uploading a PDF/TXT source. Show generation as understandable discrete states based on data the client actually receives. Users may retry a failed generation through the existing endpoint; do not promise that an uploaded file is retained unless the backend guarantees it.

### Join and lobby

Room-code entry auto-uppercases, supports paste and Enter, and shows precise inline errors. The authenticated profile supplies player identity. Full, missing, or already-started rooms explain what happened and offer a working next action.

Player arrival/readiness updates remain socket-driven. Use restrained scale/fade motion for arrivals, retain a reduced-motion alternative, and keep Start disabled until the existing readiness and quiz requirements are met.

### Live rounds and results

Question hierarchy is progress and timer context, question, answers, then private inline feedback. Use horizontal choices only for short labels when they remain comfortable to read; otherwise use full-width vertical choices. Mobile stacks answers. Each answer target is at least 56px high. Lock the controls while checking; show the correct choice and a waiting message when the server confirms the submission. Keep the question visible for at least two seconds after the latest accepted answer so the final player can read that feedback.

Correctness feedback pairs icon, label, and color. Incorrect feedback identifies the correct answer in the submitting player's private question view. The dedicated leaderboard phase lasts 4.5 seconds, animates from server-ranked previous to final standings, keeps every row scrollable, and clearly identifies the current player. Under reduced motion, show final values immediately. The server advances phases; never calculate missing rank data in presentation code.

Final results emphasize placement and score, then show every played question with the player's answer, correct answer, explanation, and available source excerpts on the same page. Return home remains the supported action.

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

Solo practice keeps the question, answer controls, and navigation in one reading column. Numbered question controls show current and answered state with text available to assistive technology. Next, Previous, direct jumps, and Save and Exit save the current edit first; failed saves leave the edit in place. The result page is read-only and reveals corrections only after submission.

Start with content order that works in one column, then enhance at existing breakpoints. Landing content stacks on small screens; answer options remain readable and tappable. Context-rail content moves into the main flow before it becomes cramped. Preserve semantic headings, keyboard order, focus visibility, status announcements, timer labeling, answer-lock announcements, and `prefers-reduced-motion` behavior.
