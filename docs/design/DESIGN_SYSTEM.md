# Cortex design system — approved target

This document translates [`design.md`](../../design.md) into the target system for the existing Cortex frontend. It is a migration contract, not a claim about the current render. Until a convention is implemented, [`DESIGN_DECISIONS.md`](DESIGN_DECISIONS.md) records it as approved target state.

## Product character

Cortex should feel like a real multiplayer game platform: playful but not childish, competitive but not aggressive, social without clutter, and fast enough that game state is always obvious. Visual polish comes from hierarchy, spacing, original artwork, and interaction quality—not extra controls.

## Color tokens

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| App canvas | `--bg-app` | `#F4F6FB` | Page and shell background |
| Surface | `--bg-surface` | `#FFFFFF` | Cards, panels, menus, modals |
| Subtle surface | `--bg-subtle` | `#F8F9FC` | Inputs and secondary regions |
| Border | `--border` | `#E6E9F0` | Default low-contrast borders |
| Primary text | `--text-primary` | `#111936` | Headings and important values |
| Secondary text | `--text-secondary` | `#697188` | Body and supporting copy |
| Muted text | `--text-muted` | `#9AA2B3` | Metadata and placeholders |
| Primary | `--primary-600` | `#405A9B` | Main actions and active navigation |
| Primary hover | `--primary-500` | `#506DB2` | Hover and highlight states |
| Primary soft | `--primary-100` | `#EEF2FB` | Selected and quiet active states |
| Pink accent | `--accent-pink` | `#F06C9B` | Playful emphasis only |
| Yellow accent | `--accent-yellow` | `#FFBD3D` | Score and streak emphasis |
| Cyan accent | `--accent-cyan` | `#55B8C6` | Supporting game accent |
| Purple accent | `--accent-purple` | `#9B79D1` | AI-generation emphasis |
| Success | `--success` | `#32B57A` | Correct and successful state |
| Success soft | `--success-soft` | `#EAF8F2` | Correct-state background |
| Danger | `--danger` | `#EF5A67` | Error and incorrect state |
| Danger soft | `--danger-soft` | `#FFF0F2` | Error-state background |
| Warning | `--warning` | `#F5A623` | Warning and attention state |
| Info | `--info` | `#4D8DEB` | Connection and informational state |

Use semantic tokens rather than literal colors in components. Correct and incorrect states always pair color with an icon and text label.

## Typography

Inter is the target family for display and body text. Use at most three weights on a screen: 400 for body, 600 for controls and compact headings, and 700 for major headings. Scores and rapidly changing game values may use 700 with tabular numerals.

| Role | Size | Weight |
| --- | --- | --- |
| Display | `40–48px` | 700 |
| H1 | `32px` | 700 |
| H2 | `24px` | 700 |
| H3 | `18–20px` | 600–700 |
| Body | `15–16px` | 400 |
| Label | `13–14px` | 600 |
| Caption | `12–13px` | 400 |
| Score | `40–56px` | 700 |

Use sentence case. Keep body lines under roughly 70 characters. Room codes remain uppercase, monospaced, widely tracked, and readable at distance.

## Spacing, shape, and depth

Use the 8px rhythm with `4`, `8`, `12`, `16`, `24`, `32`, `40`, `48`, and `64px` steps. Standard control padding is 16px, card padding 24px, section gaps 32–40px, and major page separation 48–64px.

| Element | Radius |
| --- | --- |
| Small control | `10px` |
| Input or button | `12px` |
| Standard card | `16px` |
| Large panel | `20px` |
| Hero | `24px` |
| Pill | `999px` |

Use borders before shadows. Standard surfaces use a border and either no shadow or `0 8px 24px rgb(32 43 72 / 0.06)`. Reserve `0 12px 32px rgb(32 43 72 / 0.10)` for true floating layers. Do not use glassmorphism, arbitrary rotations, thick sticker borders, or gradients outside a deliberate hero/illustration treatment.

## Shell and responsive layout

Authenticated desktop pages use a quiet icon sidebar, a flexible main region, and an optional `340–380px` context rail when supported content exists. Limit the full shell to `1600px`, keep main gutters at `24–32px`, and never fill a rail with invented content. Navigation includes only working destinations: Home, Create, Join, and the account menu.

Below `1280px`, move context-rail content into the main flow. Below `768px`, replace the sidebar with a bottom navigation for Home, Create, Join, and Profile/account. Content remains mobile-first and single-column; gameplay answers stack when a two-column grid would make targets too narrow.

Landing and auth use the same palette and typography without authenticated app chrome. Active gameplay removes sidebar, bottom navigation, and dashboard context so timer, question, answers, score, and rank own the hierarchy.

## Controls, icons, and motion

Primary buttons are 48px high with a 12px radius; one primary action is allowed per area. Secondary buttons use a white surface and border. Icon buttons are 40–44px square. Inputs are 48–52px high with a subtle surface, border, visible label, precise inline error, and 3px soft focus ring.

Use `lucide-react` consistently: 20px by default, 22–24px in the sidebar, and 16px for metadata. Preserve visible labels or accessible names for icon-only controls.

Motion communicates state. Use 120–160ms for hover/press, 180–240ms for overlays and feedback, 220–300ms for player arrival, and 300–450ms for score/leaderboard movement. Respect `prefers-reduced-motion`; avoid constant floating animation and page transitions during play.

## Accessibility baseline

Target WCAG 2.2 AA: 4.5:1 text contrast where required, 44×44px interactive targets, keyboard access, visible focus, semantic controls, accessible icon names, reduced-motion support, and live announcements for meaningful game-state changes. Timers and answer feedback must never rely on color alone.
