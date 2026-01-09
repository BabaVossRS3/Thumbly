import mongoose from "mongoose";

export interface IUser extends Document{
    name: string;
    email: string;
    password: string;
    stripeCustomerId?: string;
    // Current subscription plan: "free" = no paid plan, "basic"/"pro"/"enterprise" = paid plan
    subscriptionPlan: "free" | "basic" | "pro" | "enterprise";
    // Indicates if user has an active paid subscription (true only for basic/pro/enterprise)
    // Should always be: hasPlan = (subscriptionPlan !== "free")
    hasPlan: boolean;
    thumbnailUsage: {
        created: number;
        limit: number;
        resetDate: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {type: String, required: true , trim:true},
  email: {type: String, required: true, trim:true, lowercase:true , unique:true , toLowerCase: true},
  password: {type: String, required: true},
  stripeCustomerId: {type: String, unique: true, sparse: true},
  // Current subscription plan: "free" = no paid plan, "basic"/"pro"/"enterprise" = paid plan
  subscriptionPlan: {type: String, enum: ["free", "basic", "pro", "enterprise"], default: "free"},
  // Indicates if user has an active paid subscription (true only for basic/pro/enterprise)
  // This should be kept in sync with subscriptionPlan: hasPlan = (subscriptionPlan !== "free")
  hasPlan: {type: Boolean, default: false},
  thumbnailUsage: {
    created: {type: Number, default: 0},
    limit: {type: Number, default: 3},
    resetDate: {type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)},
  },
},{
    timestamps: true
})

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;