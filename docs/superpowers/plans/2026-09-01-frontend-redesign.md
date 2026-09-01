# Cortex Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign every supported Cortex frontend flow into the approved light game-dashboard theme without changing authentication, API, socket, store, or gameplay contracts.

**Architecture:** Migrate from the inside out: establish tested semantic tokens and primitives, build one responsive authenticated shell, then convert complete route-level slices while retaining existing hooks and Zustand stores. Presentation components receive existing API types through explicit props; pages continue to orchestrate navigation and phases, and active gameplay uses a chrome-free canvas.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router, Clerk, TanStack Query, Zustand, Socket.io client, Radix UI, Lucide, Motion, Vitest, React Testing Library, user-event, jest-dom, jsdom

**Spec:** `docs/superpowers/specs/2026-09-01-frontend-redesign-design.md`

## Global Constraints

- Cover only landing, authentication, dashboard, existing-quiz selection, PDF/TXT generation, room joining, lobby, live rounds, feedback, leaderboard, results, and their supported states.
- Do not add search, notifications, category browsing, quiz covers, topic/manual authoring, editing/detail actions, solo practice, result review/sharing, accuracy, popularity, difficulty, host analytics, new APIs, or changed API semantics.
- Treat `design.md` and `docs/design/` as visual truth; treat current routes, Clerk, API payloads, socket events, hooks, and Zustand stores as behavioral truth.
- Use Inter, the approved semantic palette, an 8px spacing rhythm, 10–24px functional radii, low-contrast borders, rare soft shadows, Lucide icons, and product-owned CSS decoration.
- Target WCAG 2.2 AA, 44×44px minimum interactive targets, visible focus, keyboard access, accessible icon names, status announcements, non-color feedback, and reduced-motion behavior.
- Keep `/game/create` and `/game/join` complete routes. Do not introduce a dialog system.
- Keep dashboard chrome out of `/game/:gameId`.
- Do not modify backend files or the unrelated working-tree changes in `skills-lock.json`, `frontend/src/components/auth/PasswordSignInForm.tsx`, or backend seed files.
- Run commands from `frontend/` unless a step explicitly says otherwise.

## File Map

- `frontend/src/index.css`: final tokens, font imports, global canvas, focus defaults, reduced motion, and decorative utilities.
- `frontend/src/test/setup.ts`, `frontend/src/test/render.tsx`: shared Vitest and router test support.
- `frontend/src/components/ui/*`: semantic primitive styling; no feature state.
- `frontend/src/components/layout/app-navigation.ts`: the only authenticated navigation item list.
- `frontend/src/components/layout/AppSidebar.tsx`: desktop navigation.
- `frontend/src/components/layout/MobileBottomNav.tsx`: mobile navigation and account trigger.
- `frontend/src/components/layout/PageShell.tsx`: responsive app chrome and optional real-content rail.
- `frontend/src/components/AccountMenu.tsx`, `frontend/src/components/AppHeader.tsx`: Clerk account actions and compact top bar.
- `frontend/src/components/dashboard/DashboardHero.tsx`, `LiveRoomCard.tsx`: dashboard-only presentation.
- `frontend/src/components/lobby/PlayerCard.tsx`: one lobby player/readiness surface.
- `frontend/src/components/game/ConnectionBanner.tsx`: reconnecting, restored, and offline feedback.
- Existing pages and feature components: retain orchestration and existing props while adopting the shared system.
- `docs/design/REDESIGN_QA.md`: manual route/state verification record.

---

### Task 1: Tested design foundation and semantic primitives

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.app.json`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/render.tsx`
- Create: `frontend/src/components/ui/button.test.tsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/ui/button.tsx`
- Modify: `frontend/src/components/ui/input.tsx`
- Modify: `frontend/src/components/ui/card.tsx`
- Modify: `frontend/src/components/ui/badge.tsx`
- Modify: `frontend/src/components/ui/tabs.tsx`
- Modify: `frontend/src/components/ui/switch.tsx`
- Modify: `frontend/src/components/ui/select.tsx`
- Modify: `frontend/src/components/ui/dropdown-menu.tsx`
- Modify: `frontend/src/components/ui/skeleton.tsx`
- Modify: `frontend/src/components/ui/sonner.tsx`

**Interfaces:**
- Consumes: token values and control rules from `docs/design/DESIGN_SYSTEM.md`.
- Produces: semantic Tailwind utilities (`bg-background`, `bg-surface`, `bg-subtle`, `text-ink`, `text-muted`, `bg-primary`, `bg-primary-soft`, semantic accents), `Button` variants `default | destructive | outline | secondary | ghost | link | candy | rose`, and shared `renderWithRouter(ui, route?)` test helper. `candy` and `rose` remain compatibility variants until Task 8 removes them.

- [ ] **Step 1: Install the approved font and test harness**

Run:

```bash
npm install @fontsource/inter
npm uninstall @fontsource/nunito @fontsource/dm-sans
npm install --save-dev vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Add scripts to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Configure Vitest and shared test helpers**

Change `vite.config.ts` to import `defineConfig` from `vitest/config` and add:

```ts
test: {
  environment: "jsdom",
  setupFiles: "./src/test/setup.ts",
  css: true,
},
```

Add `"vitest/globals"` and `"@testing-library/jest-dom"` to `compilerOptions.types` in `tsconfig.app.json`.

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `src/test/render.tsx`:

```tsx
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

