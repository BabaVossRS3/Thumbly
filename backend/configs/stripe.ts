import Stripe from "stripe";

// Validate environment variable before initialization
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

const stripe = new Stripe(stripeSecretKey);

// Plan configurations matching frontend pricing
export const STRIPE_PLANS = {
  free: {
    name: "Free",
    price: 0, // Free plan
    credits: 3,
    description: "3 AI thumbnails total",
  },
  basic: {
    name: "Basic",
    price: 2900, // €29 in cents
    credits: 50,
    description: "50 AI thumbnails/month",
  },
  pro: {
    name: "Pro",
    price: 7900, // €79 in cents
    credits: 999999, // Unlimited
    description: "Unlimited AI thumbnails",
  },
  enterprise: {
    name: "Enterprise",
    price: 19900, // €199 in cents
    credits: 999999, // Unlimited
    description: "Everything in Pro + API Access",
  },
};

export default stripe;
