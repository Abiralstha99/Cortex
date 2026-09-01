# Project guidance

Cortex is a real-time multiplayer quiz app: users generate quizzes from notes, gather in a room, and play timed rounds. The existing implementation is the source of truth for product behavior, data flow, and backend contracts. Start with `README.md` for product context and `CLAUDE.md` for architecture, data ownership, and backend conventions; follow the relevant code path before changing it.

Keep changes narrowly scoped to the requested task. Do not redesign, refactor, rename, reformat, or alter unrelated behavior as incidental cleanup. Reuse existing code, components, utilities, and patterns before creating new ones.

For backend work, preserve the established boundaries: Postgres owns durable data; Redis owns live game state. Follow the existing validation, authentication, and concurrency patterns rather than bypassing them. In the ESM backend, relative TypeScript imports use `.js` extensions.

## UI work

Before any frontend/UI change, read:

- `design.md`
- `docs/design/DESIGN_SYSTEM.md`
- `docs/design/COMPONENTS.md`
- `docs/design/UX_PATTERNS.md`
- `docs/design/COPY_STYLE.md`
- `docs/design/DESIGN_DECISIONS.md`

`design.md` is the approved visual north star. The files under `docs/design/` translate it into repository-specific rules and distinguish the approved target from the current implementation. During the redesign, use the documentation as visual truth and the existing code as behavioral truth. Do not describe a target-state convention as already implemented.

The redesign is limited to existing routes and supported capabilities: landing, authentication, dashboard, quiz selection or note upload, room joining, lobby, live rounds, feedback, leaderboard, and results. Search, notifications, quiz categories and covers, manual/topic authoring, solo practice, result sharing, quiz editing, and analytics are future product work unless a separate task explicitly adds their contracts. Never add inert controls to imply unsupported behavior.

Evolve existing components before introducing replacements. Apply the approved tokens, spacing, typography, colors, responsive shell, interaction patterns, and copy conventions consistently. Preserve Clerk flows, API payloads, socket events, Zustand ownership, validation, and accessibility behavior unless the task explicitly changes them.

Each redesign increment must remain usable and buildable. Prefer vertical slices and shared foundations over a one-shot rewrite. Desktop shell changes must include the corresponding mobile navigation and content order; motion changes must preserve reduced-motion behavior.

If intentionally introducing a significant reusable design convention, update the relevant design documentation and append the decision, rationale, and implementation evidence to `docs/design/DESIGN_DECISIONS.md`.