export function renderWithRouter(ui: ReactElement, route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>,
  );
}
```

- [ ] **Step 3: Write the failing semantic button test**

Create `src/components/ui/button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("uses the semantic primary treatment by default", () => {
    render(<Button>Host game</Button>);
    expect(screen.getByRole("button", { name: "Host game" })).toHaveClass(
      "bg-primary",
      "rounded-[var(--radius-control)]",
    );
  });

  it("keeps secondary actions visibly bordered", () => {
    render(<Button variant="outline">Join game</Button>);
    expect(screen.getByRole("button", { name: "Join game" })).toHaveClass(
      "border-border",
      "bg-surface",
    );
  });
});
```

- [ ] **Step 4: Run the test and confirm it fails on the old theme**

Run: `npm test -- src/components/ui/button.test.tsx`

Expected: FAIL because the default button still uses `bg-forest` and the outline button still uses `border-ink`.

- [ ] **Step 5: Replace global tokens and font imports**

In `index.css`, import Inter 400/600/700 and retain IBM Plex Mono 500/600. Replace the theme foundation with:

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --color-background: #f4f6fb;
  --color-surface: #ffffff;
  --color-subtle: #f8f9fc;
  --color-border: #e6e9f0;
  --color-ink: #111936;
  --color-foreground: #111936;
  --color-muted: #697188;
  --color-muted-foreground: #697188;
  --color-text-muted: #9aa2b3;
  --color-primary: #405a9b;
  --color-primary-hover: #506db2;
  --color-primary-soft: #eef2fb;
  --color-primary-foreground: #ffffff;
  --color-accent-pink: #f06c9b;
  --color-accent-yellow: #ffbd3d;
  --color-accent-cyan: #55b8c6;
  --color-accent-purple: #9b79d1;
  --color-success: #32b57a;
  --color-success-soft: #eaf8f2;
  --color-danger: #ef5a67;
  --color-danger-soft: #fff0f2;
  --color-warning: #f5a623;
  --color-info: #4d8deb;
  --color-ring: #405a9b;

  --radius-control: 0.75rem;
  --radius-card: 1rem;
  --radius-panel: 1.25rem;
  --radius-hero: 1.5rem;
  --radius-pill: 999px;

  /* Temporary aliases removed in Task 8 after every consumer migrates. */
  --color-cream: #f4f6fb;
  --color-track: #eef2fb;
  --color-forest: #405a9b;
  --color-candy-pink: #f06c9b;
  --color-candy-yellow: #ffbd3d;
  --color-candy-sky: #55b8c6;
  --color-gloss: #111936;
  --radius-sticker: 1.5rem;
}
```

Keep the reduced-motion media rule. Replace sticker rotation utilities with a `.hero-orbit` decorative utility that uses only opacity/transform and stops under reduced motion.

- [ ] **Step 6: Migrate primitives to semantic treatments**

Set the `Button` base to 48px default height, 12px radius, 150ms color/shadow transitions, and a 3px primary focus ring. Use these exact semantic mappings:

```ts
variant: {
  default: "bg-primary text-primary-foreground hover:bg-primary-hover",
  destructive: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/25",
  outline: "border border-border bg-surface text-ink hover:bg-primary-soft",
  secondary: "bg-primary-soft text-primary hover:bg-primary-soft/75",
  ghost: "bg-transparent text-muted hover:bg-primary-soft hover:text-ink",
  link: "text-primary underline-offset-4 hover:underline",
  candy: "bg-primary text-white hover:bg-primary-hover",
  rose: "bg-primary text-white hover:bg-primary-hover",
}
```

Apply the same token rules to inputs, cards, badges, tabs, switches, selects, menus, skeletons, and toasts. Preserve each Radix primitive and its keyboard/ARIA behavior. Do not add shadows to standard cards.

- [ ] **Step 7: Run foundation verification**

Run:

```bash
npm test -- src/components/ui/button.test.tsx
npm run build
npm run lint
```

Expected: button tests PASS; TypeScript build and ESLint exit 0.

- [ ] **Step 8: Commit the foundation**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/tsconfig.app.json frontend/src/test frontend/src/index.css frontend/src/components/ui
git commit -m "feat(ui): establish redesign foundation"
```

---

### Task 2: Responsive authenticated shell and navigation

**Files:**
- Create: `frontend/src/components/layout/app-navigation.ts`
- Create: `frontend/src/components/layout/AppSidebar.tsx`
- Create: `frontend/src/components/layout/MobileBottomNav.tsx`
- Create: `frontend/src/components/AccountMenu.tsx`
- Create: `frontend/src/components/layout/AppNavigation.test.tsx`
- Modify: `frontend/src/components/layout/PageShell.tsx`
- Modify: `frontend/src/components/AppHeader.tsx`
- Modify: `frontend/src/components/ProtectedRoute.tsx`
- Modify: `frontend/src/components/brand/BrandMark.tsx`

**Interfaces:**
- Consumes: `Button`, `DropdownMenu`, `BrandMark`, React Router `NavLink`, and Clerk `useUser`/`useClerk`.
- Produces: `APP_NAV_ITEMS: readonly AppNavItem[]`, `AccountMenu({ placement?: "header" | "navigation" })`, and `PageShell({ children, maxWidth?, className?, aside? })` where `aside?: ReactNode` folds below main content before `xl`.

- [ ] **Step 1: Write failing navigation tests**

Create `src/components/layout/AppNavigation.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/render";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";

vi.mock("@/components/AccountMenu", () => ({
  default: () => <button type="button">Account</button>,
}));

