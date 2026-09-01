# Cortex copy style — redesign target

Cortex sounds energetic, direct, and social. It frames studying as a live game without sounding childish, aggressive, corporate, or technically self-impressed.

## Voice

- Lead with the useful action or game state: “Join a live room” and “Waiting for the host.”
- Prefer short, concrete sentences and familiar words.
- Use light competitive energy: “Ready to play?”, “Own the leaderboard,” “You won,” and “Not quite.”
- Address the player directly only when it removes ambiguity.
- Explain constraints next to the action: “PDF or TXT, up to 10 MB.”
- Keep AI dependable and practical. Say “Generating questions...” rather than describing magic.

## Capitalization and labels

Use sentence case for headings, navigation, buttons, labels, and statuses. Reserve uppercase for a short eyebrow such as “READY TO PLAY?” and uppercase alphanumeric room codes such as `ABC123`. Format dynamic values as `N questions`, `N players`, `N pts`, `Round N of N`, and `Rank #N` with tabular numerals where they change.

## Actions and progress

Use a specific verb and result: “Join game,” “Host game,” “Create quiz,” “Launch lobby,” “Play again,” “Try again,” and “Return home.” Avoid “Submit,” “Proceed,” or “Continue” when the actual outcome is known.

Progress labels name the active work and use three periods consistently: “Creating...”, “Generating questions...”, “Joining...”, “Starting game...”, and “Reconnecting...”. Do not promise question-level progress unless the API supplies it.

## Errors and feedback

Say what happened and what the player can do next:

- “That room code doesn't exist.”
- “This room is already in progress.”
- “We couldn't finish this quiz. Try generating it again.”
- “Connection lost. Reconnecting...”

Correct feedback is “Correct!” plus available points or streak data. Incorrect feedback is “Not quite,” never a shaming “Wrong!” Avoid generic “Error” headings and internal implementation terms.

## Unsupported claims

Do not mention solo practice, manual/topic creation, quiz editing, result review or sharing, accuracy, streaks, popularity, difficulty, categories, or host analytics unless the current flow supplies the required behavior and data.
