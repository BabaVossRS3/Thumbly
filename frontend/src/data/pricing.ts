import type { IPricing } from "../types";

export const pricingData: IPricing[] = [
    {
        name: "Free",
        price: 0,
        period: "forever",
        features: [
            "3 AI thumbnails total",
            "Basic Templates",
            "Standard Resolution",
            "Community Support"
        ],
        mostPopular: false
    },
    {
        name: "Basic",
        price: 29,
        period: "month",
        features: [
            "50 AI thumbnails/month",
            "Basic Templates",
            "Standard Resolution",
            "No Watermarks",
            "Email Support"
        ],
        mostPopular: false
    },
    {
        name: "Pro",
        price: 79,
        period: "month",
        features: [
            "Unlimited AI thumbnails",
            "Premium Templates",
            "4K Resolution",
            "A/B Testing Tools",
            "Priority Support",
            "Custom Fonts",
            "Brand Kits Analytics",
        ],
        mostPopular: true
    },
    {
        name: "Enterprise",
        price: 199,
        period: "month",
        features: [
            "Everything in Pro",
            "API Access",
            "Team Collaboration",
            "Custom Branding",
            "Dedicated Account Manager"
        ],
        mostPopular: false
    }
];