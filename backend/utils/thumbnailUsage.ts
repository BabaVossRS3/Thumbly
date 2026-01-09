import User from "../models/User.js";
import Subscription from "../models/Subscription.js";

export const PLAN_LIMITS = {
  free: 3,
  basic: 50,
  pro: 999999,
  enterprise: 999999,
};

const VALID_PLAN_TYPES = new Set(Object.keys(PLAN_LIMITS)) as Set<string>;

// Helper function to reset thumbnail usage based on subscription period
const resetThumbnailUsageIfNeeded = async (
  user: any,
  now: Date = new Date()
): Promise<boolean> => {
  if (now > user.thumbnailUsage.resetDate) {
    user.thumbnailUsage.created = 0;
    
    // Try to get subscription period end date for accurate reset
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
    });
    
    if (subscription && subscription.currentPeriodEnd) {
      user.thumbnailUsage.resetDate = new Date(subscription.currentPeriodEnd);
    } else {
      // Fallback to 30 days if no subscription
      user.thumbnailUsage.resetDate = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );
    }
    
    return true;
  }
  return false;
};

// Get user's thumbnail limit based on subscription
export const getUserThumbnailLimit = async (userId: string): Promise<number> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return 0;
    }

    // Check if user has an active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (subscription) {
      // Validate plan type exists in PLAN_LIMITS
      if (!VALID_PLAN_TYPES.has(subscription.planType)) {
        console.warn(`Invalid plan type: ${subscription.planType}`);
        return 0;
      }
      return PLAN_LIMITS[subscription.planType as keyof typeof PLAN_LIMITS];
    }

    // Default to 0 if no subscription
    return 0;
  } catch (error) {
    console.error("Error getting thumbnail limit:", error);
    return 0;
  }
};

// Check if user can create a thumbnail
export const canCreateThumbnail = async (userId: string): Promise<boolean> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }

    // Reset usage if needed BEFORE checking limit (fixes logic order bug)
    const now = new Date();
    const wasReset = await resetThumbnailUsageIfNeeded(user, now);
    
    if (wasReset) {
      await user.save();
    }

    // Now check if usage limit is reached
    if (user.thumbnailUsage.created >= user.thumbnailUsage.limit) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking thumbnail creation:", error);
    return false;
  }
};

// Increment thumbnail usage
export const incrementThumbnailUsage = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Reset usage if needed
    const now = new Date();
    await resetThumbnailUsageIfNeeded(user, now);

    // Enforce limit - prevent exceeding quota
    if (user.thumbnailUsage.created >= user.thumbnailUsage.limit) {
      throw new Error(
        `Thumbnail limit exceeded. Used: ${user.thumbnailUsage.created}, Limit: ${user.thumbnailUsage.limit}`
      );
    }

    user.thumbnailUsage.created += 1;
    await user.save();
  } catch (error) {
    console.error("Error incrementing thumbnail usage:", error);
    throw error;
  }
};

// Get user's remaining thumbnails
export const getRemainingThumbnails = async (
  userId: string
): Promise<{ remaining: number; limit: number; used: number }> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { remaining: 0, limit: 0, used: 0 };
    }

    // Reset usage if needed
    const now = new Date();
    const wasReset = await resetThumbnailUsageIfNeeded(user, now);
    
    if (wasReset) {
      await user.save();
    }

    const remaining = Math.max(
      0,
      user.thumbnailUsage.limit - user.thumbnailUsage.created
    );

    return {
      remaining,
      limit: user.thumbnailUsage.limit,
      used: user.thumbnailUsage.created,
    };
  } catch (error) {
    console.error("Error getting remaining thumbnails:", error);
    return { remaining: 0, limit: 0, used: 0 };
  }
};

// Sync user limits with subscription
export const syncUserLimitsWithSubscription = async (
  userId: string
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return;
    }

    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (subscription) {
      // Validate plan type exists in PLAN_LIMITS
      if (!VALID_PLAN_TYPES.has(subscription.planType)) {
        console.warn(`Invalid plan type: ${subscription.planType}`);
        return;
      }
      
      user.subscriptionPlan = subscription.planType;
      user.thumbnailUsage.limit =
        PLAN_LIMITS[subscription.planType as keyof typeof PLAN_LIMITS];
      
      // Update reset date to match subscription period if available
      if (subscription.currentPeriodEnd) {
        user.thumbnailUsage.resetDate = new Date(subscription.currentPeriodEnd);
      }
      
      await user.save();
    }
  } catch (error) {
    console.error("Error syncing user limits:", error);
  }
};
