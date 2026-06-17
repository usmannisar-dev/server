import Payslip from "../models/Payslip.js";
import Employee from "../models/Employee.js";

// CREATE PAYSLIP
// POST /api/payslips
export const createPayslip = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions } =
      req.body;

    // VALIDATION
    if (!employeeId || !month || !year || !basicSalary) {
      return res.status(400).json({
        error: "Missing Fields",
      });
    }

    // CALCULATE NET SALARY
    const netSalary =
      Number(basicSalary) + Number(allowances || 0) - Number(deductions || 0);

    // CREATE PAYSLIP
    const payslip = await Payslip.create({
      employeeId,
      month: Number(month),
      year: Number(year),
      basicSalary: Number(basicSalary),
      allowances: Number(allowances || 0),
      deductions: Number(deductions || 0),
      netSalary,
    });

    return res.status(201).json({
      success: true,
      data: payslip,
    });
  } catch (error) {
    console.error("Create Payslip Error:", error);

    return res.status(500).json({
      error: "Failed to create payslip",
    });
  }
};

// GET PAYSLIPS
// GET /api/payslips
export const getPayslips = async (req, res) => {
  try {
    const user = req.user; // OR req.user

    const isAdmin = user.role === "ADMIN";

    // ADMIN
    if (isAdmin) {
      const payslips = await Payslip.find()
        .populate("employeeId")
        .sort({ createdAt: -1 });

      const data = payslips.map((p) => {
        const obj = p.toObject();

        return {
          ...obj,
          id: obj._id.toString(),
          employee: obj.employeeId,
          employeeId: obj.employeeId?._id?.toString(),
        };
      });

      return res.json({
        data,
      });
    }

    // EMPLOYEE
    const employee = await Employee.findOne({
      userId: user.userId,
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee Not Found",
      });
    }

    const payslips = await Payslip.find({
      employeeId: employee._id,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      data: payslips,
    });
  } catch (error) {
    console.error("Get Payslips Error:", error);

    return res.status(500).json({
      error: "Failed to fetch payslips",
    });
  }
};

// GET PAYSLIP BY ID
// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate("employeeId")
      .lean();

    if (!payslip) {
      return res.status(404).json({
        error: "Payslip Not Found",
      });
    }

    const result = {
      ...payslip,
      id: payslip._id.toString(),
      employee: payslip.employeeId,
    };

    return res.json(result);
  } catch (error) {
    console.error("Get Payslip By Id Error:", error);

    return res.status(500).json({
      error: "Failed to fetch payslip",
    });
  }
};
