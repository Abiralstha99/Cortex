# Cortex Redesign — Product Design Specification

> **Design direction:** A playful, polished game dashboard inspired by the supplied reference: bright white canvas, soft blue-gray shell, large rounded cards, restrained shadows, bold navy typography, colorful game imagery, and clear primary actions.
>
> **Important:** Borrow the visual system and layout principles, not the original game's characters, logos, copy, or artwork.

---

## 1. Product Experience Goal

Cortex should feel like a **real multiplayer game platform**, not a utility dashboard.

The experience should communicate three things immediately:

1. **There is something fun to play right now.**
2. **Creating or joining a game is effortless.**
3. **The interface feels energetic without becoming visually noisy.**

### Design personality

- Playful, not childish
- Competitive, not aggressive
- Modern, not corporate
- Social, not cluttered
- Fast, responsive, and game-like

### Core UX priorities

1. Join a game quickly
2. Host a quiz quickly
3. Resume/replay recent quizzes
4. Discover public games
5. Understand live game state instantly
6. Make score, rank, timer, and answer feedback impossible to miss

---

# 2. Visual Language

## Overall aesthetic

Use a **light gaming dashboard** with a soft cool-gray page background and white elevated surfaces.

The supplied reference works because it combines:

- Large white negative space
- Dark navy text instead of pure black
- One dominant hero area
- Rounded rectangular cards
- Low-contrast borders
- Pastel accent backgrounds
- Illustrations used as focal points
- Minimal navigation labels
- Strong hierarchy between primary and secondary content

Cortex should use the same principles.

---

# 3. Design Tokens

## Color Palette

### Foundation

| Token              | Value     | Use                     |
| ------------------ | --------- | ----------------------- |
| `--bg-app`         | `#F4F6FB` | Page shell/background   |
| `--bg-surface`     | `#FFFFFF` | Cards, panels, modals   |
| `--bg-subtle`      | `#F8F9FC` | Inputs, secondary cards |
| `--border`         | `#E6E9F0` | Default borders         |
| `--text-primary`   | `#111936` | Headings / major text   |
| `--text-secondary` | `#697188` | Supporting text         |
| `--text-muted`     | `#9AA2B3` | Metadata / placeholders |

### Brand

Use one cool primary color and one energetic secondary accent.

| Token             | Value     | Use                       |
| ----------------- | --------- | ------------------------- |
| `--primary-600`   | `#405A9B` | Main buttons / active nav |
| `--primary-500`   | `#506DB2` | Hover / highlights        |
| `--primary-100`   | `#EEF2FB` | Selected backgrounds      |
| `--accent-pink`   | `#F06C9B` | Fun accent / categories   |
| `--accent-yellow` | `#FFBD3D` | Score / streak            |
| `--accent-cyan`   | `#55B8C6` | Supporting accent         |
| `--accent-purple` | `#9B79D1` | Category / AI-related UI  |

### Semantic

| Token            | Value     |
| ---------------- | --------- |
| `--success`      | `#32B57A` |
| `--success-soft` | `#EAF8F2` |
| `--danger`       | `#EF5A67` |
| `--danger-soft`  | `#FFF0F2` |
| `--warning`      | `#F5A623` |
| `--info`         | `#4D8DEB` |

### Answer colors

Avoid relying only on red/green. Pair color with iconography and labels.

- Correct: green + check icon + “Correct”
- Incorrect: red + X icon + “Incorrect”
- Selected: primary blue outline
- Unselected: neutral white

---

# 4. Typography

Use **Inter**, **Manrope**, or **Plus Jakarta Sans**.

Recommended: **Inter** for implementation simplicity.

| Style   |    Size | Weight | Use                    |
| ------- | ------: | -----: | ---------------------- |
| Display | 40–48px |    700 | Hero headline          |
| H1      |    32px |    700 | Page title             |
| H2      |    24px |    700 | Major section title    |
| H3      | 18–20px |    650 | Card titles            |
| Body    | 15–16px |    400 | General copy           |
| Label   | 13–14px |    600 | Buttons / filters      |
| Caption | 12–13px |    400 | Metadata               |
| Score   | 40–56px |    750 | Live ranking / results |

### Rules

