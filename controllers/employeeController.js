import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";

// GET EMPLOYEES
// GET /api/employees
export const getEmployees = async (req, res) => {
  try {
    // GET department FROM QUERY
    const { department } = req.query;

    // EMPTY FILTER OBJECT
    const where = {};

    // IF DEPARTMENT EXISTS
    if (department) {
      where.department = department;
    }

    // FETCH EMPLOYEES FROM DATABASE
    const employees = await Employee.find(where)
      .sort({ createdAt: -1 })
      .populate("userId", "email role")
      .lean();

    // MODIFY RESPONSE DATA
    const result = employees.map((emp) => ({
      ...emp,

      id: emp._id.toString(),

      user: emp.userId
        ? {
            email: emp.userId.email,
            role: emp.userId.role,
          }
        : null,
    }));

    // SEND RESPONSE
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch employees",
    });
  }
};

// CREATE EMPLOYEE
// POST /api/employees
export const createEmployees = async (req, res) => {
  try {
    // GET DATA FROM BODY
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      basicSalary,
      allowances,
      deduction,
      joinDate,
      password,
      role,
      bio,
    } = req.body;

    // VALIDATION
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: "Missing Required Fields",
      });
    }

    // HASH PASSWORD
    const hashed = await bcrypt.hash(password, 10);

    // CREATE USER
    const user = await User.create({
      email,
      password: hashed,
      role: role || "EMPLOYEE",
    });

    // CREATE EMPLOYEE
    const employee = await Employee.create({
      userId: user._id,
      firstName,
      lastName,
      email,
      phone,
      position,
      department: department || "Engineering",
      basicSalary: Number(basicSalary) || 0,
      allowances: Number(allowances) || 0,
      deduction: Number(deduction) || 0,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      bio: bio || "",
    });

    // SEND RESPONSE
    return res.status(201).json({
      success: true,
      employee,
    });
  } catch (error) {
    // DUPLICATE EMAIL ERROR
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Email Already Exists",
      });
    }

    return res.status(500).json({
      error: "Failed to create employee",
    });
  }
};

// UPDATE EMPLOYEE
// PUT /api/employees/:id
export const updateEmployees = async (req, res) => {
  try {
    // GET ID FROM URL
    const { id } = req.params;

    // GET DATA FROM BODY
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      basicSalary,
      allowances,
      deduction,
      role,
      bio,
      employmentStatus,
      password,
    } = req.body;

    // FIND EMPLOYEE
    const employee = await Employee.findById(id);

    // CHECK EMPLOYEE EXISTS
    if (!employee) {
      return res.status(404).json({
        error: "Employee Not Found",
      });
    }

    // UPDATE EMPLOYEE COLLECTION
    await Employee.findByIdAndUpdate(id, {
      firstName,
      lastName,
      email,
      phone,
      position,
      department: department || "Engineering",
      basicSalary: Number(basicSalary) || 0,
      allowances: Number(allowances) || 0,
      deduction: Number(deduction) || 0,
      employmentStatus: employmentStatus || "ACTIVE",
      bio: bio || "",
    });

    // USER UPDATE OBJECT
    const userUpdate = {
      email,
    };

    // UPDATE ROLE
    if (role) {
      userUpdate.role = role;
    }

    // UPDATE PASSWORD
    if (password) {
      userUpdate.password = await bcrypt.hash(password, 10);
    }

    // UPDATE USER COLLECTION
    await User.findByIdAndUpdate(employee.userId, userUpdate);

    // SUCCESS RESPONSE
    return res.json({
      success: true,
    });
  } catch (error) {
    // DUPLICATE EMAIL ERROR
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Email Already Exists",
      });
    }
    return res.status(500).json({
      error: "Failed to update employee",
    });
  }
};

// DELETE EMPLOYEE
// DELETE /api/employees/:id
export const deleteEmployees = async (req, res) => {
  try {
    // GET ID FROM URL
    const { id } = req.params;

    // FIND EMPLOYEE
    const employee = await Employee.findById(id);

    // CHECK EMPLOYEE EXISTS
    if (!employee) {
      return res.status(404).json({
        error: "Employee Not Found",
      });
    }

    // SOFT DELETE
    employee.isDeleted = true;

    // SET STATUS INACTIVE
    employee.employmentStatus = "INACTIVE";

    // SAVE CHANGES
    await employee.save();

    // SUCCESS RESPONSE
    return res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to delete employee",
    });
  }
};
