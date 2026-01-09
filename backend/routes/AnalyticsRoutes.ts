import express from "express";
import { getAnalytics } from "../controllers/AnalyticsController.js";
import { protectAdmin } from "../middlewares/AdminAuth.js";

const router = express.Router();

router.get("/analytics", protectAdmin, getAnalytics);

export default router;
