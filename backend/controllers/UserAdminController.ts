import { Request, Response } from "express";
import { Types } from "mongoose";
import User from "../models/User.js";

interface AdminRequest extends Request {
  admin?: { id: string; email: string; role: string };
}

// Helper function to validate ObjectId format
const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

// Helper function to escape regex special characters
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Get all users with pagination and search
export const getAllUsers = async (req: AdminRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    // Validate pagination parameters
    if (pageNum < 1) {
      return res.status(400).json({ message: "Page must be greater than 0" });
    }
    if (limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: "Limit must be between 1 and 100" });
    }

    const skip = (pageNum - 1) * limitNum;

    // Build search query with sanitized input
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search as string), $options: "i" } },
            { email: { $regex: escapeRegex(search as string), $options: "i" } },
          ],
        }
      : {};

    // Get total count
    const total = await User.countDocuments(searchQuery);

    // Get users
    const users = await User.find(searchQuery)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      message: "Users retrieved successfully",
      data: {
        users: users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "An error occurred while fetching users" });
  }
};

// Get single user by ID
export const getUserById = async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: "An error occurred while fetching user" });
  }
};

// Get user statistics
export const getUserStats = async (req: AdminRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersThisMonth = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    const usersThisWeek = await User.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(200).json({
      message: "User statistics retrieved successfully",
      stats: {
        totalUsers,
        usersThisMonth,
        usersThisWeek,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user statistics:", error.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching user statistics" });
  }
};

// Delete user
export const deleteUser = async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "An error occurred while deleting user" });
  }
};

// Update user
export const updateUser = async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;

    // Validate ObjectId format
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Validate input - at least one field must be provided
    if (name === undefined && email === undefined) {
      return res
        .status(400)
        .json({ message: "At least one field is required to update" });
    }

    // Build update object - only include fields that are explicitly provided
    const updateData: { name?: string; email?: string } = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }

    // Check if email is already in use
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "An error occurred while updating user" });
  }
};
