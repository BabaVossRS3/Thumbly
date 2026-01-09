import express from "express";
import { selectPlan, getUserPlanInfo } from "../controllers/UserPlanController.js";
import protect from "../middlewares/Auth.js";

const UserPlanRouter = express.Router();

// All routes require user authentication
UserPlanRouter.use(protect);

// Select a plan
UserPlanRouter.post("/select", selectPlan);

// Get user plan info
UserPlanRouter.get("/info", getUserPlanInfo);

export default UserPlanRouter;
