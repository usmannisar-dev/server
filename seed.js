import "dotenv/config";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";

const TEMPORARY_PASSWORD = "admin123";

async function registerAdmin() {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    // CHECK ENV VARIABLE
    if (!ADMIN_EMAIL) {
      console.error("Missing ADMIN_EMAIL environment variable");
      process.exit(1);
    }

    // CONNECT DATABASE
    await connectDB();

    // CHECK IF ADMIN ALREADY EXISTS
    const existingAdmin = await User.findOne({
      email: ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("Admin already exists with role:", existingAdmin.role);
      process.exit(0);
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(TEMPORARY_PASSWORD, 10);

    // CREATE ADMIN USER
    const admin = await User.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("\n✅ Admin User Created Successfully");
    console.log("Email:", admin.email);
    console.log("Temporary Password:", TEMPORARY_PASSWORD);
    console.log("\n⚠️ Please change the password after first login.");

    process.exit(0);
  } catch (error) {
    console.error("Admin Registration Failed:", error);
    process.exit(1);
  }
}

registerAdmin();
