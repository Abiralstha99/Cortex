# Fluent Home Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the marketing landing page with a Fluent 2–inspired dark product workspace at `/` where CreateStage is the hero, JoinRail is compact, library sections appear only when useful data exists, and Home → `/game/create` feels continuous with failure-safe File handoff.

**Architecture:** Scoped Fluent dark semantic tokens on the home surface; orchestration-light `HomeWorkspace` composing focused components; ephemeral in-memory Zustand intent store for File/room-code bridges; shared upload validation extracted from `UploadPanel`; Clerk modal auth-on-commit; `/dashboard` redirects to `/`.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, shadcn/ui, Motion (`motion/react`), Zustand, TanStack Query, Clerk React, Vitest + Testing Library, React Router.

**Spec:** [`docs/superpowers/specs/2026-09-05-fluent-home-workspace-design.md`](../specs/2026-09-05-fluent-home-workspace-design.md)

## Global Constraints

- No `@fluentui` packages; Fluent is expressed via tokens + Tailwind + restyled shadcn.
- Do not redesign lobby, live game, or full create-settings chrome beyond prefilled-File continuity.
- Keep `/game/create` and `/game/join` as valid deep links.
- No `localStorage` / IndexedDB for `File` objects.
- No marketing sections, fake product demos, or invented library content.
- CreateStage carries the most visual weight; headline stays short and restrained.
- Prefers-reduced-motion and WCAG AA contrast are mandatory.
- Prefer inline Fluent states over dialogs/toasts for surface-owned errors.
- Join auto-resume: take-and-clear pending intent **before** navigation side effects.
- `/game/create` never depends on pending File; missing handoff → inline reattach.

## File map

| Path | Responsibility |
| --- | --- |
| `frontend/src/index.css` | Add scoped Fluent dark semantic tokens under `[data-theme="fluent-dark"]` |
| `frontend/src/lib/upload-validation.ts` | Shared PDF/TXT/10MB validation + error copy |
| `frontend/src/stores/homeIntentStore.ts` | Ephemeral File + join room code; take-and-clear APIs |
| `frontend/src/pages/HomeWorkspace.tsx` | Thin composition shell for `/` |
| `frontend/src/components/home/HomeChrome.tsx` | BrandMark + Sign in / AccountMenu |
| `frontend/src/components/home/CreateStage.tsx` | Hero upload surface; idle ↔ selected-file |
| `frontend/src/components/home/JoinRail.tsx` | Compact room-code join |
| `frontend/src/components/home/QuizRows.tsx` | Dense quiz list; render only when data exists |
| `frontend/src/components/home/LiveRoomRows.tsx` | Dense live rooms; render only when data exists |
| `frontend/src/components/home/useAuthCommit.ts` | Clerk modal + post-auth resume helpers |
| `frontend/src/components/quiz-rooms/UploadPanel.tsx` | Switch to shared validation helper |
| `frontend/src/pages/CreateGame.tsx` | Consume File handoff; skip upload when present; recovery when absent |
| `frontend/src/App.tsx` | Route `/` → HomeWorkspace; `/dashboard` → redirect `/` |
| `frontend/src/pages/Landing.tsx` + `components/landing/*` | Retire from route; delete or leave unused (prefer delete unused marketing pieces after tests migrate) |
| `docs/design/DESIGN_DECISIONS.md` | Record Fluent home token + workspace decision |

---

### Task 1: Shared upload validation + tests

**Files:**
- Create: `frontend/src/lib/upload-validation.ts`
- Create: `frontend/src/lib/upload-validation.test.ts`
- Modify: `frontend/src/components/quiz-rooms/UploadPanel.tsx`

