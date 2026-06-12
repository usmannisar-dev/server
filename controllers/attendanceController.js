import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// CLOCK IN / CLOCK OUT
// POST /api/attendance
export const clockInOut = async (req, res) => {
  try {
    // GET USER FROM JWT
    const userData = req.user;

    // FIND EMPLOYEE
    const employee = await Employee.findOne({
      userId: userData.userId,
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee Not Found",
      });
    }

    // CHECK DELETED
    if (employee.isDeleted) {
      return res.status(403).json({
        error: "Your account is deactivated. You cannot clock in/out.",
      });
    }

    // TODAY DATE
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    // CHECK EXISTING ATTENDANCE
    const existing = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    const now = new Date();

    // ======================
    // CLOCK IN
    // ======================
    if (!existing) {
      const isLate =
        now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);

      const attendance = await Attendance.create({
        employeeId: employee._id,
        date: today,
        checkIn: now,
        status: isLate ? "LATE" : "PRESENT",
      });

      await inngest.send({
        name: "employee/check-out",
        data: {
          employeeId: employee._id,
          attendanceId: attendance._id,
        }
      })

      return res.json({
        success: true,
        type: "CHECK_IN",
        data: attendance,
      });
    }

    // ======================
    // CLOCK OUT
    // ======================
    else if (!existing.checkOut) {
      const checkInTime = new Date(existing.checkIn).getTime();

      const diffMs = now.getTime() - checkInTime;

      const diffHours = diffMs / (1000 * 60 * 60);

      existing.checkOut = now;

      // WORKING HOURS
      const workingHours = parseFloat(diffHours.toFixed(2));

      let dayType = "Half Day";

      if (workingHours >= 8) {
        dayType = "Full Day";
      } else if (workingHours >= 6) {
        dayType = "Three Quarter Day";
      } else if (workingHours >= 4) {
        dayType = "Short Day";
      }

      existing.workingHours = workingHours;

      existing.dayType = dayType;

      await existing.save();

      return res.json({
        success: true,
        type: "CHECK_OUT",
        data: existing,
      });
    }

    // ALREADY CLOCKED OUT
    else {
      return res.status(400).json({
        error: "Attendance already completed for today",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Operation Failed",
    });
  }
};

// GET ATTENDANCE HISTORY
// GET /api/attendance
export const getAttendance = async (req, res) => {
  try {
    const userData = req.user;

    const employee = await Employee.findOne({
      userId: userData.userId,
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee Not Found",
      });
    }

    const limit = parseInt(req.query.limit || 30);

    const history = await Attendance.find({
      employeeId: employee._id,
    })
      .sort({ date: -1 })
      .limit(limit);

    return res.json({
      data: history,
      employee: {
        isDeleted: employee.isDeleted,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch attendance",
    });
  }
};
