import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { createServer } from "http";
import { requireAuth } from "./middleware/requireAuth.middleware.js";
import userRouter from "./routes/user.routes.js";
import { handleClerkWebhook } from "./webhooks/clerk.js";
import cors from "cors";
import { attachSocket } from "./socket/index.js";
import { startRoundEndWorker } from "./workers/roundEnd.worker.js";
import { startQuizGenerateWorker } from "./workers/quizGenerate.worker.js";
import gameRouter from "./routes/game.routes.js";
import {
  quizGenerateRouter,
  quizzesRouter,
} from "./routes/quiz.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN;

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);

// Webhook MUST use the raw body for Svix signature verification.
// Mount before express.json(), and do NOT put requireAuth on it.
app.post(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  handleClerkWebhook,
);

app.use(express.json());
app.use(clerkMiddleware());

// Protected routes
app.use("/api/users", requireAuth, userRouter);

const io = attachSocket(httpServer);

// Start the round end worker
startRoundEndWorker(io);
// Start the quiz-generate worker (async generation path)
startQuizGenerateWorker();

app.use("/api/games", gameRouter);
app.use("/api/quiz", quizGenerateRouter);
app.use("/api/quizzes", quizzesRouter);

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});