**Interfaces:**
- Produces:
  - `export const ACCEPTED_UPLOAD_TYPES = ["application/pdf", "text/plain"] as const`
  - `export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024`
  - `export type UploadValidationResult = { ok: true } | { ok: false; error: string }`
  - `export function validateQuizUploadFile(file: File): UploadValidationResult`
  - `export function titleFromFilename(name: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// frontend/src/lib/upload-validation.test.ts
import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  validateQuizUploadFile,
  titleFromFilename,
} from "./upload-validation";

describe("validateQuizUploadFile", () => {
  it("accepts PDF under the size limit", () => {
    const file = new File(["x"], "notes.pdf", { type: "application/pdf" });
    expect(validateQuizUploadFile(file)).toEqual({ ok: true });
  });

  it("rejects unsupported types", () => {
    const file = new File(["x"], "notes.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(validateQuizUploadFile(file)).toEqual({
      ok: false,
      error: "Only PDF and plain text files are supported.",
    });
  });

  it("rejects files over 10MB", () => {
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.pdf", {
      type: "application/pdf",
    });
    expect(validateQuizUploadFile(file)).toEqual({
      ok: false,
      error: "File must be under 10MB.",
    });
  });

  it("strips extension for title suggestion", () => {
    expect(titleFromFilename("Cell Biology.pdf")).toBe("Cell Biology");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/lib/upload-validation.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement helper and wire UploadPanel**

```ts
// frontend/src/lib/upload-validation.ts
export const ACCEPTED_UPLOAD_TYPES = ["application/pdf", "text/plain"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateQuizUploadFile(file: File): UploadValidationResult {
  if (!(ACCEPTED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Only PDF and plain text files are supported." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File must be under 10MB." };
  }
  return { ok: true };
}

export function titleFromFilename(name: string): string {
  return name.replace(/\.(pdf|txt)$/i, "").trim();
}
```

Update `UploadPanel.tsx` to import and use these helpers instead of local `ACCEPTED_TYPES` / `MAX_SIZE` / `titleFromFilename`.

- [ ] **Step 4: Run tests**

Run: `cd frontend && npm test -- src/lib/upload-validation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/upload-validation.ts frontend/src/lib/upload-validation.test.ts frontend/src/components/quiz-rooms/UploadPanel.tsx
git commit -m "$(cat <<'EOF'
refactor(frontend): extract shared quiz upload validation

Reuse one PDF/TXT/10MB ruleset for UploadPanel and the upcoming CreateStage.
EOF
)"
```

---

### Task 2: Ephemeral home intent store

**Files:**
- Create: `frontend/src/stores/homeIntentStore.ts`
- Create: `frontend/src/stores/homeIntentStore.test.ts`

**Interfaces:**
- Produces:
  - `useHomeIntentStore` with:
    - `pendingFile: File | null`
    - `pendingJoinCode: string | null`
    - `setPendingFile(file: File): void`
    - `setPendingJoinCode(code: string): void`
    - `takePendingFile(): File | null` (returns current and clears)
    - `takePendingJoinCode(): string | null` (returns current and clears)
    - `clear(): void`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useHomeIntentStore } from "./homeIntentStore";

beforeEach(() => {
  useHomeIntentStore.getState().clear();
});

describe("homeIntentStore", () => {
  it("takePendingFile returns once then clears", () => {
    const file = new File(["a"], "a.pdf", { type: "application/pdf" });
    useHomeIntentStore.getState().setPendingFile(file);
    expect(useHomeIntentStore.getState().takePendingFile()).toBe(file);
    expect(useHomeIntentStore.getState().takePendingFile()).toBeNull();
  });

  it("takePendingJoinCode is idempotent under double take", () => {
    useHomeIntentStore.getState().setPendingJoinCode("AB12C3");
    expect(useHomeIntentStore.getState().takePendingJoinCode()).toBe("AB12C3");
    expect(useHomeIntentStore.getState().takePendingJoinCode()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/stores/homeIntentStore.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement store**

```ts
import { create } from "zustand";

type HomeIntentState = {
  pendingFile: File | null;
  pendingJoinCode: string | null;
  setPendingFile: (file: File) => void;
  setPendingJoinCode: (code: string) => void;
  takePendingFile: () => File | null;
  takePendingJoinCode: () => string | null;
  clear: () => void;
};

export const useHomeIntentStore = create<HomeIntentState>((set, get) => ({
  pendingFile: null,
  pendingJoinCode: null,
  setPendingFile: (file) => set({ pendingFile: file }),
  setPendingJoinCode: (code) => set({ pendingJoinCode: code }),
  takePendingFile: () => {
    const file = get().pendingFile;
    set({ pendingFile: null });
    return file;
  },
  takePendingJoinCode: () => {
    const code = get().pendingJoinCode;
    set({ pendingJoinCode: null });
    return code;
  },
  clear: () => set({ pendingFile: null, pendingJoinCode: null }),
}));
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/stores/homeIntentStore.ts frontend/src/stores/homeIntentStore.test.ts
git commit -m "$(cat <<'EOF'
feat(frontend): add ephemeral home intent store