- Do not use more than 3 font weights on one screen.
- Use sentence case, not ALL CAPS, except very small eyebrow labels.
- Keep body copy below ~70 characters per line.

---

# 5. Spacing and Shape

Use an **8px spacing system**.

```text
4   micro spacing
8   tight spacing
12  icon/text gap
16  standard component padding
24  card padding
32  section gap
40  large section gap
48  major page spacing
64  hero spacing
```

### Radius

| Component        | Radius |
| ---------------- | -----: |
| Small controls   |   10px |
| Inputs / buttons |   12px |
| Standard cards   |   16px |
| Large cards      |   20px |
| Hero panels      |   24px |
| Pills            |  999px |

### Shadows

Keep shadows soft and rare.

```css
--shadow-card: 0 8px 24px rgba(32, 43, 72, 0.06);
--shadow-floating: 0 12px 32px rgba(32, 43, 72, 0.1);
```

Prefer border + subtle shadow over heavy floating cards.

---

# 6. App Shell

## Desktop layout

```text
┌──────────┬─────────────────────────────────┬───────────────────┐
│ Sidebar  │ Main content                    │ Context panel     │
│ 88px     │ flexible                        │ 340–380px         │
│          │                                 │                   │
│ logo     │ topbar                          │ activity / game   │
│ nav      │ hero                            │ details / friends │
│          │ categories                      │                   │
│          │ quiz cards                      │                   │
└──────────┴─────────────────────────────────┴───────────────────┘
```

### Width

- App max-width: `1600px`
- Sidebar: `88px`
- Main: `minmax(0, 1fr)`
- Context panel: `360px`
- Main gutter: `24–32px`

The reference succeeds because the left navigation is visually quiet while the center content owns attention.

---

# 7. Navigation

## Desktop sidebar

Use icons with tooltips rather than text labels.

Suggested order:

1. Cortex logo
2. Home
3. Discover
4. My Quizzes
5. Create Quiz
6. Game History
7. Friends / Players
8. Settings
9. Profile / Log out at bottom

### Active state

- Dark navy/primary icon
- Tiny dot underneath or soft rounded background
- Do not use a large solid navigation pill

### Mobile

Replace sidebar with a 4-item bottom navigation:

- Home
- Discover
- Create
- Profile

---

# 8. Home Dashboard

The home screen should mirror the **information hierarchy** of the reference image, adapted for Cortex.

## A. Top bar

Left:

- Search field: `Search quizzes, topics, or rooms`

Right:

- Notifications
- Avatar
- Username / dropdown

Search should feel low emphasis until focused.

---

## B. Hero Card

This is the strongest visual area of the page.

### Purpose

Give users an obvious next action.

### Recommended content

**Eyebrow**
`READY TO PLAY?`

**Headline**
`Challenge your friends. Own the leaderboard.`

**Supporting copy**
`Join a live room or host your own quiz in seconds.`

**Primary CTA**
`Join Game`

**Secondary CTA**
`Host Game`

### Visual

Use original Cortex artwork such as:

- Floating answer cards
- Trophy
- Lightning bolt
- Quiz bubbles
- Stylized players
- Abstract game shapes

Do not crowd the artwork behind text.

### Hero styling

```text
background: deep blue → teal gradient
height: 270–320px
radius: 24px
padding: 40px
text width: 42–48%
illustration width: 45–50%
```

A darker hero works especially well because the rest of the dashboard is light.

---

## C. Quick Categories

Reference analogue: “Games Category”.

Quiz categories could include:

- Computer Science
- Science
- History
- Movies
- Sports
- Random
- AI Generated

Display as horizontal pills.

### Category pill

```text
[ icon ] Category Name
```

Selected state:

- Soft colored background
- Colored icon circle
- 1.5px accent border

Keep pills horizontal-scrollable on smaller screens.

---

## D. Quiz Cards

Reference analogue: game cards.

Each card should answer:

- What is this quiz?
- What category is it?
- How long is it?
- How popular/difficult is it?
- Can I start immediately?

### Card structure

```text
┌───────────────────────┐
│ illustration/cover    │
│                       │
│ Quiz Title            │
│ Category · 15 Q       │
│ ★ 4.8    👥 128 plays │
└───────────────────────┘
```

