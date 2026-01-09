import "dotenv/config";
import stripe, { STRIPE_PLANS } from "../configs/stripe.js";

// Helper function to fetch all items with pagination
const fetchAllItems = async <T extends { id: string }>(
  listFn: (params: { limit: number; starting_after?: string }) => Promise<{ data: T[]; has_more: boolean }>
): Promise<T[]> => {
  const allItems: T[] = [];
  let hasMore = true;
  let lastId: string | undefined;

  while (hasMore) {
    const response = await listFn({
      limit: 100,
      starting_after: lastId,
    });

    allItems.push(...response.data);
    hasMore = response.has_more;
    if (response.data.length > 0) {
      lastId = response.data[response.data.length - 1].id;
    }
  }

  return allItems;
};

const setupStripeProducts = async () => {
  try {
    console.log("🔄 Setting up Stripe products and prices...\n");

    const plans = Object.entries(STRIPE_PLANS);

    for (const [planKey, planData] of plans) {
      console.log(`📦 Setting up ${planData.name} plan...`);

      // Create or get product with pagination
      const allProducts = await fetchAllItems((params) =>
        stripe.products.list(params as any)
      );

      let product = allProducts.find(
        (p) => p.metadata?.planType === planKey
      );

      if (!product) {
        product = await stripe.products.create({
          name: planData.name,
          description: planData.description,
          metadata: {
            planType: planKey,
          },
        });
        console.log(`   ✅ Created product: ${product.id}`);
      } else {
        console.log(`   ✅ Found existing product: ${product.id}`);
      }

      // Create or find price with pagination and improved matching
      const allPrices = await fetchAllItems((params) =>
        stripe.prices.list({ product: product.id, ...params } as any)
      );

      // Match price by unit_amount, currency, and recurring interval
      let price = allPrices.find(
        (p) =>
          p.unit_amount === planData.price &&
          p.currency === "eur" &&
          p.recurring?.interval === "month" &&
          p.recurring?.interval_count === 1 &&
          p.type === "recurring"
      );

      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: planData.price,
          currency: "eur",
          recurring: {
            interval: "month",
            interval_count: 1,
          },
          metadata: {
            planType: planKey,
            credits: planData.credits.toString(),
          },
        });
        console.log(`   ✅ Created price: ${price.id}`);
      } else {
        console.log(`   ✅ Found existing price: ${price.id}`);
      }

      // Update config with IDs
      console.log(`   📋 Product ID: ${product.id}`);
      console.log(`   💳 Price ID: ${price.id}`);
      console.log(`   💰 Amount: €${(planData.price / 100).toFixed(2)}/month`);
      console.log(`   📊 Credits: ${planData.credits === 999999 ? "Unlimited" : planData.credits}\n`);
    }

    console.log("✅ Stripe products and prices setup complete!");
    console.log("\n📝 Update your STRIPE_PLANS config with these IDs if needed.");
    console.log("   The system will use product/price IDs from Stripe metadata.\n");

  } catch (error: any) {
    console.error("❌ Error setting up Stripe products:", error.message);
    process.exit(1);
  }
};

setupStripeProducts();