Bridge File and join-code intents in memory with take-and-clear semantics.
EOF
)"
```

---

### Task 3: Fluent dark semantic tokens (scoped)

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `docs/design/DESIGN_DECISIONS.md` (force-add if gitignored)
- Optional test: extend `frontend/src/semantic-token-contrast.test.ts` only if it already asserts token pairs in a way that can include fluent-dark without breaking light app assertions

**Interfaces:**
- Produces CSS variables under `[data-theme="fluent-dark"]` mapped into Tailwind-usable colors for home components, e.g.:
  - `--color-background`, `--color-surface`, `--color-subtle`, `--color-border`, `--color-ink`, `--color-muted-foreground`, `--color-primary`, `--color-primary-hover`, `--color-ring`, elevation shadows, radii aligned to Fluent control/stage geometry
- Values: deep cool charcoal canvas (not `#000`); refined Microsoft-like blue accent; soft 1px borders; restrained tinted shadows

- [ ] **Step 1: Add scoped token block**

In `index.css`, after existing `@theme` / base layers, add:

```css
[data-theme="fluent-dark"] {
  /* Map semantic tokens to Fluent dark values.
     Exact hex choices: cool charcoal surfaces, one blue accent,
     WCAG AA body contrast. Do not scatter one-offs in components. */
  color-scheme: dark;
  --color-background: #1b1a19;
  --color-surface: #292827;
  --color-subtle: #252423;
  --color-border: #3b3a39;
  --color-ink: #ffffff;
  --color-foreground: #ffffff;
  --color-muted: #c8c6c4;
  --color-muted-foreground: #d2d0ce;
  --color-text-muted: #a19f9d;
  --color-primary: #479ef5;
  --color-primary-hover: #62abf5;
  --color-primary-soft: #0c2e4f;
  --color-primary-foreground: #0b1520;
  --color-ring: #479ef5;
  --color-card: #292827;
  --color-card-foreground: #ffffff;
  --color-input: #3b3a39;
  --shadow-card: 0 2px 4px rgb(0 0 0 / 0.14), 0 0 2px rgb(0 0 0 / 0.12);
  --shadow-floating: 0 8px 16px rgb(0 0 0 / 0.14), 0 0 2px rgb(0 0 0 / 0.12);
  --radius-control: 0.25rem;
  --radius-card: 0.5rem;
  --radius-panel: 0.75rem;
  --radius-hero: 0.75rem;
  background: var(--color-background);
  color: var(--color-ink);
}
```

Tune hex values during implementation for AA contrast against surfaces; prefer authentic Fluent 2 dark neutrals + communication blue over generic slate.

Also set `body` background unchanged for non-home routes (tokens only apply under the attribute).

- [ ] **Step 2: Document decision**

Append a row to `docs/design/DESIGN_DECISIONS.md` recording: Fluent dark home tokens scoped via `data-theme="fluent-dark"` on HomeWorkspace; foundation for later migration; light app chrome unchanged this slice.

- [ ] **Step 3: Visual sanity** — no automated pixel test required; ensure CSS parses (`npm run build` later).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git add -f docs/design/DESIGN_DECISIONS.md
git commit -m "$(cat <<'EOF'
feat(frontend): add scoped Fluent dark semantic tokens

Introduce home-only Fluent 2–inspired surfaces as the migration foundation.
EOF
)"
```

---

### Task 4: HomeChrome + HomeWorkspace shell + routing

**Files:**
- Create: `frontend/src/components/home/HomeChrome.tsx`
- Create: `frontend/src/pages/HomeWorkspace.tsx`
- Create: `frontend/src/pages/HomeWorkspace.test.tsx` (routing/chrome smoke)
- Modify: `frontend/src/App.tsx`
- Create thin redirect: either inline in App or `frontend/src/pages/DashboardRedirect.tsx`

**Interfaces:**
- `HomeWorkspace` renders `data-theme="fluent-dark"` root, `HomeChrome`, placeholder regions for stage/rail/lists
- `/` → `HomeWorkspace` (public)
- `/dashboard` → `<Navigate to="/" replace />` (still can wrap in ProtectedRoute or redirect after auth — prefer: protected route that navigates to `/` so guests hitting `/dashboard` still hit login first, then land on `/`)

Recommended dashboard behavior matching “signed-in home”:
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Navigate to="/" replace />
  </ProtectedRoute>
} />
```

