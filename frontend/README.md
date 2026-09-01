# Cortex frontend

React 19 and TypeScript client for Cortex's landing, authentication, dashboard, quiz setup, lobby, and real-time game flows.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

`VITE_CLERK_PUBLISHABLE_KEY` is required. `VITE_API_URL` defaults to `http://localhost:3000`.

## Design contract

Read the repository's [`design.md`](../design.md), [`AGENTS.md`](../AGENTS.md), and all files in [`docs/design/`](../docs/design/) before changing UI. The documentation defines the approved visual target. Existing routes, hooks, stores, API calls, socket behavior, authentication, validation, and accessibility semantics remain the behavioral source of truth.

The redesign covers existing flows only. Do not render controls for unsupported search, notifications, topic/manual authoring, solo practice, result sharing, quiz editing, or analytics.
