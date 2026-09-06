Task 8 fixes applied:

- Use auth.getToken in QuizRows and LiveRoomRows query functions and enable queries only when Clerk is loaded and signed-in.
- CreateGame: support deep-linking via location.state?.quizId — switch to "past" tab on mount and select matching quiz when quizzes load.
- Expanded tests for QuizRows and LiveRoomRows to cover signed-out, signed-in empty, and signed-in with data.

Files changed:
- frontend/src/components/home/QuizRows.tsx
- frontend/src/components/home/LiveRoomRows.tsx
- frontend/src/pages/CreateGame.tsx
- frontend/src/components/home/QuizRows.test.tsx
- frontend/src/components/home/LiveRoomRows.test.tsx

Notes:
- Did not commit any .superpowers file.

