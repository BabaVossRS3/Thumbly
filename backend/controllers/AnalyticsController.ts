import { Request, Response } from "express";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Thumbnail from "../models/Thumbnail.js";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await User.countDocuments();
    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth },
    });
    const userGrowth = totalUsers > 0 ? Math.round(((usersLastMonth / totalUsers) * 100)) : 0;

    // Active subscriptions count
    const activeSubscriptionsCount = await Subscription.countDocuments({
      status: "active",
    });
    const subscriptionsLastMonth = await Subscription.countDocuments({
      status: "active",
      createdAt: { $gte: lastMonth },
    });
    const subscriptionGrowth = activeSubscriptionsCount > 0 ? Math.round(((subscriptionsLastMonth / activeSubscriptionsCount) * 100)) : 0;

    // Subscription distribution by plan
    const subscriptionDistribution = await Subscription.aggregate([
      {
        $group: {
          _id: "$planType",
          count: { $sum: 1 },
        },
      },
    ]);

    const subscriptionData = subscriptionDistribution.map((item) => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      fill: getColorForPlan(item._id),
    }));

    // Revenue calculation - actual data from subscriptions (monthly recurring)
    const activeSubscriptions = await Subscription.find({ status: "active" });
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
      const planPrice = getPriceForPlan(sub.planType);
      // All subscriptions are monthly recurring
      return sum + planPrice;
    }, 0);

    // Calculate actual revenue breakdown by plan type
    const revenueByPlan = await Subscription.aggregate([
      {
        $match: { status: "active" }
      },
      {
        $group: {
          _id: "$planType",
          count: { $sum: 1 },
        },
      },
    ]);

    const revenueData = revenueByPlan
      .filter((item) => item._id !== null) // Filter out null planType
      .map((item) => {
        const planPrice = getPriceForPlan(item._id);
        const revenue = planPrice * item.count;
        return {
          name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
          value: Math.round(revenue),
          fill: getColorForPlan(item._id),
        };
      });

    // Calculate revenue from last month (subscriptions that were active during last month period)
    // This represents the actual revenue from the previous 30-day period
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const revenueLastMonthByPlan = await Subscription.aggregate([
      {
        $match: { 
          status: "active",
          createdAt: { 
            $gte: twoMonthsAgo,
            $lt: lastMonth
          }
        }
      },
      {
        $group: {
          _id: "$planType",
          count: { $sum: 1 },
        },
      },
    ]);

    const revenueLastMonth = revenueLastMonthByPlan.reduce((sum, item) => {
      const planPrice = getPriceForPlan(item._id);
      return sum + (planPrice * item.count);
    }, 0);

    // Thumbnails generated - compare current month to previous month
    const totalThumbnails = await Thumbnail.countDocuments();
    const thumbnailsLastMonth = await Thumbnail.countDocuments({
      createdAt: { $gte: lastMonth },
    });
    const thumbnailsInLastMonthPeriod = await Thumbnail.countDocuments({
      createdAt: { 
        $gte: twoMonthsAgo,
        $lt: lastMonth
      }
    });
    // Calculate thumbnail growth as percentage change between periods
    const thumbnailGrowth = thumbnailsInLastMonthPeriod > 0 ? Math.round(((thumbnailsLastMonth - thumbnailsInLastMonthPeriod) / thumbnailsInLastMonthPeriod) * 100) : 0;

    // Conversion rate calculation (current period)
    // Current conversion rate: active subscriptions / all users (including non-paying)
    const conversionRate = totalUsers > 0 ? ((activeSubscriptionsCount / totalUsers) * 100).toFixed(1) : "0";
    
    // Calculate actual conversion growth - use compatible metrics
    // Compare current period subscriptions to previous period subscriptions
    // Both periods use the same denominator (total users in that period)
    const subscriptionsInLastMonthPeriod = await Subscription.countDocuments({
      status: "active",
      createdAt: { 
        $gte: twoMonthsAgo,
        $lt: lastMonth
      }
    });
    const usersInLastMonthPeriod = await User.countDocuments({
      createdAt: { 
        $gte: twoMonthsAgo,
        $lt: lastMonth
      }
    });
    // Previous conversion rate: subscriptions in last month period / users in last month period
    const previousConversionRate = usersInLastMonthPeriod > 0 ? (subscriptionsInLastMonthPeriod / usersInLastMonthPeriod) * 100 : 0;
    const currentConversionRateNum = parseFloat(conversionRate);
    const conversionGrowth = previousConversionRate > 0 ? Math.round(((currentConversionRateNum - previousConversionRate) / previousConversionRate) * 100) : 0;

    // Average revenue per user (only paying users, not all users)
    const payingUsers = activeSubscriptionsCount;
    const arpu = payingUsers > 0 ? (totalRevenue / payingUsers).toFixed(2) : "0";

    // Calculate revenue growth - compare current month revenue to previous month
    const revenueGrowth = revenueLastMonth > 0 ? Math.round(((totalRevenue - revenueLastMonth) / revenueLastMonth) * 100) : 0;

    res.status(200).json({
      stats: {
        totalRevenue: `€${Math.round(totalRevenue).toLocaleString()}`,
        totalRevenueValue: Math.round(totalRevenue),
        revenueGrowth: revenueGrowth,
        activeUsers: totalUsers,
        activeUsersGrowth: userGrowth,
        subscriptions: activeSubscriptionsCount,
        subscriptionsGrowth: subscriptionGrowth,
        conversionRate: `${conversionRate}%`,
        conversionRateGrowth: conversionGrowth,
      },
      charts: {
        subscriptionDistribution: subscriptionData,
        revenueBreakdown: revenueData,
      },
      summary: {
        totalRevenue: `€${Math.round(totalRevenue).toLocaleString()}`,
        totalRevenueByPlan: revenueData,
        arpu: `€${arpu}`,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

function getPriceForPlan(planType: string): number {
  const prices: { [key: string]: number } = {
    basic: 29,
    pro: 29,
    enterprise: 99,
  };
  return prices[planType] || 0;
}

function getColorForPlan(planType: string): string {
  const colors: { [key: string]: string } = {
    basic: "#6b7280",
    pro: "#f59e0b",
    enterprise: "#3b82f6",
  };
  return colors[planType] || "#6b7280";
}
