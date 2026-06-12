import { Router } from "express";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
} from "../controllers/LeaveController.js";

const leavesRouter = Router();

leavesRouter.post("/", protect, createLeave);
leavesRouter.get("/", protect, getLeaves);
leavesRouter.patch("/:id", protect, protectAdmin, updateLeaveStatus);

export default leavesRouter;
