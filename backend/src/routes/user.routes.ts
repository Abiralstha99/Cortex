import { Router } from "express";
import { getUser, updateUser } from "../controller/user.controller.js";

const userRouter = Router();

userRouter.get("/:userId", getUser);
userRouter.put("/:userId", updateUser);

export default userRouter;
