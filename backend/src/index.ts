import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { createServer } from "http";
import { requireAuth } from "./middleware/requireAuth.js";
import userRouter from "./routes/user.routes.js";
import { handleClerkWebhook } from "./webhooks/clerk.js";
import cors from "cors";
dotenv.config();

const app = express();
const httpServer = createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

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

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});
