# Stripe Integration Setup Guide

## Overview
Thumbly uses Stripe for handling subscription payments. This guide covers the setup process and API integration.

## Pricing Plans

Based on the frontend pricing data, we have three subscription tiers:

| Plan | Price | Credits | Features |
|------|-------|---------|----------|
| **Basic** | €29/month | 50 | 50 AI thumbnails/month, Basic Templates, Standard Resolution, No Watermarks, Email Support |
| **Pro** | €79/month | Unlimited | Unlimited AI thumbnails, Premium Templates, 4K Resolution, A/B Testing, Priority Support, Custom Fonts, Brand Kits Analytics |
| **Enterprise** | €199/month | Unlimited | Everything in Pro + API Access, Team Collaboration, Custom Branding, Dedicated Account Manager |

## Setup Instructions

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in to your Stripe account
3. Navigate to **Developers** → **API Keys**
4. Copy your:
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### 2. Set Up Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add an endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/subscription/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** (starts with `whsec_`)

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. Update User Model

Add Stripe customer ID to User model:

```typescript
stripeCustomerId?: string;
```

## API Endpoints

### Create Checkout Session
- **POST** `/api/subscription/checkout`
- **Auth**: Required (user session)
- **Body**: `{ planType: "basic" | "pro" | "enterprise" }`
- **Response**: `{ sessionId, url }`

### Get User Subscription
- **GET** `/api/subscription`
- **Auth**: Required (user session)
- **Response**: Subscription details with status, credits, dates

### Cancel Subscription
- **POST** `/api/subscription/cancel`
- **Auth**: Required (user session)
- **Response**: Cancellation confirmation with end date

### Update Subscription (Change Plan)
- **POST** `/api/subscription/update`
- **Auth**: Required (user session)
- **Body**: `{ newPlanType: "basic" | "pro" | "enterprise" }`
- **Response**: Updated subscription details

### Webhook Handler
- **POST** `/api/subscription/webhook`
- **Auth**: Not required (Stripe signature verification)
- **Handles**: Payment events, subscription updates, cancellations

## Database Models

### Subscription Model
Stores subscription information:
- `userId` - Reference to User
- `planType` - Current subscription tier
- `stripeCustomerId` - Stripe customer ID
- `stripeSubscriptionId` - Stripe subscription ID
- `status` - active, canceled, past_due, unpaid, paused
- `currentPeriodStart/End` - Billing period dates
- `credits` - Used and limit
- `cancelAtPeriodEnd` - Scheduled cancellation flag

## Frontend Integration

### Checkout Flow
1. User clicks "Get Started" on pricing page
2. Frontend calls `/api/subscription/checkout` with plan type
3. Redirect to Stripe checkout session URL
4. After payment, Stripe redirects to success URL
5. Webhook creates subscription record in database

### Success/Cancel Pages
- **Success**: `/subscription/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel**: `/subscription/cancel`

## Webhook Events

### checkout.session.completed
- Creates new subscription record
- Sets initial credits based on plan
- Stores Stripe IDs for future reference

### customer.subscription.updated
- Updates subscription status
- Updates billing period dates
- Handles plan changes

### customer.subscription.deleted
- Marks subscription as canceled
- Records cancellation date

### invoice.payment_failed
- Updates subscription status to `past_due`
- Triggers payment retry or notification

## Testing

### Test Mode
Use Stripe test cards for development:
- **Visa**: `4242 4242 4242 4242`
- **Visa (decline)**: `4000 0000 0000 0002`
- **Amex**: `3782 822463 10005`

### Webhook Testing
Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook URL to production domain
- [ ] Test full checkout flow
- [ ] Verify webhook events are received
- [ ] Set up email notifications for failed payments
- [ ] Configure Stripe dashboard alerts
- [ ] Test subscription cancellation
- [ ] Test plan upgrades/downgrades
- [ ] Set up customer support process

## Troubleshooting

### Webhook Not Received
- Verify webhook URL is publicly accessible
- Check Stripe webhook signing secret
- Review webhook logs in Stripe Dashboard

### Payment Failures
- Check customer payment method
- Review Stripe Dashboard for error details
- Implement retry logic for failed payments

### Subscription Not Created
- Verify checkout session completed event was received
- Check database for subscription record
- Review server logs for errors

## Security Notes

⚠️ **Important**:
- Never expose Stripe secret key in frontend
- Always verify webhook signatures
- Use HTTPS in production
- Implement rate limiting on checkout endpoint
- Store sensitive data securely
- Implement proper error handling without exposing details

## References

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