### Hover state

- `translateY(-3px)`
- stronger shadow
- reveal `Play` circular action button

### Recommendation

Use a **4-card row** on desktop.

Card width: roughly `210–240px`.

Avoid placing too much text inside each card.

---

## E. Recent Activity / Recent Quizzes

Reference analogue: “Last Download”.

Use this for:

- Recent games
- Recently generated quiz
- Active quiz generation job
- Continue/replay actions

Example:

```text
Java Collections Challenge
Generated 2 min ago       18 questions
──────────────────────────────
[ Play Again ]       [ ••• ]
```

For quiz generation jobs, show a progress/state row:

- Uploading
- Processing
- Generating questions
- Ready
- Failed

Never expose implementation terms like BullMQ, workers, or job IDs to normal users.

---

# 9. Right Context Panel

The supplied design uses the right rail effectively for secondary but useful content.

Cortex should use this space contextually.

## Home state

Top module: **Live Now**

```text
Live Now
────────────
CS Trivia Night       8/12 players   [Join]
Movie Madness         5/10 players   [Join]
World Cup Quiz        7/8 players    [Join]
```

Bottom module: **Featured Quiz**

- Cover image
- Quiz name
- Category pill
- 1–2 sentence description
- Question count
- Estimated time
- Plays
- `Play Quiz` CTA

This is the closest Cortex equivalent to the reference's game detail card.

---

# 10. Join Game Flow

Joining should take **one meaningful action** from the home screen.

## Join modal

```text
Join a Game

Room Code
[ _ _ _ _ _ _ ]

Display Name
[ Abiral ]

[ Join Game ]
```

### UX rules

- Auto-uppercase room code
- Paste support
- Auto-advance if using segmented inputs
- Display clear errors inline
- Keep modal under 480px wide
- Autofocus room code
- Support Enter key

If a room is full or in progress, explain it clearly and offer the next action.

---

# 11. Host / Create Flow

Separate **quiz creation** from **game hosting** conceptually.

## Create Quiz

Options:

### Start from file

`Upload PDF or TXT`

### Start from topic

`Generate from a topic`

### Start manually

`Create questions yourself`

Use 3 large choice cards, not a dense form.

---

## AI generation state

Make AI feel reliable, not magical.

Show progress as discrete steps:

```text
✓ File uploaded
✓ Content processed
● Generating questions
○ Final review
```

Status copy:

`Creating question 12 of ~20…`

Allow the user to leave the page and return later.

### Failure state

Avoid:
`Generation failed.`

Prefer:

`We couldn't finish this quiz.`
`Your file is safe. Try generating again.`

Actions:

- Retry
- Change settings
- Return to library

---

# 12. Quiz Detail Page

The quiz detail page should feel like a game product page.

## Layout

Left/main:

- Large cover/illustration
- Title
- Description
- Tags
- Questions preview

Right/sticky action card:

```text
18 Questions
~8 min
Medium
1,245 plays

[ Host Live Game ]
[ Practice Solo ]
```

If the quiz belongs to the user:

Secondary actions:

- Edit
- Duplicate
- Delete

---

# 13. Live Lobby

The lobby should build anticipation.

## Host view

```text
Cortex
Room code: 482913        [Copy]

Waiting for players...

┌────────┐ ┌────────┐ ┌────────┐
│ avatar │ │ avatar │ │ avatar │
│ Abiral │ │ Maya   │ │ Chris  │
└────────┘ └────────┘ └────────┘

8 players joined

[ Start Game ]
```

### Design behavior

- Room code should be huge and readable from across a room.
- Player arrivals should animate subtly.
- New players appear with a scale/fade animation.
- Host controls remain visually separate from player cards.

## Player view

Simpler:

- Room name
- Host
- Player list
- “Waiting for host…”

Avoid exposing host-only controls.

---

# 14. Live Question Screen

This is the most important screen in the product.

## Hierarchy

1. Timer
2. Question
3. Answers
4. Score/rank context

Do **not** let navigation, sidebars, or dashboards compete with the question.

Use a distraction-free game canvas.

