import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password, roleType } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid Credentials",
      });
    }

    if (roleType === "admin" && user.role !== "ADMIN") {
      return res.status(401).json({
        error: "Not Authorized as Admin",
      });
    }

    if (roleType === "employee" && user.role !== "EMPLOYEE") {
      return res.status(401).json({
        error: "Not Authorized as Employee",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid Credentials",
      });
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      success: true,
      user: payload,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Login Failed",
    });
  }
};

// GET CURRENT USER (SESSION REPLACED WITH JWT)
export const session = (req, res) => {
  return res.json({
    user: req.user,
  });
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Both passwords are required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(req.user.userId, {
      password: hashed,
    });

    return res.json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to change password",
    });
  }
};
