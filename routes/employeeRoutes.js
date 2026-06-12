import { Router } from "express";
import {
  getEmployees,
  createEmployees,
  updateEmployees,
  deleteEmployees,
} from "../controllers/employeeController.js";
import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const employeeRouter = Router();

employeeRouter.get("/", protect, protectAdmin, getEmployees);
employeeRouter.post("/", protect, protectAdmin, createEmployees);
employeeRouter.put("/:id", protect, protectAdmin, updateEmployees);
employeeRouter.delete("/:id", protect, protectAdmin, deleteEmployees);

export default employeeRouter;
