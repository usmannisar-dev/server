import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";
import { DEPARTMENTS } from "../constants/departments.js";

// GET DASHBOARD
// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const user = req.user;

    // ADMIN DASHBOARD
    if (user.role === "ADMIN") {
      const [totalEmployees, todayAttendance, pendingLeaves] =
        await Promise.all([
          Employee.countDocuments({
            isDeleted: { $ne: true },
          }),

          Attendance.countDocuments({
            date: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(24, 0, 0, 0)),
            },
          }),

          LeaveApplication.countDocuments({
            status: "PENDING",
          }),
        ]);

      return res.json({
        role: "ADMIN",
        totalEmployees,
        totalDepartments: DEPARTMENTS.length,
        todayAttendance,
        pendingLeaves,
      });
    }

    // EMPLOYEE DASHBOARD
    const employee = await Employee.findOne({
      userId: user.userId,
    }).lean();

    if (!employee) {
      return res.status(404).json({
        error: "Employee Not Found",
      });
    }

    const today = new Date();

    const [currentMonthAttendance, pendingLeaves, latestPayslip] =
      await Promise.all([
        Attendance.countDocuments({
          employeeId: employee._id,
          date: {
            $gte: new Date(today.getFullYear(), today.getMonth(), 1),
            $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
          },
        }),

        LeaveApplication.countDocuments({
          employeeId: employee._id,
          status: "PENDING",
        }),

        Payslip.findOne({
          employeeId: employee._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean(),
      ]);

    return res.json({
      role: "EMPLOYEE",

      employee: {
        ...employee,
        id: employee._id.toString(),
      },

      currentMonthAttendance,
      pendingLeaves,

      latestPayslip: latestPayslip
        ? {
            ...latestPayslip,
            id: latestPayslip._id.toString(),
          }
        : null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed",
    });
  }
};
