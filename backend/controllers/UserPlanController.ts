import { Request, Response } from "express";
import User from "../models/User.js";
import { syncUserLimitsWithSubscription, PLAN_LIMITS } from "../utils/thumbnailUsage.js";

interface UserRequest extends Request {
  session: any;
}

// Select a plan for user
export const selectPlan = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.session?.userId;
    const { planType } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!planType || !PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user with selected plan
    user.subscriptionPlan = planType;
    user.hasPlan = true;
    user.thumbnailUsage.limit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS];
    user.thumbnailUsage.created = 0;
    user.thumbnailUsage.resetDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    await user.save();

    return res.status(200).json({
      message: "Plan selected successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        hasPlan: user.hasPlan,
        thumbnailUsage: user.thumbnailUsage,
      },
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: "An error occurred while selecting plan" });
  }
};

// Get user plan info
export const getUserPlanInfo = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(userId).select(
      "subscriptionPlan hasPlan thumbnailUsage"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Plan info retrieved",
      plan: {
        subscriptionPlan: user.subscriptionPlan,
        hasPlan: user.hasPlan,
        thumbnailUsage: user.thumbnailUsage,
      },
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching plan info" });
  }
};