describe("authenticated navigation", () => {
  it("exposes only supported desktop destinations", () => {
    renderWithRouter(<AppSidebar />, "/dashboard");
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toHaveTextContent("Home");
    expect(nav).toHaveTextContent("Create");
    expect(nav).toHaveTextContent("Join");
    expect(nav).not.toHaveTextContent("Discover");
  });

  it("gives mobile players the same working destinations and account action", () => {
    renderWithRouter(<MobileBottomNav />, "/game/create");
    expect(screen.getByRole("navigation", { name: "Mobile primary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and confirm missing modules**

Run: `npm test -- src/components/layout/AppNavigation.test.tsx`

Expected: FAIL because `AppSidebar`, `MobileBottomNav`, and `AccountMenu` do not exist.

- [ ] **Step 3: Define the single navigation contract**

Create `app-navigation.ts`:

```ts
import { House, LogIn, PlusCircle, type LucideIcon } from "lucide-react";

export type AppNavItem = {
  to: "/dashboard" | "/game/create" | "/game/join";
  label: "Home" | "Create" | "Join";
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { to: "/dashboard", label: "Home", icon: House },
  { to: "/game/create", label: "Create", icon: PlusCircle },
  { to: "/game/join", label: "Join", icon: LogIn },
];
```

Implement both navigation components from this array. `AppSidebar` is hidden below `md`, 88px wide, fixed to the left, and gives icon links accessible labels plus visible tooltips. `MobileBottomNav` is fixed to the viewport bottom below `md`, reserves a fourth Account action, and applies bottom safe-area padding.

- [ ] **Step 4: Extract the Clerk account menu**

Move initials, display-name, image, and `signOut({ redirectUrl: "/" })` behavior from `AppHeader.tsx` into `AccountMenu.tsx`. Its trigger must use:

```tsx
<DropdownMenuTrigger aria-label="Open account menu">
  {/* avatar or initials */}
</DropdownMenuTrigger>
```

`placement="navigation"` renders the text label “Account”; `placement="header"` renders the compact avatar. Do not create a profile route.

- [ ] **Step 5: Compose the new shell**

Extend the existing prop type without changing current callers:

```tsx
type PageShellProps = {
  children: ReactNode;
  maxWidth?: keyof typeof widths;
  className?: string;
  aside?: ReactNode;
};
```

Render `AppSidebar`, a compact `AppHeader`, the main content, and `MobileBottomNav`. When `aside` exists, use `xl:grid-cols-[minmax(0,1fr)_360px]`; below `xl`, render the aside after main content. Add bottom padding on mobile so the fixed navigation never covers actions.

Restyle `BrandMark` to Inter 700 and navy/primary without changing its `{ to?, className? }` interface. Replace `ProtectedRoute`'s bare text with a full-page `role="status"` state reading “Loading Cortex...” and using the same canvas.

- [ ] **Step 6: Run shell verification**

Run:

```bash
npm test -- src/components/layout/AppNavigation.test.tsx
npm run build
npm run lint
```

Expected: tests PASS; build and lint exit 0.

- [ ] **Step 7: Commit the shell**

```bash
git add frontend/src/components/layout frontend/src/components/AccountMenu.tsx frontend/src/components/AppHeader.tsx frontend/src/components/ProtectedRoute.tsx frontend/src/components/brand/BrandMark.tsx
git commit -m "feat(ui): add responsive app shell"
```

---

### Task 3: Landing and Clerk authentication slice

**Files:**
- Create: `frontend/src/components/landing/Hero.test.tsx`
- Create: `frontend/src/components/AuthLayout.test.tsx`
- Modify: `frontend/src/pages/Landing.tsx`
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/SignUp.tsx`
- Modify: `frontend/src/clerk/appearance.ts`
- Modify: `frontend/src/components/AuthLayout.tsx`
- Modify: `frontend/src/components/landing/LandingNav.tsx`
- Modify: `frontend/src/components/landing/Hero.tsx`
- Modify: `frontend/src/components/landing/Features.tsx`
- Modify: `frontend/src/components/landing/HowItWorks.tsx`
- Modify: `frontend/src/components/landing/Coverage.tsx`
- Modify: `frontend/src/components/landing/FinalCta.tsx`
- Modify: `frontend/src/components/brand/EmphasisPill.tsx`
- Modify: `frontend/src/components/brand/StickerCard.tsx`

**Interfaces:**
- Consumes: existing `HeroProps`, `LandingNavProps`, `FinalCtaProps`, Clerk `SignIn`/`SignUp`, and `clerkAppearance`.
- Produces: the same callbacks and Clerk routing behavior with target presentation. `PasswordSignInForm.tsx` remains untouched and is not wired into `Login`.

- [ ] **Step 1: Write behavior-preservation tests**

Create `Hero.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/render";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("normalizes a valid room code before joining", async () => {
    const user = userEvent.setup();
    const onJoinRoom = vi.fn();
    renderWithRouter(
      <Hero onCreateQuiz={vi.fn()} onHowItWorksClick={vi.fn()} onJoinRoom={onJoinRoom} />,
    );
    await user.type(screen.getByLabelText("Have a code?"), "ab-12c3");
    await user.click(screen.getByRole("button", { name: "Join room" }));
    expect(onJoinRoom).toHaveBeenCalledWith("AB12C3");
  });
});
```

Create `AuthLayout.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "@/test/render";
import AuthLayout from "./AuthLayout";

it("keeps the auth task heading and form in one labelled experience", () => {
  renderWithRouter(
    <AuthLayout heading="Welcome back." subtitle="Sign in to continue.">
      <form aria-label="Sign in form" />
    </AuthLayout>,
  );
  expect(screen.getByRole("heading", { name: "Welcome back." })).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "Sign in form" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests before visual changes**

Run: `npm test -- src/components/landing/Hero.test.tsx src/components/AuthLayout.test.tsx`

Expected: tests PASS, establishing the behavior that the redesign must retain.

- [ ] **Step 3: Redesign the landing hierarchy**

Keep `Landing.tsx` navigation logic unchanged. Restyle components to these contracts:

```text
LandingNav: white translucent surface, navy links, primary 48px CTA
Hero: dark navy hero panel, 42–48% text width, Join/Host actions, CSS quiz/trophy shapes
Features: three restrained white or primary-soft feature panels; no rotations
HowItWorks: numbered linear steps using existing five-step copy
Coverage: quiet wrapping subject pills; no fake filtering behavior
FinalCta: one navy/primary panel with one Create quiz action
```

Retain the current room-code form, `goToApp` behavior, smooth-scroll callbacks, and all IDs targeted by navigation. Convert `EmphasisPill` and `StickerCard` to 12–20px target radii, low-contrast borders, and semantic tones so no touched landing component uses the old sticker shadow or rotation convention.

- [ ] **Step 4: Redesign auth framing without replacing Clerk**

Use a two-column desktop `AuthLayout`: a navy decorative product panel and a white form region, collapsing to one column below `lg`. Keep `Login.tsx` and `SignUp.tsx` routing/path/fallback props unchanged.

Update `clerkAppearance.variables` to:

```ts
colorPrimary: "#405A9B",
colorBackground: "#FFFFFF",
colorForeground: "#111936",
colorMutedForeground: "#697188",
colorInput: "#F8F9FC",
colorBorder: "#E6E9F0",
colorRing: "#405A9B",
colorDanger: "#EF5A67",
fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
borderRadius: "12px",
```

Remove uppercase monospace Clerk labels and pill-only button styling. Preserve Clerk's built-in password, SSO, MFA, and verification orchestration.

- [ ] **Step 5: Verify landing and auth**

Run:

```bash
npm test -- src/components/landing/Hero.test.tsx src/components/AuthLayout.test.tsx
npm run build
npm run lint
```

Manually visit `/`, `/login`, and `/sign-up` at 390px and 1440px. Confirm all landing anchors, CTA routing, room-code handoff, Clerk password/Google controls, and verification subroutes remain usable.

- [ ] **Step 6: Commit the public slice**

```bash
git add frontend/src/pages/Landing.tsx frontend/src/pages/Login.tsx frontend/src/pages/SignUp.tsx frontend/src/clerk/appearance.ts frontend/src/components/AuthLayout.tsx frontend/src/components/AuthLayout.test.tsx frontend/src/components/landing frontend/src/components/brand
git commit -m "feat(ui): redesign landing and authentication"
```

---

### Task 4: Dashboard hero and live-room context

**Files:**
- Create: `frontend/src/components/dashboard/DashboardHero.tsx`
- Create: `frontend/src/components/dashboard/DashboardHero.test.tsx`
- Create: `frontend/src/components/dashboard/LiveRoomCard.tsx`
- Create: `frontend/src/components/dashboard/LiveRoomCard.test.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/components/dashboard/LiveRoomsSection.tsx`
- Modify: `frontend/src/components/dashboard/PublicRoomsList.tsx`
- Modify: `frontend/src/components/feedback/EmptyState.tsx`
- Delete: `frontend/src/components/dashboard/HostJoinCards.tsx`

**Interfaces:**
- Consumes: `PublicWaitingRoomSummary`, `PageShell.aside`, existing TanStack query key, and existing public-room socket events.
- Produces: `DashboardHero({ firstName?: string | null })` and `LiveRoomCard({ room, onJoin }: { room: PublicWaitingRoomSummary; onJoin: (roomCode: string) => void })`.

- [ ] **Step 1: Write failing dashboard presentation tests**

Create `LiveRoomCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LiveRoomCard from "./LiveRoomCard";

const room = {
  gameId: "game-1",
  roomCode: "ABC123",
  hostId: "host-1",
  hostUsername: "Maya",
  playerCount: 3,
  maxPlayers: 8,
  numberOfRounds: 10,
  quizGenStatus: "ready" as const,
  createdAt: "2026-09-01T12:00:00.000Z",
};

describe("LiveRoomCard", () => {
  it("joins with the existing room code", async () => {
    const onJoin = vi.fn();
    render(<LiveRoomCard room={room} onJoin={onJoin} />);
    await userEvent.click(screen.getByRole("button", { name: "Join ABC123" }));
    expect(onJoin).toHaveBeenCalledWith("ABC123");
  });

  it("disables a full room", () => {
    render(<LiveRoomCard room={{ ...room, playerCount: 8 }} onJoin={vi.fn()} />);
    expect(screen.getByRole("button", { name: "ABC123 is full" })).toBeDisabled();
  });
});
```

Create `DashboardHero.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "@/test/render";
import DashboardHero from "./DashboardHero";

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

describe("DashboardHero", () => {
  it.each([
    ["Join game", "/game/join"],
    ["Host game", "/game/create"],
  ])("routes %s to %s", async (label, path) => {
    renderWithRouter(
      <>
        <DashboardHero firstName="Maya" />
        <LocationProbe />
      </>,
      "/dashboard",
    );
    await userEvent.click(screen.getByRole("button", { name: label }));
    expect(screen.getByRole("status")).toHaveTextContent(path);
  });
});
```

- [ ] **Step 2: Run the tests and confirm missing components**

Run: `npm test -- src/components/dashboard/DashboardHero.test.tsx src/components/dashboard/LiveRoomCard.test.tsx`

Expected: FAIL because both new presentation components are missing.

- [ ] **Step 3: Build the supported dashboard hero**

Implement a 270–320px navy `DashboardHero` with the eyebrow “READY TO PLAY?”, heading “Challenge your friends. Own the leaderboard.”, supported Join and Host actions, and decorative CSS question/trophy shapes marked `aria-hidden="true"`. Use `useNavigate` internally and preserve the optional first-name greeting as supporting text rather than the main heading.

Replace `HostJoinCards` in `Dashboard.tsx`, then delete it. Do not add search, notifications, categories, featured quizzes, or fabricated activity.

- [ ] **Step 4: Extract room presentation without moving data ownership**

Move only the `<li>` presentation into `LiveRoomCard`. Keep `useAuth`, `useQuery`, `useSocket`, `watch_public_rooms`, `save_as_public`, `public_room_removed`, sorting, invalidation, and navigation in `PublicRoomsList`.

Render the live-room section through `PageShell aside={<LiveRoomsSection />}`. `LiveRoomCard` may show only room code, host username, player count, maximum players, question count, generation status, and full state from `PublicWaitingRoomSummary`.

Restyle loading skeletons, error state, and empty state to occupy the same card geometry. Keep “Try again” and “Create a quiz” actions wired to their existing behavior.

- [ ] **Step 5: Verify the dashboard slice**

Run:

```bash
npm test -- src/components/dashboard
npm run build
npm run lint
```

Manually verify `/dashboard` with loading, error, empty, open-room, generating-room, and full-room data at 390px, 1024px, and 1440px. Confirm realtime room insert/remove behavior is unchanged.

- [ ] **Step 6: Commit the dashboard**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/components/dashboard frontend/src/components/feedback/EmptyState.tsx
git commit -m "feat(ui): redesign dashboard and live rooms"
```

---

### Task 5: Create, upload, quiz selection, and join slice

**Files:**
- Create: `frontend/src/components/quiz-rooms/JoinRoomPanel.test.tsx`
- Create: `frontend/src/components/forms/RoomCodeInput.test.tsx`
- Modify: `frontend/src/pages/CreateGame.tsx`
- Modify: `frontend/src/pages/JoinGame.tsx`
- Modify: `frontend/src/components/forms/RoomCodeInput.tsx`
- Modify: `frontend/src/components/quiz-rooms/JoinRoomPanel.tsx`
- Modify: `frontend/src/components/quiz-rooms/QuizPickerList.tsx`
- Modify: `frontend/src/components/quiz-rooms/RoomPreviewCard.tsx`
- Modify: `frontend/src/components/quiz-rooms/HowJoiningWorks.tsx`
- Modify: `frontend/src/components/quiz-rooms/RoomSettings.tsx`
- Modify: `frontend/src/components/quiz-rooms/UploadPanel.tsx`
- Modify: `frontend/src/components/lobby/QuizGenerationPanel.tsx`

**Interfaces:**
- Consumes: existing `CreationSource = "upload" | "past"`, `QuizSummary`, mutation functions, `RoomCodeInput` props, `RoomSettings` props, `UploadPanel` props, and quiz generation store fields.
- Produces: unchanged create/join payloads and navigation; no new authoring source.

- [ ] **Step 1: Write room-code and join-flow tests**

Create `JoinRoomPanel.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JoinRoomPanel from "./JoinRoomPanel";

vi.mock("@/components/dashboard/PublicRoomsList", () => ({
  default: () => <div>Public rooms</div>,
}));

describe("JoinRoomPanel", () => {
  it("shows a precise error and then routes a normalized valid code", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/game/join"]}>
        <Routes>
          <Route path="/game/join" element={<JoinRoomPanel />} />
          <Route path="/game/lobby/:roomCode" element={<div>Lobby reached</div>} />
        </Routes>
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText("Room code"), "abc");
    await user.click(screen.getByRole("button", { name: "Join game" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Room code must be 6 letters or digits");
    await user.clear(screen.getByLabelText("Room code"));
    await user.type(screen.getByLabelText("Room code"), "abc123");
    await user.click(screen.getByRole("button", { name: "Join game" }));
    expect(screen.getByText("Lobby reached")).toBeInTheDocument();
  });
});
```

Create `RoomCodeInput.test.tsx`:

```tsx
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import RoomCodeInput from "./RoomCodeInput";

describe("RoomCodeInput", () => {
  it("normalizes typed input", async () => {
    function Harness() {
      const [value, setValue] = useState("");
      return <RoomCodeInput id="code" label="Room code" value={value} onChange={setValue} />;
    }
    render(<Harness />);
    const input = screen.getByLabelText("Room code");
    expect(input).toHaveAttribute("maxlength", "6");
    await userEvent.type(input, "ab-12c3");
    expect(input).toHaveValue("AB12C3");
  });

  it("links an error to the input", () => {
    render(
      <RoomCodeInput id="code" label="Room code" value="ABC" onChange={() => undefined} error="Room code must be 6 letters or digits" />,
    );
    expect(screen.getByRole("alert")).toHaveAttribute("id", "code-error");
    expect(screen.getByLabelText("Room code")).toHaveAttribute("aria-describedby", "code-error");
  });
});
```

- [ ] **Step 2: Run the tests and record the copy mismatch**

Run: `npm test -- src/components/quiz-rooms/JoinRoomPanel.test.tsx src/components/forms/RoomCodeInput.test.tsx`

Expected: the normalization test passes; the join test FAILS because the current label/action copy is “Enter Room Code”/“Join room” instead of the target “Room code”/“Join game”.

- [ ] **Step 3: Redesign create without changing mutations**

Keep every state variable and the mutation body in `CreateGame.tsx` unchanged. Replace the local Create/Join pill nav with a quiet page header because the global shell owns navigation. Preserve tabs with exactly two values: `upload` and `past`.

Use a main form region and a 360px sticky preview at `xl`; fold preview below the form earlier. Restyle quiz rows, upload dropzone, numeric steppers, public switch, and preview using target cards and semantic selection rings. Keep PDF/TXT validation, 10 MB copy, title fallback, question caps, room settings, background generation, and best-effort failure marking unchanged.

- [ ] **Step 4: Redesign direct join and generation feedback**

Keep `/game/join` as a full page with one prominent form and public rooms below or in the real-content rail. Change the visible label to “Room code,” submit action to “Join game,” and invalid copy to “Room code must be 6 letters or digits.” Retain autofocus, paste, Enter, uppercase normalization, and routing.

Restyle `QuizGenerationPanel` to semantic processing, ready, waiting, and failed states. Keep `aria-live="polite"`, host-only retry, the exact retry upload request, and the rule that the source must be selected again. Use “We couldn't finish this quiz.” as the failed heading without claiming the old file was retained.

- [ ] **Step 5: Verify create and join**

Run:

```bash
npm test -- src/components/quiz-rooms/JoinRoomPanel.test.tsx src/components/forms/RoomCodeInput.test.tsx
npm run build
npm run lint
```

Manually verify `/game/create` in Upload notes and Past quizzes states, query loading/error/empty/data, file drag/drop and click selection, invalid files, room setting limits, public toggle, disabled/pending launch, and background-generation navigation. Verify `/game/join` with keyboard-only entry, paste, invalid input, Enter submission, and public room joins.

- [ ] **Step 6: Commit create and join**

```bash
git add frontend/src/pages/CreateGame.tsx frontend/src/pages/JoinGame.tsx frontend/src/components/forms frontend/src/components/quiz-rooms frontend/src/components/lobby/QuizGenerationPanel.tsx
git commit -m "feat(ui): redesign create and join flows"
```

---

### Task 6: Lobby anticipation and player readiness

**Files:**
- Create: `frontend/src/components/lobby/PlayerCard.tsx`
- Create: `frontend/src/components/lobby/PlayerCard.test.tsx`
- Modify: `frontend/src/pages/Lobby.tsx`
- Modify: `frontend/src/components/lobby/QuizGenerationPanel.tsx`

**Interfaces:**
- Consumes: `LobbyPlayer`, `hostId`, `myUserId`, `quizGenStatus`, `quizId`, existing lobby actions, and `PageShell`.
- Produces: `PlayerCard({ player, isHost, isSelf }: { player: LobbyPlayer; isHost: boolean; isSelf: boolean })`. No socket/store contract changes.

- [ ] **Step 1: Write the failing player-card test**

Create `PlayerCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlayerCard from "./PlayerCard";

it("announces self, host, and readiness without color alone", () => {
  render(
    <PlayerCard
      player={{ id: "p1", username: "Maya", ready: true }}
      isHost
      isSelf
    />,
  );
  expect(screen.getByText("Maya")).toBeInTheDocument();
  expect(screen.getByText("You")).toBeInTheDocument();
  expect(screen.getByText("Host")).toBeInTheDocument();
  expect(screen.getByText("Ready")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm the component is missing**

Run: `npm test -- src/components/lobby/PlayerCard.test.tsx`

Expected: FAIL because `PlayerCard.tsx` does not exist.

- [ ] **Step 3: Extract and redesign player presentation**

Move the local `PlayerRow` markup from `Lobby.tsx` into `PlayerCard`. Use a 16px white card, avatar-initial circle, explicit “You,” “Host,” and “Ready”/“Not ready” labels, and an icon plus text for readiness. Use Motion for a 220ms fade/scale entrance only when reduced motion is not requested.

- [ ] **Step 4: Recompose the lobby around anticipation**

Keep all hooks, effects, store selectors, clipboard fallback, navigation, toast handling, and socket callbacks unchanged. Recompose the page as:

```text
Header: “Game lobby” + large room code + Copy action + connection status
Status: quiz generation panel
Players: responsive PlayerCard grid
Host controls: isolated Start game area
Player controls: explicit “I'm ready” / “Mark not ready” action
Leave: quiet secondary action
```

Derive:

```ts
const currentPlayer = players.find((player) => player.id === myUserId);
const allPlayersReady = players.length >= 2 && players.every((player) => player.ready);
const canStart = quizReady && allPlayersReady && status !== "starting";
```

Use `canStart` only for presentation; keep `attemptStart()` and server validation in `handleStart`. Do not move game-start rules into the component.

- [ ] **Step 5: Verify lobby states**

Run:

```bash
npm test -- src/components/lobby/PlayerCard.test.tsx
npm run build
npm run lint
```

Manually verify host/player views, 1-player and 2+-player rooms, ready/not-ready, processing/ready/failed generation, retry, player arrival/leave, host promotion, copied feedback, disconnected state, and game-start navigation at 390px and 1440px.

- [ ] **Step 6: Commit the lobby**

```bash
git add frontend/src/pages/Lobby.tsx frontend/src/components/lobby
git commit -m "feat(ui): redesign multiplayer lobby"
```

---

### Task 7: Chrome-free gameplay, feedback, connection state, and results

**Files:**
- Create: `frontend/src/components/game/ConnectionBanner.tsx`
- Create: `frontend/src/components/game/ConnectionBanner.test.tsx`
- Create: `frontend/src/components/game/QuestionCard.test.tsx`
- Create: `frontend/src/components/game/Timer.test.tsx`
- Modify: `frontend/src/pages/Game.tsx`
- Modify: `frontend/src/hooks/useGameSocket.ts`
- Modify: `frontend/src/components/game/Countdown.tsx`
- Modify: `frontend/src/components/game/QuestionCard.tsx`
- Modify: `frontend/src/components/game/Timer.tsx`
- Modify: `frontend/src/components/game/AnswerFeedback.tsx`
- Modify: `frontend/src/components/game/RoundResults.tsx`
- Modify: `frontend/src/components/game/Leaderboard.tsx`
- Modify: `frontend/src/components/game/GameResults.tsx`

**Interfaces:**
- Consumes: existing game phases and payload types, `useGameSocket(gameId)`, `useLobbyStore`, and `useGameStore`.
- Produces: `ConnectionState = "connected" | "reconnecting" | "offline"`, `ConnectionBanner({ state, onRetry, onExit })`, and an extended `useGameSocket` return `{ connected, connectionState, submitAnswer, retryConnection }`. Existing `submitAnswer(questionId, answerIndex, responseTime)` remains unchanged.

- [ ] **Step 1: Write answer-lock and connection tests**

Create `QuestionCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuestionCard from "./QuestionCard";

it("locks every answer and confirms submission", async () => {
  const onSubmit = vi.fn();
  const { rerender } = render(
    <QuestionCard question="FIFO?" options={["Stack", "Queue", "Heap", "Tree"]} onSubmit={onSubmit} disabled={false} selectedIndex={null} />,
  );
  await userEvent.click(screen.getByRole("button", { name: /B.*Queue/i }));
  expect(onSubmit).toHaveBeenCalledWith(1);
  rerender(
    <QuestionCard question="FIFO?" options={["Stack", "Queue", "Heap", "Tree"]} onSubmit={onSubmit} disabled selectedIndex={1} />,
  );
  expect(screen.getByRole("status")).toHaveTextContent("Answer submitted");
  for (const button of screen.getAllByRole("button")) {
    expect(button).toBeDisabled();
  }
});
```

Create `ConnectionBanner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConnectionBanner from "./ConnectionBanner";

describe("ConnectionBanner", () => {
  it("keeps reconnecting non-blocking", () => {
    render(<ConnectionBanner state="reconnecting" onRetry={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("Connection lost. Reconnecting...");
  });

  it("offers recovery only when automatic reconnection stopped", () => {
    render(<ConnectionBanner state="offline" onRetry={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't reconnect you to this game.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return home" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests and confirm missing target behavior**

Run: `npm test -- src/components/game/QuestionCard.test.tsx src/components/game/ConnectionBanner.test.tsx`

Expected: FAIL because `ConnectionBanner` is missing and `QuestionCard` does not render “Answer submitted.”

- [ ] **Step 3: Expose connection state without changing socket events**

In `useGameSocket`, retain all current listeners and emissions. Derive:

```ts
export type ConnectionState = "connected" | "reconnecting" | "offline";

const connectionState: ConnectionState = connected
  ? "connected"
  : socket && !socket.active
    ? "offline"
    : "reconnecting";

function retryConnection() {
  socket?.connect();
}
```

Return `connectionState` and `retryConnection` alongside the existing values. `ConnectionBanner` uses `role="status"` for reconnecting/reconnected feedback and `role="alert"` for offline recovery. In `Game.tsx`, keep a local previous-state ref and show “Reconnected.” for two seconds after `reconnecting → connected`.

- [ ] **Step 4: Remove authenticated shell chrome from gameplay**

Replace `PageShell` in `Game.tsx` with a full-height `bg-background` canvas and centered `max-w-4xl` main region. Keep all game ID guards, response timing, store cleanup, phase selection, and submission calls unchanged. Header order is round count then timer; no sidebar, account menu, or bottom nav renders.

- [ ] **Step 5: Redesign each game phase against existing payloads**

Apply these exact boundaries:

```text
Countdown: centered navy/primary-soft panel, numeric countdown, reduced-motion branch
QuestionCard: 2×2 at md, stacked below md, min-height 88px desktop / 56px mobile
Timer: numeric seconds plus circular progress; danger icon/text treatment at <=5 seconds
AnswerFeedback: “Correct!” or “Not quite”; icon + label + color; existing points/placement/correctAnswer only
RoundResults: “Not quite” instead of “Wrong”; current submission and leaderboard payloads only
Leaderboard: highlight current player with “You”; gold accent only for rank 1; all server rows retained
GameResults: current player's rank and score from finalLeaderboard, winner summary, and one “Return home” action
```

Preserve all `useReducedMotion` branches. Mark decorative icons `aria-hidden`; keep meaningful status text in the accessibility tree.

- [ ] **Step 6: Add deterministic timer coverage**

Create `Timer.test.tsx`:

```tsx
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Timer from "./Timer";

describe("Timer", () => {
  afterEach(() => vi.useRealTimers());

  it("announces remaining seconds while visual progress changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00.000Z"));
    render(<Timer startedAt={new Date()} timeLimit={30_000} />);
    expect(screen.getByRole("timer")).toHaveAccessibleName("30 seconds remaining");
    act(() => {
      vi.advanceTimersByTime(26_000);
    });
    expect(screen.getByRole("timer")).toHaveAccessibleName("4 seconds remaining");
  });
});
```

- [ ] **Step 7: Verify the complete game loop**

Run:

```bash
npm test -- src/components/game
npm run build
npm run lint
```

Manually verify idle, countdown, question, selected/locked, correct, incorrect, round result, leaderboard, final result, reconnecting, reconnected, offline, keyboard-only answers, screen-reader status text, and reduced motion at 390px and 1440px.

- [ ] **Step 8: Commit gameplay**

```bash
git add frontend/src/pages/Game.tsx frontend/src/hooks/useGameSocket.ts frontend/src/components/game
git commit -m "feat(ui): redesign live gameplay and results"
```

---

### Task 8: Cross-route cleanup, accessibility audit, and design evidence

**Files:**
- Modify: every touched file reported by the token audit below
- Modify: `frontend/src/components/ui/button.tsx`
- Modify: `frontend/src/index.css`
- Create: `docs/design/REDESIGN_QA.md`
- Modify: `docs/design/DESIGN_DECISIONS.md`
- Modify: `docs/design/COMPONENTS.md`

**Interfaces:**
- Consumes: all redesigned slices and the approved design documentation.
- Produces: no old-theme compatibility tokens or color-named button variants, a passing full frontend gate, a completed manual QA record, and source-backed implemented decisions.

- [ ] **Step 1: Run the old-theme audit and save the exact hit list**

Run from the repository root:

```bash
rg -n 'font-display|forest|candy-|cream|gloss|radius-sticker|sticker-card|shadow-\[[^]]*0_0|variant="(candy|rose)"' frontend/src --glob '*.tsx' --glob '*.css'
```

Expected: any remaining hits identify an incomplete migration. Semantic `font-display` may remain because it now aliases Inter; every color, sticker, old shadow, and color-named button-variant hit must be removed.

- [ ] **Step 2: Remove compatibility variants and aliases**

Change all remaining `variant="candy"` and `variant="rose"` consumers to `default`, `secondary`, or `outline` according to action hierarchy. Delete `candy` and `rose` from `buttonVariants`. Remove temporary `cream`, `track`, `forest`, `candy-*`, `gloss`, and `radius-sticker` aliases from `index.css` only after the audit returns no consumers.

- [ ] **Step 3: Run semantic/accessibility source checks**

Run:

```bash
rg -n '<(button|a)[^>]*>\s*<(svg|[A-Z][A-Za-z0-9]*)' frontend/src --glob '*.tsx'
rg -n 'outline-none' frontend/src --glob '*.tsx'
rg -n 'transition-all' frontend/src --glob '*.tsx'
rg -n '#[0-9a-fA-F]{3,8}' frontend/src --glob '*.tsx'
```

For each icon-only control hit, add an accessible name. For each `outline-none` hit, confirm the same class list includes `focus-visible:ring`. Replace `transition-all` with the changed properties. Move remaining literal feature colors to semantic tokens unless they are the documented hero composition.

- [ ] **Step 4: Create the manual QA record**

Create `docs/design/REDESIGN_QA.md` with checked rows only after exercising them:

```markdown
# Frontend redesign QA

| Route/state | 390px | 1024px | 1440px | Keyboard | Reduced motion |
| --- | --- | --- | --- | --- | --- |
| Landing and anchor navigation | [ ] | [ ] | [ ] | [ ] | [ ] |
| Login, sign-up, and Clerk verification | [ ] | [ ] | [ ] | [ ] | [ ] |
| Dashboard loading, empty, error, open, full | [ ] | [ ] | [ ] | [ ] | [ ] |
| Create upload, saved quiz, settings, pending/error | [ ] | [ ] | [ ] | [ ] | [ ] |
| Join invalid, valid, Enter, and public room | [ ] | [ ] | [ ] | [ ] | [ ] |
| Lobby host, player, ready, generation, disconnect | [ ] | [ ] | [ ] | [ ] | [ ] |
| Game countdown, answer, feedback, round, results | [ ] | [ ] | [ ] | [ ] | [ ] |
| Game reconnecting, restored, and offline | [ ] | [ ] | [ ] | [ ] | [ ] |
```

Do not mark a cell until it has been exercised with the existing local stack.

- [ ] **Step 5: Run the complete automated gate**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: every command exits 0. Fix regressions in the owning slice and rerun its focused test before rerunning the full gate.

- [ ] **Step 6: Update design evidence**

In `DESIGN_DECISIONS.md`, move each implemented target row into “Implemented behavior” and cite exact source paths: `index.css`, UI primitives, shell components, dashboard components, lobby components, and game components. In `COMPONENTS.md`, replace “target” wording for shipped components with their actual props and responsibilities. Keep unsupported inventory unchanged.

- [ ] **Step 7: Review scope and working tree**

Run from the repository root:

```bash
git diff --check
git status --short
git diff --stat bb304f1..HEAD
```

Confirm there are no backend edits from this plan and that unrelated pre-existing changes remain unstaged.

- [ ] **Step 8: Commit the audit and evidence**

```bash
git add -u frontend/src frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/tsconfig.app.json
git add -f docs/design/REDESIGN_QA.md docs/design/DESIGN_DECISIONS.md docs/design/COMPONENTS.md
git commit -m "docs(ui): verify frontend redesign"
```

## Completion Criteria

- All eight tasks are committed independently.
- `npm test`, `npm run build`, and `npm run lint` pass in `frontend/`.
- Existing routes, Clerk orchestration, API calls, socket events, and Zustand ownership are unchanged.
- Desktop authenticated pages use the sidebar/context-shell hierarchy; mobile uses unobscured bottom navigation; gameplay has no app chrome.
- No unsupported controls, claims, metrics, or product flows appear.
- No old-theme color/sticker compatibility tokens remain in frontend consumers.
- Every QA matrix cell is checked with implementation evidence recorded in `DESIGN_DECISIONS.md`.
