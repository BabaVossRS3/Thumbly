import express from "express";
import {
  createCheckoutSession,
  getUserSubscription,
  cancelSubscription,
  updateSubscription,
  handleStripeWebhook,
  syncSubscriptionFromSession,
  getAllSubscriptions,
  grantSubscription,
  terminateSubscription,
} from "../controllers/SubscriptionController.js";
import protect from "../middlewares/Auth.js";
import { protectAdmin, requireSuperAdmin } from "../middlewares/AdminAuth.js";

const SubscriptionRouter = express.Router();

// Webhook endpoint (no auth required)
SubscriptionRouter.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

// Protected routes (require user authentication)
SubscriptionRouter.post("/checkout", protect, createCheckoutSession);
SubscriptionRouter.post("/sync", protect, syncSubscriptionFromSession);
SubscriptionRouter.get("/", protect, getUserSubscription);
SubscriptionRouter.post("/cancel", protect, cancelSubscription);
SubscriptionRouter.post("/update", protect, updateSubscription);

// Admin routes (require admin authentication and super_admin role)
SubscriptionRouter.get("/admin/all", protectAdmin, requireSuperAdmin, getAllSubscriptions);
SubscriptionRouter.post("/admin/grant", protectAdmin, requireSuperAdmin, grantSubscription);
SubscriptionRouter.post("/admin/terminate", protectAdmin, requireSuperAdmin, terminateSubscription);

export default SubscriptionRouter;
