import "dotenv/config";
import connectDB from "../configs/db.js";
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;

    if (!adminEmail || !adminPassword || !adminName) {
      console.error(
        "❌ Missing admin credentials in environment variables"
      );
      console.error(
        "Please set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME in .env file"
      );
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const newAdmin = await Admin.create({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: "super_admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Name: ${newAdmin.name}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log("\n🔐 Admin credentials were set from environment variables.");
    console.log("   Please use the email and password from your .env file to login.");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error seeding admin user:", error.message);
    process.exit(1);
  }
};

seedAdmin();
