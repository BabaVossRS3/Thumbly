import { Request, Response } from "express";
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const validRoles = ["admin", "super_admin"];

interface AdminRequest extends Request {
  admin?: { id: string; email: string; role: string };
}

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

// Admin login
export const adminLogin = async (req: AdminRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password (avoid timing attack vulnerability)
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // simulate constant time comparison
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error("Error during admin login:", error.message);
    res.status(500).json({ message: "An error occurred during admin login" });
  }
};

// Admin logout
export const adminLogout = async (req: AdminRequest, res: Response) => {
  try {
    // JWT is stateless, so logout is just a client-side action
    // We can optionally add token to a blacklist in production
    return res.status(200).json({ message: "Admin logout successful" });
  } catch (error: any) {
    console.error("Error during admin logout:", error.message);
    res.status(500).json({ message: "An error occurred during admin logout" });
  }
};

// Verify admin token
export const verifyAdmin = async (req: AdminRequest, res: Response) => {
  try {
    const admin = await Admin.findById(req.admin?.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      message: "Admin verified",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error("Error verifying admin:", error.message);
    res.status(500).json({ message: "An error occurred while verifying admin" });
  }
};

// Create admin (super admin only)
export const createAdmin = async (req: AdminRequest, res: Response) => {
  try {
    // Check if requester is super admin
    if (req.admin?.role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Only super admins can create new admins" });
    }

    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, and name are required" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate role
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create new admin
    const newAdmin = await Admin.create({
      email,
      password: hashedPassword,
      name,
      role: role || "admin",
    });

    return res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error: any) {
    console.error("Error creating admin:", error.message);
    res.status(500).json({ message: "An error occurred while creating admin" });
  }
};

// Get all admins (super admin only)
export const getAllAdmins = async (req: AdminRequest, res: Response) => {
  try {
    // Check if requester is super admin
    if (req.admin?.role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Only super admins can view all admins" });
    }

    const admins = await Admin.find().select("-password");

    return res.status(200).json({
      message: "Admins retrieved successfully",
      admins,
    });
  } catch (error: any) {
    console.error("Error fetching admins:", error.message);
    res.status(500).json({ message: "An error occurred while fetching admins" });
  }
};
