import express from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";

import connectDB from "./config/db.js";

import authRouter from "./routes/authRoutes.js";
import employeeRouter from "./routes/employeeRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import attendanceRouter from "./routes/attendanceRoute.js";
import leavesRouter from "./routes/leaveRoutes.js";
import payslipRouter from "./routes/payslipsRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";

import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

const app = express();

// ======================
// DATABASE CONNECTION
// ======================
await connectDB();

// ======================
// MIDDLEWARE
// ======================
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(multer().none());

// ======================
// HEALTH CHECK
// ======================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// ======================
// API ROUTES
// ======================
app.use("/api/auth", authRouter);

app.use("/api/employees", employeeRouter);

app.use("/api/profile", profileRouter);

app.use("/api/attendance", attendanceRouter);

app.use("/api/leave", leavesRouter);

app.use("/api/payslips", payslipRouter);

app.use("/api/dashboard", dashboardRouter);

// ======================
// INNGEST
// ======================
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  }),
);

// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ======================
// ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

// ======================
// LOCAL DEVELOPMENT
// ======================
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// ======================
// EXPORT FOR VERCEL
// ======================
export default app;