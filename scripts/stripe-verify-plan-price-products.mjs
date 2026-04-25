#!/usr/bin/env node
/**
 * Confirms Starter and Family monthly/yearly env price IDs attach to the **same** Stripe Product
 * each (one product, two prices — same model as Family).
 *
 * Run from repo root (Node 20+):
 *   npm run stripe:verify-catalog
 *
 * Without --env-file support, load env first, e.g.:
 *   set -a && source .env.local && set +a && node scripts/stripe-verify-plan-price-products.mjs
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error(
    "Missing STRIPE_SECRET_KEY. Use Node 20+ with `npm run stripe:verify-catalog`, or export vars from .env.local first.",
  );
  process.exit(1);
}

const stripe = new Stripe(key);

/** @param {Stripe.Price} price */
function productFromPrice(price) {
  const p = price.product;
  if (p && typeof p === "object" && !p.deleted) {
    return { id: p.id, name: p.name ?? p.id };
  }
  if (typeof p === "string") {
    return { id: p, name: null };
  }
  return { id: "?", name: null };
}

/**
 * @param {string} planLabel
 * @param {string} monthlyKey
 * @param {string} yearlyKey
 */
async function checkPlan(planLabel, monthlyKey, yearlyKey) {
  const mId = process.env[monthlyKey]?.trim();
  const yId = process.env[yearlyKey]?.trim();

  console.log(`\n## ${planLabel}`);

  if (!mId || !yId) {
    console.log(`  Skip: set both ${monthlyKey} and ${yearlyKey}.`);
    return true;
  }

  const [pm, py] = await Promise.all([
    stripe.prices.retrieve(mId, { expand: ["product"] }),
    stripe.prices.retrieve(yId, { expand: ["product"] }),
  ]);

  let pmProd = productFromPrice(pm);
  let pyProd = productFromPrice(py);
  if (pmProd.name === null && pmProd.id !== "?") {
    const prod = await stripe.products.retrieve(pmProd.id);
    pmProd = { id: prod.id, name: prod.name ?? prod.id };
  }
  if (pyProd.name === null && pyProd.id !== "?") {
    const prod = await stripe.products.retrieve(pyProd.id);
    pyProd = { id: prod.id, name: prod.name ?? prod.id };
  }

  console.log(`  ${monthlyKey}=${mId}`);
  console.log(`    → product ${pmProd.id} (${pmProd.name})`);
  console.log(`  ${yearlyKey}=${yId}`);
  console.log(`    → product ${pyProd.id} (${pyProd.name})`);

  const same = pmProd.id === pyProd.id;
  if (!same) {
    console.log(`  ✗ Monthly and yearly point at different products.`);
    console.log(`    In Stripe Dashboard: keep one Product (e.g. rename it “Starter”), add the`);
    console.log(`    missing recurring price on that product, then update env to the new price_… IDs.`);
    console.log(`    For existing subscribers, move them to the new prices (Subscriptions → update).`);
    return false;
  }

  console.log(`  ✓ One product, two prices (aligned with Family-style setup).`);
  return true;
}

const okStarter = await checkPlan(
  "Starter",
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_STARTER_YEARLY",
);
const okFamily = await checkPlan(
  "Family",
  "STRIPE_PRICE_FAMILY_MONTHLY",
  "STRIPE_PRICE_FAMILY_YEARLY",
);

process.exit(okStarter && okFamily ? 0 : 2);