```text
Round 4 / 10                         12s

      Which data structure uses FIFO?

┌────────────────────┐ ┌────────────────────┐
│ A. Stack           │ │ B. Queue           │
└────────────────────┘ └────────────────────┘

┌────────────────────┐ ┌────────────────────┐
│ C. Heap            │ │ D. Tree            │
└────────────────────┘ └────────────────────┘

Score 3,420                        Rank #2
```

### Answer cards

- Minimum height: 88–104px desktop
- Minimum touch target: 56px mobile
- Strong selected state
- Prevent double-selection visually after submission

### Timer

Use both:

- Numeric seconds
- Horizontal or circular progress indicator

Never rely on color alone.

### After answering

Immediately change answer area into a locked state:

`Answer submitted`

Do not leave users wondering whether the click registered.

---

# 15. Correct / Incorrect Feedback

Feedback should be fast and emotionally clear.

## Correct

- Check icon
- “Correct!”
- Points earned
- Streak if relevant

Example:

```text
✓ Correct!
+842 pts
3 answer streak 🔥
```

## Incorrect

```text
✕ Not quite
Correct answer: Queue
```

Do not shame the player with copy such as “Wrong!” or dramatic red takeover screens.

### Motion

Feedback enters with 180–240ms scale/fade.

Respect `prefers-reduced-motion`.

---

# 16. Leaderboard

The leaderboard should feel exciting but remain readable.

## During game

Show top 5 only.

```text
1  Maya       6,240
2  Abiral     5,980   ← You
3  Chris      5,410
4  Jamie      4,920
5  Sam        4,600
```

Always keep the player's own position visible, even when outside the top 5.

Example:

```text
...
12  You       2,180
```

### Visual treatment

- #1: subtle gold accent
- #2/#3: neutral medal icons
- Current user: primary-colored row

Avoid excessive gradients/confetti during every round.

---

# 17. Results Screen

Make results shareable and replayable.

## Hero result

```text
2nd Place
8,940 points

82% accuracy
7 / 10 correct
Best streak: 4
```

Actions:

- Play Again
- Review Answers
- Back to Home

Secondary:

- Share Result

### Host result view

Add useful aggregate stats:

- Hardest question
- Average accuracy
- Fastest answer
- Player rankings

This should feel like a lightweight game recap, not an analytics dashboard.

---

# 18. Public Game Discovery

Use a card-based feed rather than a raw room list.

## Public room card

```text
Computer Science Trivia
Hosted by Maya

8 / 12 players
Starts when host is ready

[ Join ]
```

Metadata:

- Category
- Player count
- Quiz length
- Difficulty if available

### State updates

If a room disappears or becomes full, update the card in place rather than showing a hard error after click whenever possible.

---

# 19. Empty States

Every empty state should explain what the user can do next.

## No quizzes

**Headline**
`Your quiz library is empty.`

**Body**
`Create one manually or generate one from a file.`

**CTA**
`Create Your First Quiz`

## No live rooms

`No public games are live right now.`

CTA:
`Host a Game`

Avoid empty tables.

---

# 20. Loading States

Use skeletons that mirror the final layout.

Do not use a centered spinner for entire dashboard pages unless the wait is extremely short.

Recommended:

- Hero skeleton
- Category pill skeletons
- 4 quiz card skeletons
- Right-panel skeleton

For live gameplay, use explicit status text:

`Connecting to game…`

`Reconnecting…`

`You're back in the game.`

---

# 21. Real-Time Connection States

Because Cortex is multiplayer, connection UX is part of the product design.

### Temporary disconnect

Show a small non-blocking top banner:

`Connection lost. Reconnecting…`

### Reconnected

`Reconnected.`

Auto-dismiss after ~2 seconds.

### Cannot reconnect

Use a blocking state only when needed:

`We couldn't reconnect you to this game.`

Actions:

- Try Again
- Return Home

Never silently remove the player from the interface.

---

# 22. Buttons

## Primary

Use for exactly one main action per area.

```text
background: primary-600
text: white
height: 48px
radius: 12px
padding: 0 20px
```

## Secondary

White surface + border.

## Tertiary

Text button with no container.

## Icon button

40–44px square.

### Button labels

Prefer:

- Join Game
- Host Game
- Start Quiz
- Create Quiz
- Play Again

Avoid:

