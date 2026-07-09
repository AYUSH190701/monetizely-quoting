/**
 * Pricing calculation utilities for the quoting tool.
 * All monetary values are stored in cents to avoid floating-point issues.
 * Percentages are stored in basis points (100 = 1%, 1000 = 10%).
 */

export type TermLength = 'monthly' | 'annual' | 'two_year';
export type PricingModel = 'fixed' | 'per_seat' | 'percentage';
export type FeatureAvailability = 'included' | 'addon' | 'not_available';

// Discount rates for different term lengths (stored as decimals for calculation)
export const TERM_DISCOUNTS: Record<TermLength, number> = {
  monthly: 0,
  annual: 0.15, // 15% discount
  two_year: 0.25, // 25% discount
};

// Number of months for each term
export const TERM_MONTHS: Record<TermLength, number> = {
  monthly: 1,
  annual: 12,
  two_year: 24,
};

export const TERM_DISPLAY_NAMES: Record<TermLength, string> = {
  monthly: 'Monthly',
  annual: 'Annual (15% off)',
  two_year: '2-Year (25% off)',
};

/**
 * Converts cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Converts dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Formats cents as a dollar amount string
 */
export function formatCurrency(cents: number): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Converts basis points to percentage
 */
export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100;
}

/**
 * Converts percentage to basis points
 */
export function percentToBasisPoints(percent: number): number {
  return Math.round(percent * 100);
}

/**
 * Calculate the base product cost (before add-ons and discounts)
 * @param basePricePerSeat - Price per seat per month in cents
 * @param seats - Number of seats
 * @param termLength - Term length
 * @returns Object containing monthly, term total, and discounted prices
 */
export function calculateBaseProductCost(
  basePricePerSeat: number,
  seats: number,
  termLength: TermLength
): {
  monthlyTotal: number; // Total per month before discount
  monthlyDiscounted: number; // Total per month after term discount
  termTotal: number; // Total for the entire term
  termDiscount: number; // Total discount amount for the term
} {
  const monthlyTotal = basePricePerSeat * seats;
  const discountRate = TERM_DISCOUNTS[termLength];
  const monthlyDiscounted = Math.round(monthlyTotal * (1 - discountRate));
  const months = TERM_MONTHS[termLength];
  const termTotal = monthlyDiscounted * months;
  const termDiscount = (monthlyTotal - monthlyDiscounted) * months;

  return {
    monthlyTotal,
    monthlyDiscounted,
    termTotal,
    termDiscount,
  };
}

/**
 * Calculate the cost of an add-on
 * @param pricingModel - The pricing model (fixed, per_seat, percentage)
 * @param price - The price value (cents for fixed/per_seat, basis points for percentage)
 * @param quantity - Quantity (used for per_seat pricing)
 * @param baseProductCostMonthly - Monthly product cost (used for percentage pricing)
 * @param termLength - Term length
 * @returns Object containing monthly and term costs
 */
export function calculateAddOnCost(
  pricingModel: PricingModel,
  price: number,
  quantity: number,
  baseProductCostMonthly: number,
  termLength: TermLength
): {
  monthlyTotal: number;
  termTotal: number;
  description: string;
} {
  let monthlyTotal: number;
  let description: string;

  switch (pricingModel) {
    case 'fixed':
      monthlyTotal = price;
      description = `${formatCurrency(price)}/month`;
      break;
    case 'per_seat':
      monthlyTotal = price * quantity;
      description = `${formatCurrency(price)}/seat × ${quantity} seats`;
      break;
    case 'percentage':
      // Price is in basis points (1000 = 10%)
      const percentValue = basisPointsToPercent(price);
      monthlyTotal = Math.round(baseProductCostMonthly * (percentValue / 100));
      description = `${percentValue}% of product cost`;
      break;
    default:
      throw new Error(`Unknown pricing model: ${pricingModel}`);
  }

  const months = TERM_MONTHS[termLength];
  const termTotal = monthlyTotal * months;

  return {
    monthlyTotal,
    termTotal,
    description,
  };
}

export interface QuoteLineItem {
  name: string;
  description: string;
  monthlyAmount: number;
  termAmount: number;
  type: 'base' | 'addon' | 'discount';
}

