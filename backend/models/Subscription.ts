import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planType: "free" | "basic" | "pro" | "enterprise";
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeProductId: string;
  stripePriceId: string;
  status: "active" | "canceled" | "past_due" | "unpaid" | "paused";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  credits: {
    used: number;
    limit: number;
  };
  thumbnailLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planType: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      required: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      sparse: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeProductId: {
      type: String,
      required: true,
    },
    stripePriceId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "unpaid", "paused"],
      default: "active",
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    canceledAt: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    credits: {
      used: {
        type: Number,
        default: 0,
      },
      limit: {
        type: Number,
        required: true,
      },
    },
    thumbnailLimit: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Add index on userId for query performance
SubscriptionSchema.index({ userId: 1 });

// Add compound index for efficient queries by userId and status
SubscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);

export default Subscription;