- Submit
- Continue
- Proceed

when a more specific action is available.

---

# 23. Forms

Inputs should feel soft and spacious.

```text
height: 48–52px
background: #F8F9FC
border: 1px solid #E6E9F0
radius: 12px
```

Focused:

- Primary border
- 3px soft focus ring

Error:

- Red border
- Error icon
- Specific message below input

Example:

`That room code doesn't exist.`

rather than:

`Invalid input.`

---

# 24. Icons

Use one consistent icon family:

- Lucide
- Phosphor

Recommended: **Lucide** for a clean game dashboard.

Icon rules:

- Default: 20px
- Sidebar: 22–24px
- Inline metadata: 16px
- Do not mix outline and filled sets randomly

---

# 25. Illustration Direction

The reference image gains personality through game artwork. Cortex needs the same visual energy without depending on licensed characters.

Recommended original illustration system:

- Quiz cards floating in perspective
- Trophy / podium
- Lightning bolt
- Timer
- Confetti
- Stylized avatars
- Question mark characters
- Brain / knowledge motifs
- Abstract blobs and rings

Use the same illustration language across:

- Hero
- Empty states
- Result celebrations
- Onboarding

Do not use different illustration styles on every screen.

---

# 26. Motion

Animation should communicate state, not decorate every interaction.

### Suggested durations

| Interaction        |  Duration |
| ------------------ | --------: |
| Hover              | 120–160ms |
| Modal              | 180–220ms |
| Answer selected    |     120ms |
| Player joins lobby | 220–300ms |
| Score update       | 300–450ms |
| Page transition    | 180–240ms |

### Good motion

- Card lift on hover
- Answer press feedback
- Score count-up
- New player arrival
- Leaderboard position shift
- Lightweight confetti after final result

### Avoid

- Constant floating animations
- Large page transitions during gameplay
- Excessive confetti after every question

---

# 27. Responsive Strategy

## Desktop ≥ 1280px

- Sidebar
- Main content
- Right context panel

## Tablet 768–1279px

- Sidebar collapses to icons
- Right context panel becomes inline section or drawer
- 2–3 quiz cards per row

## Mobile < 768px

- No desktop sidebar
- Bottom navigation
- Single-column dashboard
- Hero becomes stacked
- Categories horizontally scroll
- Cards become horizontal or full-width
- Right rail content moves under main content

### Gameplay mobile

Answers become vertically stacked.

Do not preserve the 2×2 answer grid if buttons become too narrow.

---

# 28. Accessibility Requirements

Minimum target: **WCAG 2.2 AA**.

- 4.5:1 text contrast where required
- 44×44px minimum interactive target
- Full keyboard navigation
- Visible focus styles
- Semantic button elements
- Labels for icon-only controls
- Do not communicate correctness by color alone
- `aria-live` for game state updates where appropriate
- Reduced motion support
- Timer should not be color-only
- Ensure screen-reader users hear when an answer is locked

For timed gameplay, consider accessibility options for extended timers when the product scope allows it.

---

# 29. Recommended Component Inventory

```text
AppShell
Sidebar
MobileBottomNav
TopBar
SearchInput
UserMenu
HeroBanner
CategoryPill
QuizCard
QuizCarousel
LiveRoomCard
FeaturedQuizCard
RecentQuizRow
GenerationStatus
GameCodeInput
PlayerAvatar
PlayerGrid
QuestionHeader
Timer
AnswerCard
AnswerFeedback
ScoreBadge
Leaderboard
LeaderboardRow
ResultSummary
StatCard
Button
IconButton
Badge
Modal
Drawer
Toast
ConnectionBanner
EmptyState
Skeleton
```

Build these as reusable primitives rather than styling each screen independently.

---

# 30. Homepage Wireframe

