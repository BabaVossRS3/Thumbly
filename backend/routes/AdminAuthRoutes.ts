import express from "express";
import {
  adminLogin,
  adminLogout,
  verifyAdmin,
  createAdmin,
  getAllAdmins,
} from "../controllers/AdminAuthControllers.js";
import { protectAdmin, requireSuperAdmin } from "../middlewares/AdminAuth.js";

const AdminAuthRouter = express.Router();

// Public routes
AdminAuthRouter.post("/login", adminLogin);

// Protected routes
AdminAuthRouter.post("/logout", protectAdmin, adminLogout);
AdminAuthRouter.get("/verify", protectAdmin, verifyAdmin);

// Super admin only routes
AdminAuthRouter.post("/create", protectAdmin, requireSuperAdmin, createAdmin);
AdminAuthRouter.get("/all", protectAdmin, requireSuperAdmin, getAllAdmins);

export default AdminAuthRouter;
