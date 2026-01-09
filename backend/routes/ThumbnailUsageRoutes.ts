import express from "express";
import {
  checkThumbnailLimit,
  getThumbnailUsage,
  recordThumbnailCreation,
  syncLimits,
  getSubscriptionCredits,
} from "../controllers/ThumbnailUsageController.js";
import protect from "../middlewares/Auth.js";

const ThumbnailUsageRouter = express.Router();

// All routes require user authentication
ThumbnailUsageRouter.use(protect);

// Check if user can create a thumbnail
ThumbnailUsageRouter.get("/check", checkThumbnailLimit);

// Get user's thumbnail usage
ThumbnailUsageRouter.get("/", getThumbnailUsage);

// Get subscription credits (tracks actual credits used from generation)
ThumbnailUsageRouter.get("/credits", getSubscriptionCredits);

// Record a thumbnail creation
ThumbnailUsageRouter.post("/record", recordThumbnailCreation);

// Sync limits with subscription
ThumbnailUsageRouter.post("/sync", syncLimits);

export default ThumbnailUsageRouter;
