/**
 * Seed script: populates the DB with the Acme Analytics sample catalog and quote.
 *
 * Product: Analytics Suite
 * Tiers:   Starter ($25/seat/mo), Growth ($50/seat/mo), Enterprise ($100/seat/mo)
 * Features:
 *   - Single Sign-On (SSO): addon on all tiers, fixed $200/mo
 *   - API Access:           addon on all tiers, per-seat $50/seat/mo
 *
 * Sample quote:
 *   Growth tier, 25 seats, Annual, SSO (12 months), API access (5 seats)
 *   Total: $18,150
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ── Product ──────────────────────────────────────────────────────────────
  const product = await prisma.product.upsert({
    where: { id: 'seed-product-analytics' },
    update: {},
    create: {
      id: 'seed-product-analytics',
      name: 'Analytics Suite',
      description: 'A full-featured analytics platform for teams of all sizes.',
    },
  });

  // ── Tiers ─────────────────────────────────────────────────────────────────
  const tierStarter = await prisma.tier.upsert({
    where: { id: 'seed-tier-starter' },
    update: {},
    create: {
      id: 'seed-tier-starter',
      name: 'Starter',
      description: 'Entry tier for small teams',
      basePrice: 2500, // $25.00 in cents
      displayOrder: 0,
      productId: product.id,
    },
  });

  const tierGrowth = await prisma.tier.upsert({
    where: { id: 'seed-tier-growth' },
    update: {},
    create: {
      id: 'seed-tier-growth',
      name: 'Growth',
      description: 'Mid-market tier with most features',
      basePrice: 5000, // $50.00 in cents
      displayOrder: 1,
      productId: product.id,
    },
  });

  const tierEnterprise = await prisma.tier.upsert({
    where: { id: 'seed-tier-enterprise' },
    update: {},
    create: {
      id: 'seed-tier-enterprise',
      name: 'Enterprise',
      description: 'Full-featured tier for large customers',
      basePrice: 10000, // $100.00 in cents
      displayOrder: 2,
      productId: product.id,
    },
  });

  // ── Features ──────────────────────────────────────────────────────────────
  const featureSSO = await prisma.feature.upsert({
    where: { id: 'seed-feature-sso' },
    update: {},
    create: {
      id: 'seed-feature-sso',
      name: 'Single Sign-On (SSO)',
      description: 'Centralized authentication via SSO provider',
      productId: product.id,
    },
  });

  const featureAPI = await prisma.feature.upsert({
    where: { id: 'seed-feature-api' },
    update: {},
    create: {
      id: 'seed-feature-api',
      name: 'API Access',
      description: 'Programmatic access to the platform API',
      productId: product.id,
    },
  });

  // ── FeatureTierConfigs ────────────────────────────────────────────────────
  // SSO: addon on all three tiers, fixed $200/month
  for (const [tierId, configId] of [
    [tierStarter.id, 'seed-ftc-sso-starter'],
    [tierGrowth.id, 'seed-ftc-sso-growth'],
    [tierEnterprise.id, 'seed-ftc-sso-enterprise'],
  ] as [string, string][]) {
    await prisma.featureTierConfig.upsert({
      where: { id: configId },
      update: {},
      create: {
        id: configId,
        availability: 'addon',
        pricingModel: 'fixed',
        price: 20000, // $200.00/month in cents
        featureId: featureSSO.id,
        tierId,
      },
    });
  }

  // API Access: addon on all three tiers, per-seat $50/seat/month
  for (const [tierId, configId] of [
    [tierStarter.id, 'seed-ftc-api-starter'],
    [tierGrowth.id, 'seed-ftc-api-growth'],
    [tierEnterprise.id, 'seed-ftc-api-enterprise'],
  ] as [string, string][]) {
    await prisma.featureTierConfig.upsert({
      where: { id: configId },
      update: {},
      create: {
        id: configId,
        availability: 'addon',
        pricingModel: 'per_seat',
        price: 5000, // $50.00/seat/month in cents
        featureId: featureAPI.id,
        tierId,
      },
    });
  }

  // ── Sample Quote ──────────────────────────────────────────────────────────
  // Growth, 25 seats, Annual, SSO + API access (5 seats) → $18,150
  const sampleQuote = await prisma.quote.upsert({
    where: { id: 'seed-quote-acme-sample' },
    update: {},
    create: {
      id: 'seed-quote-acme-sample',
      name: 'Acme Analytics – Sample Quote',
      customerName: 'Acme Analytics',
      seats: 25,
      termLength: 'annual',
      discountPercent: 0,
      productName: product.name,
      tierName: tierGrowth.name,
      basePricePerSeat: tierGrowth.basePrice,
      productId: product.id,
      tierId: tierGrowth.id,
    },
  });

  // SSO add-on (fixed: quantity=1, represents the flat monthly fee)
  await prisma.quoteAddOn.upsert({
    where: { id: 'seed-addon-sso' },
    update: {},
    create: {
      id: 'seed-addon-sso',
      quantity: 1,
      featureName: featureSSO.name,
      pricingModel: 'fixed',
      price: 20000, // $200/month in cents
      quoteId: sampleQuote.id,
      featureTierConfigId: 'seed-ftc-sso-growth',
    },
  });

  // API Access add-on (per-seat: 5 seats)
  await prisma.quoteAddOn.upsert({
    where: { id: 'seed-addon-api' },
    update: {},
    create: {
      id: 'seed-addon-api',
      quantity: 5,
      featureName: featureAPI.name,
      pricingModel: 'per_seat',
      price: 5000, // $50/seat/month in cents
      quoteId: sampleQuote.id,
      featureTierConfigId: 'seed-ftc-api-growth',
    },
  });

  console.log('✓ Seeded product:', product.name);
  console.log('  Tiers:', [tierStarter.name, tierGrowth.name, tierEnterprise.name].join(', '));
  console.log('  Features:', [featureSSO.name, featureAPI.name].join(', '));
  console.log('  Sample quote:', sampleQuote.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