export interface QuoteAddOnInput {
  featureName: string;
  pricingModel: PricingModel;
  price: number;
  quantity: number;
}

export interface QuoteCalculationResult {
  lineItems: QuoteLineItem[];
  subtotalMonthly: number;
  subtotalTerm: number;
  termDiscountAmount: number;
  additionalDiscountAmount: number;
  totalMonthly: number;
  totalTerm: number;
}

/**
 * Calculate the full quote breakdown
 * @param productName - Name of the product
 * @param tierName - Name of the tier
 * @param basePricePerSeat - Base price per seat per month in cents
 * @param seats - Number of seats
 * @param termLength - Term length
 * @param addOns - Array of add-ons
 * @param discountPercent - Additional discount in basis points (1000 = 10%)
 * @returns Full quote calculation with line items
 */
export function calculateQuote(
  productName: string,
  tierName: string,
  basePricePerSeat: number,
  seats: number,
  termLength: TermLength,
  addOns: QuoteAddOnInput[],
  discountPercent: number = 0
): QuoteCalculationResult {
  const lineItems: QuoteLineItem[] = [];

  // Calculate base product cost
  const baseCost = calculateBaseProductCost(basePricePerSeat, seats, termLength);

  // Add base product line item (before term discount)
  lineItems.push({
    name: `${productName} - ${tierName}`,
    description: `${formatCurrency(basePricePerSeat)}/seat × ${seats} seats`,
    monthlyAmount: baseCost.monthlyTotal,
    termAmount: baseCost.monthlyTotal * TERM_MONTHS[termLength],
    type: 'base',
  });

  // Add term discount as negative line item if applicable
  if (baseCost.termDiscount > 0) {
    const discountRate = TERM_DISCOUNTS[termLength] * 100;
    lineItems.push({
      name: `${TERM_DISPLAY_NAMES[termLength]} Discount`,
      description: `${discountRate}% off for ${termLength === 'annual' ? '1 year' : '2 year'} commitment`,
      monthlyAmount: -(baseCost.monthlyTotal - baseCost.monthlyDiscounted),
      termAmount: -baseCost.termDiscount,
      type: 'discount',
    });
  }

  // Running total after base product (with term discount applied)
  let runningMonthlyTotal = baseCost.monthlyDiscounted;
  let runningTermTotal = baseCost.termTotal;

  // Calculate add-on costs
  for (const addOn of addOns) {
    const addOnCost = calculateAddOnCost(
      addOn.pricingModel,
      addOn.price,
      addOn.quantity,
      baseCost.monthlyDiscounted, // Use discounted base for percentage calculations
      termLength
    );

    lineItems.push({
      name: addOn.featureName,
      description: addOnCost.description,
      monthlyAmount: addOnCost.monthlyTotal,
      termAmount: addOnCost.termTotal,
      type: 'addon',
    });

    runningMonthlyTotal += addOnCost.monthlyTotal;
    runningTermTotal += addOnCost.termTotal;
  }

  // Calculate subtotal (before additional discount)
  const subtotalMonthly = runningMonthlyTotal;
  const subtotalTerm = runningTermTotal;

  // Calculate additional discount
  let additionalDiscountAmount = 0;
  if (discountPercent > 0) {
    const discountDecimal = basisPointsToPercent(discountPercent) / 100;
    additionalDiscountAmount = Math.round(subtotalTerm * discountDecimal);

    lineItems.push({
      name: 'Quote Discount',
      description: `${basisPointsToPercent(discountPercent)}% off`,
      monthlyAmount: -Math.round(subtotalMonthly * discountDecimal),
      termAmount: -additionalDiscountAmount,
      type: 'discount',
    });
  }

  // Calculate final totals
  const totalTerm = subtotalTerm - additionalDiscountAmount;
  const totalMonthly = subtotalMonthly - (additionalDiscountAmount / TERM_MONTHS[termLength]);

  return {
    lineItems,
    subtotalMonthly,
    subtotalTerm,
    termDiscountAmount: baseCost.termDiscount,
    additionalDiscountAmount,
    totalMonthly: Math.round(totalMonthly),
    totalTerm,
  };
}
