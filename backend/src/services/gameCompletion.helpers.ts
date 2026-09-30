import type {
  LeaderboardEntry,
  GameFinishedPayload,
  Player,
  SubmissionRecord,
} from "../types/room.types.js";

export function rankPlayers(players: Player[]): LeaderboardEntry[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  let previousScore: number | undefined;
  let currentRank = 0;

  return sorted.map((player, index) => {
    if (player.score !== previousScore) {
      currentRank = index + 1;
      previousScore = player.score;
    }

    return {
      rank: currentRank,
      playerId: player.id,
      username: player.username,
      score: player.score,
    };
  });
}

export function buildGamePlayerRecords(
  gameId: string,
  leaderboard: LeaderboardEntry[],
) {
  return leaderboard.map(({ playerId, score, rank }) => ({
    gameId,
    userId: playerId,
    score,
    rank,
  }));
}

export function buildGameFinishedPayload(
  finalLeaderboard: LeaderboardEntry[],
): GameFinishedPayload {
  if (finalLeaderboard.length === 0) {
    throw new Error("No winner found");
  }

  return {
    finalLeaderboard,
    winners: finalLeaderboard.filter((player) => player.rank === 1),
  };
}

export function buildAnswerRecords(gameId: string, submissions: SubmissionRecord[]) {
  return submissions
    .filter((submission) => submission.questionId && submission.answerIndex >= 0)
    .map((submission) => ({
      gameId,
      userId: submission.playerId,
      questionId: submission.questionId,
      response: submission.answerIndex,
      correct: submission.correct,
      points: submission.pointsEarned,
      responseTimeMs: submission.responseTimeMs ?? 0,
      createdAt: new Date(submission.submittedAt),
    }));
}
