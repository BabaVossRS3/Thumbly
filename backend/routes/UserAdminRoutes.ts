import express from "express";
import {
  getAllUsers,
  getUserById,
  getUserStats,
  deleteUser,
  updateUser,
} from "../controllers/UserAdminController.js";
import { protectAdmin } from "../middlewares/AdminAuth.js";

const UserAdminRouter = express.Router();

// All routes require admin authentication
UserAdminRouter.use(protectAdmin);

// Get all users with search and pagination
UserAdminRouter.get("/", getAllUsers);

// Get user statistics
UserAdminRouter.get("/stats", getUserStats);

// Get single user by ID
UserAdminRouter.get("/:userId", getUserById);

// Update user
UserAdminRouter.put("/:userId", updateUser);

// Delete user
UserAdminRouter.delete("/:userId", deleteUser);

export default UserAdminRouter;