- [ ] **Step 1: Write failing route/chrome test**

```tsx
// HomeWorkspace.test.tsx — mock Clerk useAuth as signed out
it("exposes fluent-dark theme and brand chrome", () => {
  renderWithRouter(<HomeWorkspace />);
  expect(document.querySelector('[data-theme="fluent-dark"]')).not.toBeNull();
  expect(screen.getByRole("link", { name: /cortex/i })).toBeInTheDocument();
});
```

(Adapt BrandMark accessible name to the real component.)

- [ ] **Step 2: Implement HomeChrome + HomeWorkspace shell**

```tsx
export default function HomeWorkspace() {
  return (
    <div data-theme="fluent-dark" className="min-h-dvh bg-background text-ink">
      <HomeChrome />
      <main className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:gap-5">
        <div className="min-w-0 space-y-3">
          <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
            Live quizzes from your notes
          </h1>
          {/* CreateStage slot */}
        </div>
        <aside className="min-w-0">{/* JoinRail slot */}</aside>
      </main>
    </div>
  );
}
```

Headline must stay short/restrained (not marketing hero scale).

- [ ] **Step 3: Wire App.tsx routes; remove Landing import**

- [ ] **Step 4: Run tests + `npm run build`**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(frontend): add HomeWorkspace shell and dashboard redirect

Make / the product home with Fluent dark chrome; send /dashboard to /.
EOF
)"
```

---

### Task 5: CreateStage (hero) + Motion evolution

**Files:**
- Create: `frontend/src/components/home/CreateStage.tsx`
- Create: `frontend/src/components/home/CreateStage.test.tsx`
- Modify: `frontend/src/pages/HomeWorkspace.tsx`

**Interfaces:**
- Props: `onContinue: (file: File) => void` (parent handles auth + handoff + navigate)
- Uses `validateQuizUploadFile`
- States: idle drop zone → selected-file chip (name, type, size) + Continue
- Motion `layout` between states; `useReducedMotion` disables animation

- [ ] **Step 1: Write failing tests**

```tsx
it("shows Continue after accepting a valid PDF", async () => {
  const user = userEvent.setup();
  const onContinue = vi.fn();
  renderWithRouter(<CreateStage onContinue={onContinue} />);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["hi"], "notes.pdf", { type: "application/pdf" });
  await user.upload(input, file);
  expect(screen.getByText("notes.pdf")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /continue/i }));
  expect(onContinue).toHaveBeenCalledWith(file);
});

it("shows inline error for unsupported files", async () => {
  // upload .docx → alert text from validateQuizUploadFile
});
```

- [ ] **Step 2: Implement CreateStage as visual hero**

Large elevated Fluent surface (`bg-surface`, border, shadow-card), dashed drop target when idle. Selected state evolves in place (same container, Motion layout). Do not shrink CreateStage to match JoinRail height.

Copy framing competitive/product (“Drop notes to open a room”), not generic PDF utility.

- [ ] **Step 3: Mount in HomeWorkspace main column**

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(frontend): add Fluent CreateStage as home hero

Evolve the drop surface into a selected-file state with Continue.
EOF
)"
```

---

### Task 6: JoinRail + auth commit helpers + join auto-resume

**Files:**
- Create: `frontend/src/components/home/JoinRail.tsx`
- Create: `frontend/src/components/home/JoinRail.test.tsx`
- Create: `frontend/src/components/home/useAuthCommit.ts`
- Create: `frontend/src/components/home/useJoinResume.ts` (or fold into HomeWorkspace carefully — prefer dedicated hook)
- Modify: `frontend/src/pages/HomeWorkspace.tsx`
- Optionally tune `frontend/src/clerk/appearance.ts` with a `clerkFluentDarkAppearance` export for modal only (do not break `/login` light appearance)

**Interfaces:**
- `JoinRail`: `onJoin: (code: string) => void`
- `useAuthCommit()`:
  - `ensureSignedIn(): Promise<boolean>` — if already signed in, true; else open Clerk modal (`useClerk().openSignIn`) and resolve true after `isSignedIn` becomes true (listen via auth state); false if dismissed
