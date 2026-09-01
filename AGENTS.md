# Project guidance

Cortex is a real-time multiplayer quiz app: users generate quizzes from notes, gather in a room, and play timed rounds. The existing implementation is the source of truth. Start with `README.md` for product context and `CLAUDE.md` for architecture, data ownership, and backend conventions; follow the relevant code path before changing it.

Keep changes narrowly scoped to the requested task. Do not redesign, refactor, rename, reformat, or alter unrelated behavior as incidental cleanup. Reuse existing code, components, utilities, and patterns before creating new ones.

For backend work, preserve the established boundaries: Postgres owns durable data; Redis owns live game state. Follow the existing validation, authentication, and concurrency patterns rather than bypassing them. In the ESM backend, relative TypeScript imports use `.js` extensions.

## UI work

Before any frontend/UI change, read:

- `docs/design/DESIGN_SYSTEM.md`
- `docs/design/COMPONENTS.md`
- `docs/design/UX_PATTERNS.md`
- `docs/design/COPY_STYLE.md`

If any referenced UI documentation is unavailable, use the existing UI implementation as visual and behavioral truth; do not invent a replacement design system.

New UI must look and behave as though it has always been part of the app. Reuse established components, tokens, spacing, typography, colors, interaction patterns, and copy conventions. Do not introduce arbitrary colors, typography, spacing, components, or visual conventions when an established pattern exists.

If intentionally introducing a significant reusable design convention, update the relevant design documentation and append the decision, rationale, and implementation evidence to `docs/design/DESIGN_DECISIONS.md`.
