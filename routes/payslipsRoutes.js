import { Router } from "express";

import {
  createPayslip,
  getPayslipById,
  getPayslips,
} from "../controllers/payslipController.js";

import { protect, protectAdmin } from "../middleware/authMiddleware.js";

const payslipRouter = Router();

// CREATE PAYSLIP (ADMIN ONLY)
payslipRouter.post("/", protect, protectAdmin, createPayslip);

// GET ALL PAYSLIPS
payslipRouter.get("/", protect, getPayslips);

// GET SINGLE PAYSLIP
payslipRouter.get("/:id", protect, getPayslipById);

export default payslipRouter;
