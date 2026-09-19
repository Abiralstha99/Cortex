import { Queue } from "bullmq";
import redis from "./redis.js";

// Defines the data for the job that will be enqueued.
export interface RoundEndJobData {
  gameId: string;
  roundNumber: number;
}

// Queue and job names.
export const ROUND_END_QUEUE = "round-end";
export const ROUND_END_JOB = "end-round";

export const roundEndQueue = new Queue<RoundEndJobData>(ROUND_END_QUEUE, {
  connection: redis,
});

// Quiz generation always runs in the adaptive background worker.
// jobId indexes Redis quiz-gen:job / quiz-gen:work — not a Postgres quiz id.
export interface QuizGenerateJobData {
  jobId: string;
}

export const QUIZ_GENERATE_QUEUE = "quiz-generate";
export const QUIZ_GENERATE_JOB = "generate-quiz";

export const quizGenerateQueue = new Queue<QuizGenerateJobData>(
  QUIZ_GENERATE_QUEUE,
  { connection: redis },
);

export type WaitingRoomQuizJobData =
  | {
      type: "attach";
      gameId: string;
      quizId: string;
      questionCount: number;
    }
  | {
      type: "fail";
      gameId: string;
      message: string;
    };

export const WAITING_ROOM_QUIZ_QUEUE = "waiting-room-quiz";
export const ATTACH_QUIZ_TO_WAITING_GAME_JOB = "attach-quiz-to-waiting-game";
export const FAIL_WAITING_QUIZ_GENERATION_JOB = "fail-waiting-quiz-generation";

export const waitingRoomQuizQueue = new Queue<WaitingRoomQuizJobData>(
  WAITING_ROOM_QUIZ_QUEUE,
  { connection: redis },
);
