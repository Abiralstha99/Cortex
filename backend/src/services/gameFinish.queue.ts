export const GAME_FINISH_JOB = "finish-game";
export const GAME_FINISH_JOB_ID = (gameId: string) => `game_${gameId}_finish`;

export interface GameFinishJobData {
  gameId: string;
  finishedAt: string;
}

interface ExistingJob {
  getState(): Promise<string>;
  remove(): Promise<void>;
}

interface GameFinishQueue {
  getJob(jobId: string): Promise<ExistingJob | undefined>;
  add(
    name: string,
    data: GameFinishJobData,
    options: { jobId: string },
  ): Promise<unknown>;
}

export async function enqueueGameFinish(
  queue: GameFinishQueue,
  gameId: string,
  finishedAt: string,
): Promise<void> {
  const jobId = GAME_FINISH_JOB_ID(gameId);
  const existingJob = await queue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();
    if (state !== "failed") return;
    await existingJob.remove();
  }

  await queue.add(
    GAME_FINISH_JOB,
    { gameId, finishedAt },
    { jobId },
  );
}