- Join flow in HomeWorkspace or hook:
  1. Validate code
  2. If signed out: `setPendingJoinCode(code)` then `ensureSignedIn()`
  3. On signed-in (including post-modal): `const code = takePendingJoinCode()` **first**; if code, `navigate(\`/game/lobby/${code}\`)`
  4. If already signed in on Join click: navigate directly (still may set/take for consistency)

Create Continue flow:
  1. `setPendingFile(file)` (keep reference also in React state until navigate)
  2. `ensureSignedIn()`
  3. On success: ensure file still in store (re-set if needed) → `navigate("/game/create")`

- [ ] **Step 1: JoinRail unit tests (normalize + inline error)** — mirror Hero/JoinRoomPanel patterns

- [ ] **Step 2: Implement JoinRail + useAuthCommit**

Use Clerk:

```ts
const { openSignIn } = useClerk();
openSignIn({ appearance: clerkFluentDarkAppearance });
```

Document fallback: if modal unavailable, navigate to `/login` with return path `/` and pending join code already in store; HomeWorkspace on mount runs join resume take-and-clear.

- [ ] **Step 3: Wire join resume on HomeWorkspace mount / isSignedIn transition**

```ts
useEffect(() => {
  if (!isLoaded || !isSignedIn) return;
  const code = useHomeIntentStore.getState().takePendingJoinCode();
  if (code) navigate(`/game/lobby/${code}`);
}, [isLoaded, isSignedIn, navigate]);
```

Critical: take **inside** effect before navigate so Strict Mode double-invoke cannot resume twice.

Also handle create resume: if `pendingFile` exists and user just signed in from Continue, navigate to `/game/create` once (take is deferred until CreateGame mounts — keep file in store until CreateGame takes it). Use a `pendingCreateResume` boolean flag in the store if needed to avoid navigating on every home visit while a stale file sits — prefer clearing file on HomeWorkspace unmount only when abandoning, or set `createResumeRequested` flag taken before navigate.

Recommended store addition if needed:

```ts
createResume: boolean
requestCreateResume: () => void
takeCreateResume: () => boolean
```

Continue click: `setPendingFile(file); requestCreateResume(); ensureSignedIn();` then effect takes create resume flag and navigates to `/game/create` without taking the file yet.

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(frontend): add JoinRail and auth-on-commit resume

Prefer Clerk modal; take-and-clear join intent before navigating.
EOF
)"
```

---

### Task 7: CreateGame continuous handoff + failure-safe recovery

**Files:**
- Modify: `frontend/src/pages/CreateGame.tsx`
- Create: `frontend/src/pages/CreateGame.handoff.test.tsx` (or extend existing if present)

**Interfaces:**
- On mount: `const handedOff = useHomeIntentStore.getState().takePendingFile()`
- If `handedOff`: set `uploadFile`, `activeTab = "upload"`, prefer title from filename; **do not** show UploadPanel drop zone as the first step — show a compact acknowledged file strip + room settings / past-quiz tabs as appropriate
- If no file: existing upload UI remains available (inline reattach); no throw; no redirect

UI split when file present:

```tsx
{uploadFile ? (
  <div className="..."> {/* file name, size, change-file control */} </div>
) : (
  <UploadPanel ... />
)}
```

“Change file” returns to UploadPanel without leaving the page.

- [ ] **Step 1: Write failing tests**

```tsx
it("acknowledges a handed-off file without requiring a second upload", () => {
  const file = new File(["x"], "chem.pdf", { type: "application/pdf" });
  useHomeIntentStore.getState().setPendingFile(file);
  renderCreateGame(); // with auth + query mocks
  expect(screen.getByText("chem.pdf")).toBeInTheDocument();
  expect(screen.queryByLabelText(/choose a quiz file/i)).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /set up the room/i })).toBeInTheDocument();
});

