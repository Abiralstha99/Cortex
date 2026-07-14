import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import { requireAuth } from "./middleware/requireAuth.js";
import userRouter from "./routes/userRouter.js";
import { handleClerkWebhook } from "./webhooks/clerk.js";

dotenv.config();

const app = express();

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

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
