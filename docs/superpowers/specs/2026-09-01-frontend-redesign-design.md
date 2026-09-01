# Cortex Frontend Redesign Specification

## Status

Approved documentation architecture and product scope. This specification covers the existing frontend experience only and is the source for the implementation plan after user review.

## Goal

Migrate Cortex from its current warm sticker-style interface to the playful, polished light game-dashboard system in [`design.md`](../../../design.md) while preserving every supported route, backend contract, authentication branch, real-time behavior, and accessibility requirement.

## Scope

The redesign covers:

- Public landing
- Login, sign-up, SSO callback, and Clerk-requested verification states
- Authenticated dashboard
- Existing-quiz selection and PDF/TXT quiz generation
- Room settings and room-code joining
- Host and player lobby states
- Countdown, question, answer submission, feedback, leaderboard, and final results
- Loading, empty, error, reconnecting, responsive, keyboard, and reduced-motion states for those flows

The redesign does not add search, notifications, category browsing, quiz covers, topic/manual authoring, quiz editing or detail actions, solo practice, result review/sharing, accuracy metrics, popularity, difficulty, host analytics, or new backend behavior. API payloads and semantics do not change.

## Design direction

The target uses a cool blue-gray canvas, white surfaces, dark navy typography, a restrained cool-blue primary, and pink, yellow, cyan, and purple accents. Inter replaces the current display/body pairing. Layout follows an 8px spacing rhythm, 10–24px functional radii, low-contrast borders, and rare soft shadows. This implementation uses product-owned CSS shapes and Lucide icons for decorative compositions; it adds no copied, licensed, or unrelated stock artwork.

Authenticated desktop pages gain a quiet icon-led navigation rail, flexible main content, and a context rail only when real supported content justifies it. Tablet layouts fold context content into the main column. Mobile uses a bottom navigation with working Home, Create, Join, and account destinations. Active gameplay has no dashboard chrome.

## Architecture and component boundaries

The implementation evolves the current frontend rather than replacing its state or transport layers:

1. `frontend/src/index.css` owns target tokens, font aliases, global focus/motion behavior, and page canvas.
2. Existing `components/ui/` primitives translate semantic variants into those tokens.
3. `PageShell` owns authenticated responsive chrome, assisted by focused sidebar and mobile-navigation components if splitting makes the shell clearer.
4. Existing feature components keep their current props and state sources wherever practical. Presentation-only extraction is allowed for repeated dashboard room cards and lobby player cards.
5. Page components continue selecting phases and arranging features. They do not absorb API, socket, or game-rule logic from hooks, stores, or services.

The dashboard exposes two primary supported intents—join and host/create—and the existing public-room feed. Quiz selection remains in the existing create flow. Join routes to the complete `/game/join` page; this redesign does not introduce a dialog system.

## Route-level experience

### Landing and authentication

Landing retains its current product narrative and working calls to action, restyled with the target hierarchy and palette. Authentication remains calm and task-focused within a branded frame. Password, Google SSO, MFA, device verification, and callback behavior remain unchanged.

### Dashboard

The hero immediately exposes Join game and Host game/Create quiz. Live public rooms use the existing realtime feed and available player/host data only. Empty, loading, and failure states occupy the same layout footprint as content and offer one working next action. No inert search, notification, category, or featured-content controls appear.

### Create and join

Create preserves two supported paths: choose an existing ready quiz or upload PDF/TXT notes and configure the room. Generation states use only status data already returned by the app. Join retains one normalized six-character room-code action and uses the authenticated player's identity.

### Lobby

The room code is prominent and copyable, players are readable as a grid/list, readiness is explicit, and host controls are visually separate. New-player motion is restrained and optional under reduced motion. Start requirements and all socket behavior remain unchanged.

### Gameplay and results

During play, timer, question, answers, score, and rank dominate. Answers are at least 56px high, arrange in a 2×2 grid only when wide enough, lock after submission, and confirm receipt. Feedback combines icon, text, and color. Round and final leaderboards clearly mark the current player using server-provided data. Results show only placement, score, and actions supported by the existing implementation.

## State and failure handling

Skeletons mirror the final dashboard and list geometry. Form failures remain inline; short confirmations may use the existing toaster. Reconnecting is a persistent non-blocking status, reconnection is announced and briefly visible, and unrecoverable loss is blocking only when the current client can no longer continue. User-facing copy never names internal queues, Redis, job IDs, workers, or socket event names.

## Accessibility and responsive requirements

The redesign targets WCAG 2.2 AA, including contrast, 44×44px interactive targets, visible focus, semantic controls, labels for icon-only actions, logical keyboard order, status announcements, answer-lock announcements, and non-color correctness/timer cues. Existing `useReducedMotion` branches and the global reduced-motion fallback remain effective.

The same behavior works from mobile through desktop. Mobile is single-column, context modules follow primary content, bottom navigation does not cover actions, and answer options stack. Desktop may add shell columns without changing task order.

## Verification strategy

The foundation adds Vitest, React Testing Library, `user-event`, `jest-dom`, and jsdom so shared navigation and interaction contracts can be developed test-first. Each implementation slice must pass its focused tests plus `npm run build` and `npm run lint` from `frontend/`. Tests assert behavior, semantics, and state—not pixel snapshots. Manually verify every affected route at mobile and desktop widths, keyboard navigation, reduced motion, loading/empty/error states, and socket-driven phase transitions using the existing local stack.

## Delivery sequence

1. Token, typography, primitive, focus, and reduced-motion foundation.
2. Responsive authenticated shell and navigation.
3. Landing and authentication slice.
4. Dashboard and public-room slice.
5. Create, join, and generation slice.
6. Lobby slice.
7. Gameplay, feedback, leaderboard, and results slice.
8. Cross-route responsive, state, accessibility, and consistency audit.

Each slice is independently buildable and must not leave old and new theme tokens mixed in touched components.
