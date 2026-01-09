import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

export interface CreditDeductionResult {
  success: boolean;
  creditsUsed: number;
  creditsRemaining: number;
  message: string;
}

export const deductCredit = async (
  userId: string
): Promise<CreditDeductionResult> => {
  try {
    // Use atomic findOneAndUpdate to prevent race conditions
    // This ensures the check and update happen atomically in MongoDB
    const subscription = await Subscription.findOneAndUpdate(
      {
        userId,
        status: "active",
        $expr: { $lt: ["$credits.used", "$credits.limit"] }, // Only update if used < limit
      },
      {
        $inc: { "credits.used": 1 }, // Atomically increment used credits
      },
      { new: true } // Return updated document
    );

    if (!subscription) {
      // If findOneAndUpdate returns null, either:
      // 1. No active subscription exists
      // 2. Credit limit already reached
      
      // Check which case it is
      const existingSubscription = await Subscription.findOne({
        userId,
        status: "active",
      });

      if (!existingSubscription) {
        return {
          success: false,
          creditsUsed: 0,
          creditsRemaining: 0,
          message: "No active subscription found",
        };
      }

      return {
        success: false,
        creditsUsed: existingSubscription.credits.used,
        creditsRemaining: Math.max(
          0,
          existingSubscription.credits.limit - existingSubscription.credits.used
        ),
        message: "Credit limit reached",
      };
    }

    const creditsRemaining = Math.max(
      0,
      subscription.credits.limit - subscription.credits.used
    );

    return {
      success: true,
      creditsUsed: subscription.credits.used,
      creditsRemaining,
      message: "Credit deducted successfully",
    };
  } catch (error: any) {
    console.error("Error deducting credit:", error);
    return {
      success: false,
      creditsUsed: 0,
      creditsRemaining: 0,
      message: "Error deducting credit",
    };
  }
};

export const getCreditsInfo = async (
  userId: string
): Promise<{
  used: number;
  limit: number;
  remaining: number;
} | null> => {
  try {
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (!subscription) {
      return null;
    }

    const remaining = Math.max(
      0,
      subscription.credits.limit - subscription.credits.used
    );

    return {
      used: subscription.credits.used,
      limit: subscription.credits.limit,
      remaining,
    };
  } catch (error: any) {
    console.error("Error getting credits info:", error);
    return null;
  }
};
