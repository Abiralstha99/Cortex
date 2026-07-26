import { Router } from "express";
import { getUser, updateUser } from "../controllers/user.controller.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  UpdateUserBodySchema,
  UserIdParamsSchema,
} from "../schemas/user.js";

const userRouter = Router();

userRouter.get("/:userId", validateParams(UserIdParamsSchema), getUser);
userRouter.put(
  "/:userId",
  validateParams(UserIdParamsSchema),
  validateBody(UpdateUserBodySchema),
  updateUser,
);

export default userRouter;
