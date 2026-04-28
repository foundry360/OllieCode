#!/usr/bin/env node
/**
 * Creates Stripe **Products** and **recurring Prices** only (no customers, webhooks, or payment links).
 * Idempotent: reuses products/prices tagged with `metadata.ollie_plan`.
 *
 * Requires `import.env` (copy from `import.env.example`) with a live key and confirmation flag.
 *
 *   npm run stripe:import-catalog
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error(
    "Missing STRIPE_SECRET_KEY. Copy import.env.example → import.env and set your key.",
  );
  process.exit(1);
}

const isLive = key.startsWith("sk_live_");
const isTest = key.startsWith("sk_test_");
if (!isLive && !isTest) {
  console.error("STRIPE_SECRET_KEY must start with sk_live_ or sk_test_.");
  process.exit(1);
}

if (isLive && process.env.STRIPE_IMPORT_CONFIRM_LIVE?.trim() !== "1") {
  console.error(
    "Live mode: set STRIPE_IMPORT_CONFIRM_LIVE=1 in import.env to confirm you intend to create catalog objects in the live Stripe account.",
  );
  process.exit(1);
}

if (isLive) {
  console.warn("\n*** Using Stripe LIVE — creating real catalog objects. ***\n");
} else {
  console.warn("\n*** Using Stripe TEST — catalog objects are in test mode. ***\n");
}

function intEnv(name, fallback) {
  const v = process.env[name]?.trim();
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n < 1) {
    console.error(`Invalid ${name} (expected positive integer cents).`);
    process.exit(1);
  }
  return n;
}

const amounts = {
  starter: {
    month: intEnv("STARTER_MONTHLY_CENTS", 700),
    year: intEnv("STARTER_YEARLY_CENTS", 7500),
  },
  family: {
    month: intEnv("FAMILY_MONTHLY_CENTS", 1200),
    year: intEnv("FAMILY_YEARLY_CENTS", 13000),
  },
};

const stripe = new Stripe(key);

/**
 * @param {string} planId
 * @param {string} displayName
 */
async function ensureProduct(planId, displayName) {
  /** @type {string | undefined} */
  let startingAfter;
  for (;;) {
    const page = await stripe.products.list({
      limit: 100,
      active: true,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    const found = page.data.find(
      (p) => p.metadata?.ollie_plan === planId && !p.deleted,
    );
    if (found) return found;
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return stripe.products.create({
    name: displayName,
    metadata: { ollie_plan: planId },
  });
}

/**
 * @param {string} productId
 * @param {"month"|"year"} interval
 * @param {number} unitAmountCents
 */
async function ensureRecurringPrice(productId, interval, unitAmountCents) {
  const listed = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });
  const match = listed.data.find(
    (p) =>
      p.type === "recurring" &&
      p.recurring?.interval === interval &&
      p.currency === "usd" &&
      p.unit_amount === unitAmountCents,
  );
  if (match) return match;
  return stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: unitAmountCents,
    recurring: { interval },
  });
}

/**
 * @param {string} planId
 * @param {string} displayName
 * @param {{ month: number; year: number }} cents
 */
async function ensurePlan(planId, displayName, cents) {
  const product = await ensureProduct(planId, displayName);
  const pm = await ensureRecurringPrice(product.id, "month", cents.month);
  const py = await ensureRecurringPrice(product.id, "year", cents.year);
  return {
    productId: product.id,
    monthlyPriceId: pm.id,
    yearlyPriceId: py.id,
  };
}

const starter = await ensurePlan("starter", "Starter Plan", amounts.starter);
const family = await ensurePlan("family", "Family Plan", amounts.family);

console.log("\n--- Add these to Vercel (Production) or vercel-production.env ---\n");
console.log(`STRIPE_PRICE_STARTER_MONTHLY=${starter.monthlyPriceId}`);
console.log(`STRIPE_PRICE_STARTER_YEARLY=${starter.yearlyPriceId}`);
console.log(`STRIPE_PRICE_FAMILY_MONTHLY=${family.monthlyPriceId}`);
console.log(`STRIPE_PRICE_FAMILY_YEARLY=${family.yearlyPriceId}`);
console.log("\nProducts (for Dashboard reference):");
console.log(`  Starter product: ${starter.productId}`);
console.log(`  Family product:  ${family.productId}`);
console.log("\nRun `npm run stripe:verify-catalog` with the same key to confirm month/year share one product per plan.\n");
