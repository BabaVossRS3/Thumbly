import { Request, Response } from "express";
import stripe, { STRIPE_PLANS } from "../configs/stripe.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import { syncUserLimitsWithSubscription, PLAN_LIMITS } from "../utils/thumbnailUsage.js";

interface UserRequest extends Request {
  session: any;
}

interface AdminRequest extends Request {
  admin?: { id: string; email: string; role: string };
}

// Create checkout session for subscription
export const createCheckoutSession = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const { planType } = req.body;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!planType || !STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS]) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId.toString(),
        },
      });
      stripeCustomerId = customer.id;
      await User.findByIdAndUpdate(userId, {
        stripeCustomerId,
      });
    }

    // Check for existing subscription and cancel it in Stripe
    const existingSubscription = await Subscription.findOne({ 
      userId, 
      status: "active" 
    });

    if (existingSubscription && existingSubscription.stripeSubscriptionId) {
      try {
        // Cancel the old Stripe subscription immediately
        await stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId);
        console.log(`Canceled old subscription: ${existingSubscription.stripeSubscriptionId}`);
        
        // Mark old subscription as canceled in database
        await Subscription.findByIdAndUpdate(existingSubscription._id, {
          status: "canceled",
        });
      } catch (cancelError: any) {
        console.log("Error canceling old subscription:", cancelError.message);
        // Continue anyway - subscription might already be canceled
      }
    }

    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      return res.status(500).json({ message: "Server configuration error: FRONTEND_URL not set" });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan.name,
              description: plan.description,
              metadata: {
                planType,
              },
            },
            unit_amount: plan.price,
            recurring: {
              interval: "month",
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment-failed`,
      metadata: {
        userId: userId.toString(),
        planType,
      },
    });

    return res.status(200).json({
      message: "Checkout session created",
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while creating checkout session" });
  }
};

// Sync subscription from Stripe session (called after successful payment)
export const syncSubscriptionFromSession = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const { sessionId } = req.body;
    const userId = req.session?.userId;

    // Log only non-PII information for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Sync subscription request:', { sessionId, userId, hasSession: !!req.session });
    }

    if (!userId) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('User not authenticated - no userId in session');
      }
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!sessionId) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Session ID is required but not provided');
      }
      return res.status(400).json({ message: "Session ID is required" });
    }

    // Retrieve the checkout session from Stripe
    if (process.env.NODE_ENV !== 'production') {
      console.log('Retrieving Stripe session');
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Stripe session retrieved:', { 
        payment_status: session.payment_status, 
        subscription: session.subscription
      });
    }

    if (!session || session.payment_status !== "paid") {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Payment not completed or session invalid:', { 
          sessionExists: !!session, 
          paymentStatus: session?.payment_status 
        });
      }
      return res.status(400).json({ message: "Payment not completed" });
    }

    const planType = session.metadata?.planType;
    if (!planType) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Plan type not found in session metadata');
      }
      return res.status(400).json({ message: "Plan type not found in session" });
    }

    // Get the subscription from Stripe
    if (process.env.NODE_ENV !== 'production') {
      console.log('Retrieving Stripe subscription');
    }
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    ) as any;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Stripe subscription retrieved:', { 
        items: stripeSubscription.items?.data?.length,
        status: stripeSubscription.status
      });
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];
    const thumbnailLimit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS];
    if (process.env.NODE_ENV !== 'production') {
      console.log('Plan and limits:', { planType, thumbnailLimit });
    }

    // Get period dates from subscription - use current time if not available
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    
    if (stripeSubscription.current_period_start && stripeSubscription.current_period_end) {
      currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    } else {
      // Fallback: use current date and calculate end date based on plan
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Subscription period dates missing from Stripe, using fallback dates');
      }
      currentPeriodStart = new Date();
      // Set end date to 30 days from now for monthly plans
      currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
    }

    const stripeSubscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;

    // Cancel all other active subscriptions for this user (to prevent multiple active plans)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Canceling other active subscriptions for user');
    }
    const otherActiveSubscriptions = await Subscription.find({
      userId,
      status: "active",
      stripeSubscriptionId: { $ne: stripeSubscriptionId },
    });

    for (const oldSub of otherActiveSubscriptions) {
      // Cancel in Stripe if it's a Stripe subscription (not a free plan)
      if (oldSub.stripeSubscriptionId && !oldSub.stripeSubscriptionId.startsWith("free-")) {
        try {
          await stripe.subscriptions.cancel(oldSub.stripeSubscriptionId);
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Canceled old Stripe subscription: ${oldSub.stripeSubscriptionId}`);
          }
        } catch (cancelError: any) {
          console.log("Error canceling old Stripe subscription:", cancelError.message);
        }
      }

      // Mark as canceled in database
      await Subscription.findByIdAndUpdate(oldSub._id, {
        status: "canceled",
        canceledAt: new Date(),
      });
    }

    // Check if subscription already exists
    if (process.env.NODE_ENV !== 'production') {
      console.log('Checking for existing subscription');
    }
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId,
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('Existing subscription found:', !!existingSubscription);
    }

    if (!existingSubscription) {
      // Create new subscription record
      if (process.env.NODE_ENV !== 'production') {
        console.log('Creating new subscription with data:', {
          planType,
          status: "active",
          thumbnailLimit
        });
      }
      try {
        await Subscription.create({
          userId,
          planType,
          stripeCustomerId,
          stripeSubscriptionId,
          stripeProductId: stripeSubscription.items?.data?.[0]?.price?.product as string || "",
          stripePriceId: stripeSubscription.items?.data?.[0]?.price?.id || "",
          status: "active",
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          credits: {
            used: 0,
            limit: plan.credits,
          },
          thumbnailLimit,
        });
        if (process.env.NODE_ENV !== 'production') {
          console.log('Subscription created successfully');
        }
      } catch (createError: any) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error creating subscription:', createError.message);
        }
        throw createError;
      }
    } else {
      // Update existing subscription
      await Subscription.findByIdAndUpdate(existingSubscription._id, {
        userId,
        planType,
        status: "active",
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        "credits.used": 0,
        "credits.limit": plan.credits,
        thumbnailLimit,
      });
    }

    // Update user with new plan
    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: planType,
      hasPlan: true,
      "thumbnailUsage.limit": thumbnailLimit,
      "thumbnailUsage.used": 0,
      "thumbnailUsage.resetDate": currentPeriodEnd,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Subscription synced to ${planType} plan with ${thumbnailLimit} thumbnail limit`);
    }

    return res.status(200).json({
      message: "Subscription synced successfully",
      planType,
      thumbnailLimit,
    });
  } catch (error: any) {
    // Log only non-PII error information in production
    if (process.env.NODE_ENV !== 'production') {
      console.error("Error syncing subscription:", {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        errors: error.errors,
        stack: error.stack
      });
    } else {
      // Production: log only error code and type
      console.error("Error syncing subscription:", {
        code: error.code,
        statusCode: error.statusCode
      });
    }
    
    // Return more specific error messages with defensive checks
    if (error.code === 11000 && error.keyPattern) {
      const field = Object.keys(error.keyPattern)[0];
      if (field) {
        return res.status(400).json({ message: `Duplicate ${field}. This subscription may already exist.` });
      }
      return res.status(400).json({ message: "Duplicate subscription. This subscription may already exist." });
    }
    
    if (error.errors) {
      const validationErrors = Object.entries(error.errors).map(([ key, value ]: any) => `${key}: ${value.message}`).join(', ');
      return res.status(400).json({ message: `Validation error: ${validationErrors}` });
    }
    
    return res.status(500).json({ message: "Failed to sync subscription" });
  }
};

// Get all subscriptions with user details (for admin)
export const getAllSubscriptions = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (req.admin.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admins can access this resource" });
    }
    
    // Only fetch active subscriptions to prevent showing duplicate plans for same user
    const subscriptions = await Subscription.find({ status: "active" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const formattedSubscriptions = subscriptions.map((sub: any) => ({
      id: sub._id,
      userId: sub.userId._id,
      name: sub.userId.name,
      email: sub.userId.email,
      planType: sub.planType,
      status: sub.status,
      startDate: sub.currentPeriodStart,
      endDate: sub.currentPeriodEnd,
      canceledAt: sub.canceledAt,
      creditsUsed: sub.credits.used,
      creditsLimit: sub.credits.limit,
      thumbnailLimit: sub.thumbnailLimit,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    return res.status(200).json({
      message: "Subscriptions retrieved successfully",
      subscriptions: formattedSubscriptions,
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching subscriptions" });
  }
};

// Get user subscription
export const getUserSubscription = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    return res.status(200).json({
      message: "Subscription retrieved successfully",
      subscription: {
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        credits: subscription.credits,
      },
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching subscription" });
  }
};

// Cancel subscription
export const cancelSubscription = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    if (subscription.status !== "active") {
      return res.status(400).json({ message: "Only active subscriptions can be canceled" });
    }

    if (subscription.stripeSubscriptionId.startsWith("admin-grant")) {
      return res.status(400).json({ message: "Admin-granted subscriptions cannot be canceled by users" });
    }

    // Cancel at period end
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    await Subscription.findByIdAndUpdate(subscription._id, {
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    });

    return res.status(200).json({
      message: "Subscription canceled successfully",
      canceledAt: (canceledSubscription as any).canceled_at,
      currentPeriodEnd: (canceledSubscription as any).current_period_end,
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while canceling subscription" });
  }
};

// Update subscription (change plan)
export const updateSubscription = async (
  req: UserRequest,
  res: Response
) => {
  try {
    const userId = req.session?.userId;
    const { newPlanType } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (
      !newPlanType ||
      !STRIPE_PLANS[newPlanType as keyof typeof STRIPE_PLANS]
    ) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    const newPlan = STRIPE_PLANS[newPlanType as keyof typeof STRIPE_PLANS];
    const newThumbnailLimit = PLAN_LIMITS[newPlanType as keyof typeof PLAN_LIMITS];

    // Update Stripe subscription
    const updatedSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    if (updatedSubscription.items.data.length > 0) {
      const priceId = updatedSubscription.items.data[0].price.id;
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: updatedSubscription.items.data[0].id,
              price: priceId,
            },
          ],
        }
      );
    }

    // Update subscription in database
    await Subscription.findByIdAndUpdate(subscription._id, {
      planType: newPlanType,
      "credits.limit": newPlan.credits,
      thumbnailLimit: newThumbnailLimit,
    });

    // Update user thumbnail limit
    await User.findByIdAndUpdate(userId, {
      "thumbnailUsage.limit": newThumbnailLimit,
    });

    return res.status(200).json({
      message: "Subscription updated successfully",
      planType: newPlanType,
      thumbnailLimit: newThumbnailLimit,
    });
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating subscription" });
  }
};

// Webhook handler for Stripe events
// Use a Map to store webhook IDs with timestamps for bounded memory usage
interface WebhookCache {
  id: string;
  timestamp: number;
}

const processedWebhookIds = new Map<string, number>();
const WEBHOOK_CACHE_MAX_SIZE = 1000; // Max webhook IDs to keep in memory
const WEBHOOK_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Clean up old webhook IDs to prevent memory leak
const cleanupWebhookCache = () => {
  const now = Date.now();
  for (const [id, timestamp] of processedWebhookIds.entries()) {
    // Remove entries older than TTL
    if (now - timestamp > WEBHOOK_CACHE_TTL) {
      processedWebhookIds.delete(id);
    }
  }
  
  // If cache is still too large, remove oldest entries
  if (processedWebhookIds.size > WEBHOOK_CACHE_MAX_SIZE) {
    const entriesToRemove = processedWebhookIds.size - WEBHOOK_CACHE_MAX_SIZE;
    let removed = 0;
    for (const [id, timestamp] of processedWebhookIds.entries()) {
      if (removed >= entriesToRemove) break;
      processedWebhookIds.delete(id);
      removed++;
    }
  }
};

export const handleStripeWebhook = async (
  req: Request,
  res: Response
) => {
  const sig = req.headers["stripe-signature"] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (processedWebhookIds.has(event.id)) {
      console.log(`Webhook ${event.id} already processed, skipping`);
      return res.json({ received: true });
    }

    processedWebhookIds.set(event.id, Date.now());
    
    // Cleanup cache periodically (every 100 webhooks)
    if (processedWebhookIds.size % 100 === 0) {
      cleanupWebhookCache();
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata.userId;
        const planType = session.metadata.planType;

        // Create subscription record
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];

        const thumbnailLimit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS];
        const stripeSubData = stripeSubscription as any;

        // Check if there's an active subscription with same stripeSubscriptionId (avoid duplicates)
        const existingActiveSubscription = await Subscription.findOne({ 
          stripeSubscriptionId: session.subscription 
        });

        if (!existingActiveSubscription) {
          // Create new subscription record
          await Subscription.create({
            userId,
            planType,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            stripeProductId: stripeSubscription.items.data[0].price.product as string,
            stripePriceId: stripeSubscription.items.data[0].price.id,
            status: "active",
            currentPeriodStart: new Date(
              stripeSubData.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              stripeSubData.current_period_end * 1000
            ),
            cancelAtPeriodEnd: false,
            credits: {
              used: 0,
              limit: plan.credits,
            },
            thumbnailLimit,
          });
        }

        // Update user subscription plan and thumbnail limits
        await User.findByIdAndUpdate(userId, {
          subscriptionPlan: planType,
          hasPlan: true,
          "thumbnailUsage.limit": thumbnailLimit,
          "thumbnailUsage.used": 0,
          "thumbnailUsage.resetDate": new Date(stripeSubData.current_period_end * 1000),
        });

        console.log(`User ${userId} upgraded to ${planType} plan with ${thumbnailLimit} thumbnail limit`);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata.userId;

        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            status: subscription.status,
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        );

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        const dbSubscription = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            status: "canceled",
            canceledAt: new Date(),
          },
          { new: true }
        );

        if (dbSubscription) {
          await User.findByIdAndUpdate(dbSubscription.userId, {
            subscriptionPlan: "free",
            hasPlan: false,
            "thumbnailUsage.limit": 3,
            "thumbnailUsage.used": 0,
            "thumbnailUsage.resetDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
          console.log(`User ${dbSubscription.userId} reset to free plan after subscription deletion`);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;

        await Subscription.findOneAndUpdate(
          { stripeCustomerId: invoice.customer },
          {
            status: "past_due",
          }
        );

        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.log("Webhook error:", error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// Grant subscription to user (admin)
export const grantSubscription = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (req.admin.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admins can access this resource" });
    }

    const { userId, planType } = req.body;

    if (!userId || !planType) {
      return res.status(400).json({ message: "userId and planType are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plan = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];
    if (!plan) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    const thumbnailLimit = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS];

    // Delete old subscriptions for this user
    await Subscription.deleteMany({ userId });

    // Create new subscription record
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await Subscription.create({
      userId,
      planType,
      stripeCustomerId: user.stripeCustomerId || "admin-grant",
      stripeSubscriptionId: `admin-grant-${userId}-${Date.now()}`,
      stripeProductId: "admin-grant",
      stripePriceId: "admin-grant",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
      credits: {
        used: 0,
        limit: plan.credits,
      },
      thumbnailLimit,
    });

    // Update user with new plan
    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: planType,
      hasPlan: true,
      "thumbnailUsage.limit": thumbnailLimit,
      "thumbnailUsage.used": 0,
      "thumbnailUsage.resetDate": nextMonth,
    });

    console.log(`Admin granted ${planType} plan to user ${userId}`);

    return res.status(200).json({
      message: "Subscription granted successfully",
      planType,
      thumbnailLimit,
    });
  } catch (error: any) {
    console.log("Error granting subscription:", error);
    return res.status(500).json({ message: "Failed to grant subscription" });
  }
};

// Terminate subscription (admin)
export const terminateSubscription = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (req.admin.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admins can access this resource" });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (subscription) {
      // If it's a Stripe subscription, cancel it
      if (subscription.stripeSubscriptionId && !subscription.stripeSubscriptionId.startsWith("admin-grant")) {
        try {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
          console.log(`Canceled Stripe subscription: ${subscription.stripeSubscriptionId}`);
        } catch (stripeError: any) {
          console.log("Error canceling Stripe subscription:", stripeError.message);
        }
      }

      // Mark subscription as canceled
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "canceled",
        canceledAt: new Date(),
      });
    }

    // Reset user to free plan
    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: "free",
      hasPlan: false,
      "thumbnailUsage.limit": 3,
      "thumbnailUsage.used": 0,
      "thumbnailUsage.resetDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    console.log(`Admin terminated subscription for user ${userId}`);

    return res.status(200).json({
      message: "Subscription terminated successfully",
    });
  } catch (error: any) {
    console.log("Error terminating subscription:", error);
    return res.status(500).json({ message: "Failed to terminate subscription" });
  }
};