it("remains usable when opened with no pending file", () => {
  useHomeIntentStore.getState().clear();
  renderCreateGame();
  expect(screen.getByLabelText(/choose a quiz file/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement CreateGame consume + acknowledgment UI**

Keep PageShell/light tokens for now (out of scope to Fluent-restyle create). Continuity is interaction, not theme match.

- [ ] **Step 3: Tests PASS**

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(frontend): continue create from home File handoff

Skip a second upload when a file arrives; recover inline when it does not.
EOF
)"
```

---

### Task 8: Progressive QuizRows + LiveRoomRows

**Files:**
- Create: `frontend/src/components/home/QuizRows.tsx`
- Create: `frontend/src/components/home/LiveRoomRows.tsx`
- Create: `frontend/src/components/home/QuizRows.test.tsx`
- Create: `frontend/src/components/home/LiveRoomRows.test.tsx`
- Modify: `frontend/src/pages/HomeWorkspace.tsx`

**Interfaces:**
- Render **nothing** (null) when signed out
- When signed in + loading: compact inline status (one skeleton row or “Loading…” text), not a large empty section shell with heading
- When signed in + error: compact inline alert with retry
- When signed in + empty data: **null** (no “Your Quizzes” empty state block)
- When signed in + data.length > 0: heading + dense Fluent rows

Quiz row action: navigate to `/game/create` with quiz id via existing patterns — if create page needs selected quiz, either:
- set a `pendingQuizId` on intent store taken by CreateGame, or
- `navigate("/game/create", { state: { quizId } })` and CreateGame reads location state

Prefer location state for quiz id (serializable) and intent store only for File.

Live row action: `navigate(\`/game/lobby/${roomCode}\`)`.

Reuse `listQuizzes` / `listPublicWaitingGames` + socket watch logic from `PublicRoomsList` — extract shared hook `usePublicWaitingRooms()` if needed to avoid duplicating socket upsert logic; or have LiveRoomRows import a thin shared hook factored from PublicRoomsList.

- [ ] **Step 1: Tests for empty → null, data → rows**

- [ ] **Step 2: Implement dense rows (not cards)**

- [ ] **Step 3: Mount below create/join grid in HomeWorkspace**

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(frontend): progressively reveal quiz and live room rows

Show library sections only when useful data exists under the home controls.
EOF
)"
```

---

### Task 9: Retire marketing landing + migrate/remove obsolete tests

**Files:**
- Delete or stop shipping: `Landing.tsx`, `LandingNav.tsx`, `Hero.tsx`, `Features.tsx`, `HowItWorks.tsx`, `Coverage.tsx`, `FinalCta.tsx` (and assets only if unused)
- Rewrite/remove: `frontend/src/components/landing/Hero.test.tsx`
- Update any imports

- [ ] **Step 1: Remove route usages (already done in Task 4); delete unused components**

- [ ] **Step 2: Replace Hero.test coverage with CreateStage/JoinRail/HomeWorkspace tests already added**

- [ ] **Step 3: `npm test` + `npm run lint` + `npm run build` in `frontend/`

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore(frontend): retire marketing landing components

HomeWorkspace is now the sole public product surface at /.
EOF
)"
```

---

### Task 10: Polish, a11y pass, design doc evidence

**Files:**
- Touch CreateStage/JoinRail/HomeChrome for focus rings, pressed states, spacing
- Update `docs/design/DESIGN_DECISIONS.md` with implementation evidence paths
- Update `docs/design/COMPONENTS.md` landing inventory to HomeWorkspace components (force-add if needed)

- [ ] **Step 1: Keyboard — drop zone Enter/Space; Continue/Join focus order**

- [ ] **Step 2: Reduced motion — CreateStage has no layout animation when `useReducedMotion()`

- [ ] **Step 3: Contrast check primary blue on dark surfaces**

- [ ] **Step 4: Full `npm test && npm run lint && npm run build`

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs(frontend): record Fluent home workspace implementation

Close the home redesign slice with a11y polish and design-decision evidence.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Fluent tokens centralized / scoped | 3 |
| HomeWorkspace orchestration-light | 4–8 |
| CreateStage hero, restrained headline | 4–5 |
| JoinRail compact ~30% | 5–6 |
| Shared upload validation | 1, 5 |
| Ephemeral handoff, take-before-side-effect | 2, 6, 7 |
| Continuous create / no second upload | 7 |
| Failure-safe create without File | 7 |
| Clerk modal preferred | 6 |
| Progressive library (no empty sections) | 8 |
| `/dashboard` → `/` | 4 |
| Deep links preserved | 4, 7 |
| No marketing / no fake demo / no @fluentui | 9 + global |
| Reduced motion + a11y | 5, 10 |
| Lobby/game redesign out of scope | global |

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-05-fluent-home-workspace.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration  
2. **Inline Execution** — execute tasks in this session with executing-plans and checkpoints  

Which approach?