```text
┌──────┬───────────────────────────────────────────┬────────────────────┐
│      │ Search quizzes...             Avatar     │ LIVE NOW           │
│ LOGO │                                           │                    │
│      │ ┌───────────────────────────────────────┐ │ CS Trivia      Join│
│  H   │ │ READY TO PLAY?                        │ │ Movie Quiz     Join│
│  D   │ │ Challenge your friends.               │ │ Sports Quiz    Join│
│  Q   │ │ Own the leaderboard.      artwork     │ │                    │
│  +   │ │                                       │ ├────────────────────┤
│  G   │ │ [ Join Game ] [ Host Game ]           │ │ FEATURED QUIZ      │
│      │ └───────────────────────────────────────┘ │                    │
│      │                                           │ [ cover image ]    │
│      │ Categories                         See all │                    │
│      │ [CS] [Science] [Movies] [Sports] [...]   │ Web Dev Trivia     │
│      │                                           │ 20 Q · ~8 min      │
│      │ Popular Quizzes                  See all  │                    │
│      │ ┌────┐ ┌────┐ ┌────┐ ┌────┐             │ [ Play Quiz ]      │
│      │ │    │ │    │ │    │ │    │             │                    │
│      │ └────┘ └────┘ └────┘ └────┘             │                    │
│      │                                           │                    │
│      │ Recent                                    │                    │
│      │ ┌───────────────────────────────────────┐ │                    │
│      │ │ Java Collections Challenge      Play │ │                    │
│      │ └───────────────────────────────────────┘ │                    │
└──────┴───────────────────────────────────────────┴────────────────────┘
```

---

# 31. Gameplay Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Cortex     Round 4 / 10                         12 sec     │
│                                                              │
│            Which data structure uses FIFO?                   │
│                                                              │
│       ┌────────────────┐   ┌────────────────┐               │
│       │ A  Stack       │   │ B  Queue       │               │
│       └────────────────┘   └────────────────┘               │
│                                                              │
│       ┌────────────────┐   ┌────────────────┐               │
│       │ C  Heap        │   │ D  Tree        │               │
│       └────────────────┘   └────────────────┘               │
│                                                              │
│   Score 3,420                                  Rank #2       │
└──────────────────────────────────────────────────────────────┘
```

Remove dashboard chrome during active questions.

---

# 32. Design Decisions to Avoid

Do **not**:

- Turn every section into a bordered card
- Use gradients on every button
- Use neon colors everywhere
- Put sidebar navigation on the live gameplay screen
- Use tiny answer buttons
- Add large amounts of explanatory copy
- Use different radius values arbitrarily
- Use multiple shadow strengths randomly
- Make AI generation the center of the brand
- Expose backend/system terminology in user-facing status states
- Depend on color alone for correct/incorrect states
- Copy licensed game characters from the reference

---

# 33. Implementation Order

Redesign in this order so the product remains usable throughout the process.

### Phase 1 — Design foundation

- Colors
- Typography
- Spacing
- Radius
- Buttons
- Inputs
- Cards
- App shell

### Phase 2 — Home

- Sidebar
- Top bar
- Hero
- Categories
- Quiz cards
- Live room panel
- Recent quizzes

### Phase 3 — Multiplayer flow

- Join modal
- Lobby
- Question screen
- Answer feedback
- Leaderboard
- Results

### Phase 4 — Quiz management

- Quiz library
- Quiz detail
- Create/generate flow
- Generation status

### Phase 5 — Polish

- Loading states
- Empty states
- Motion
- Reconnection UX
- Responsive layouts
- Accessibility audit

---

# 34. Suggested Tailwind Design Tokens

```ts
// Conceptual Tailwind theme values
colors: {
  app: '#F4F6FB',
  surface: '#FFFFFF',
  subtle: '#F8F9FC',
  border: '#E6E9F0',
  ink: '#111936',
  muted: '#697188',
  primary: {
    100: '#EEF2FB',
    500: '#506DB2',
    600: '#405A9B',
  },
  success: '#32B57A',
  danger: '#EF5A67',
  warning: '#F5A623',
  pink: '#F06C9B',
  cyan: '#55B8C6',
  purple: '#9B79D1',
}

borderRadius: {
  control: '12px',
  card: '16px',
  panel: '20px',
  hero: '24px',
}
```

---

# 35. Product Design North Star

When deciding whether a UI element belongs in Cortex, ask:

> **Does this make starting, playing, or understanding the game easier?**

If not, remove it.

The dashboard can feel rich and playful, but the live game must feel almost effortless. The visual polish should come from **hierarchy, spacing, artwork, and interaction quality**, not from adding more UI.
