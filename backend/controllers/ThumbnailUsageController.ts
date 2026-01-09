import { Request, Response } from "express";
import Subscription from "../models/Subscription.js";
import {
  canCreateThumbnail,
  getRemainingThumbnails,
  incrementThumbnailUsage,
  syncUserLimitsWithSubscription,
} from "../utils/thumbnailUsage.js";

interface UserRequest extends Request {
  session: any;
}

// Helper function to extract userId consistently
const extractUserId = (req: UserRequest): string | null => {
  return req.session?.userId || null;
};

// Custom error class for limit exceeded errors
class ThumbnailLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ThumbnailLimitError";
  }
}

// Check if user can create a thumbnail
export const checkThumbnailLimit = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const canCreate = await canCreateThumbnail(userId);
    const remaining = await getRemainingThumbnails(userId);

    return res.status(200).json({
      message: "Thumbnail limit checked",
      canCreate,
      usage: remaining,
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "An error occurred while checking thumbnail limit" });
  }
};

// Get user's thumbnail usage
export const getThumbnailUsage = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const usage = await getRemainingThumbnails(userId);

    return res.status(200).json({
      message: "Thumbnail usage retrieved",
      usage,
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching thumbnail usage" });
  }
};

// Record thumbnail creation
export const recordThumbnailCreation = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Increment usage directly - this handles the TOCTOU race condition
    // by checking and updating atomically in the incrementThumbnailUsage function
    try {
      await incrementThumbnailUsage(userId);
    } catch (error: any) {
      // Check error type instead of relying on string matching
      if (error instanceof ThumbnailLimitError || error.name === "ThumbnailLimitError") {
        return res.status(403).json({
          message: "Thumbnail limit reached for this month",
        });
      }
      throw error;
    }

    const remaining = await getRemainingThumbnails(userId);

    return res.status(200).json({
      message: "Thumbnail creation recorded",
      usage: remaining,
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "An error occurred while recording thumbnail creation" });
  }
};

// Sync user limits with subscription (called after subscription update)
export const syncLimits = async (req: UserRequest, res: Response) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    await syncUserLimitsWithSubscription(userId);
    const usage = await getRemainingThumbnails(userId);

    return res.status(200).json({
      message: "Limits synced with subscription",
      usage,
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "An error occurred while syncing limits" });
  }
};

// Get subscription credits (new endpoint for credit tracking)
export const getSubscriptionCredits = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    // If no subscription exists, create a free plan subscription for the user
    if (!subscription) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      subscription = await Subscription.create({
        userId,
        planType: "free",
        stripeCustomerId: "free-plan",
        stripeSubscriptionId: `free-${userId}-${Date.now()}`,
        stripeProductId: "free-plan",
        stripePriceId: "free-plan",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: thirtyDaysFromNow,
        cancelAtPeriodEnd: false,
        credits: {
          used: 0,
          limit: 3,
        },
        thumbnailLimit: 3,
      });
    }

    const remaining = Math.max(
      0,
      subscription.credits.limit - subscription.credits.used
    );

    return res.status(200).json({
      message: "Subscription credits retrieved",
      usage: {
        used: subscription.credits.used,
        limit: subscription.credits.limit,
        remaining,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching subscription credits" });
  }
};
