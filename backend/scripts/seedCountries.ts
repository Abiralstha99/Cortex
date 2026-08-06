/**
 * OBSOLETE (Phase 2): the `countries` table was removed in favor of
 * `quizzes` / `questions`. Use `npm run seed:quiz` instead.
 */
import "dotenv/config";

console.error(
  "seedCountries is obsolete after the quizzes/questions migration.\n" +
    "Run: npm run seed:quiz",
);
process.exit(1);
