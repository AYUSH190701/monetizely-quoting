import {
  calculateBaseProductCost,
  calculateAddOnCost,
  calculateQuote,
  centsToDollars,
  dollarsToCents,
  basisPointsToPercent,
  percentToBasisPoints,
  TERM_DISCOUNTS,
  TERM_MONTHS,
} from '@/lib/pricing';

describe('Pricing Utilities', () => {
  describe('Unit conversions', () => {
    test('centsToDollars converts correctly', () => {
      expect(centsToDollars(100)).toBe(1);
      expect(centsToDollars(1000)).toBe(10);
      expect(centsToDollars(4750)).toBe(47.5);
    });

    test('dollarsToCents converts correctly', () => {
      expect(dollarsToCents(1)).toBe(100);
      expect(dollarsToCents(10)).toBe(1000);
      expect(dollarsToCents(47.5)).toBe(4750);
    });

    test('basisPointsToPercent converts correctly', () => {
      expect(basisPointsToPercent(100)).toBe(1);
      expect(basisPointsToPercent(1000)).toBe(10);
      expect(basisPointsToPercent(1500)).toBe(15);
    });

    test('percentToBasisPoints converts correctly', () => {
      expect(percentToBasisPoints(1)).toBe(100);
      expect(percentToBasisPoints(10)).toBe(1000);
      expect(percentToBasisPoints(15)).toBe(1500);
    });
  });

  describe('Term discounts', () => {
    test('monthly has 0% discount', () => {
      expect(TERM_DISCOUNTS.monthly).toBe(0);
    });

    test('annual has 15% discount', () => {
      expect(TERM_DISCOUNTS.annual).toBe(0.15);
    });

    test('two_year has 25% discount', () => {
      expect(TERM_DISCOUNTS.two_year).toBe(0.25);
    });

    test('monthly term is 1 month', () => {
      expect(TERM_MONTHS.monthly).toBe(1);
    });

    test('annual term is 12 months', () => {
      expect(TERM_MONTHS.annual).toBe(12);
    });

    test('two_year term is 24 months', () => {
      expect(TERM_MONTHS.two_year).toBe(24);
    });
  });

  describe('calculateBaseProductCost', () => {
    test('monthly term - no discount', () => {
      // $50/seat/month, 10 seats
      const result = calculateBaseProductCost(5000, 10, 'monthly');
      expect(result.monthlyTotal).toBe(50000); // $500/month
      expect(result.monthlyDiscounted).toBe(50000); // No discount
      expect(result.termTotal).toBe(50000); // 1 month
      expect(result.termDiscount).toBe(0);
    });

    test('annual term - 15% discount applied', () => {
      // $100/seat/month, 5 seats
      const result = calculateBaseProductCost(10000, 5, 'annual');
      expect(result.monthlyTotal).toBe(50000); // $500/month before discount
      expect(result.monthlyDiscounted).toBe(42500); // $425/month after 15% discount
      expect(result.termTotal).toBe(510000); // $4250 for 12 months
      expect(result.termDiscount).toBe(90000); // $900 savings over 12 months
    });

    test('two_year term - 25% discount applied', () => {
      // $200/seat/month, 3 seats
      const result = calculateBaseProductCost(20000, 3, 'two_year');
      expect(result.monthlyTotal).toBe(60000); // $600/month before discount
      expect(result.monthlyDiscounted).toBe(45000); // $450/month after 25% discount
      expect(result.termTotal).toBe(1080000); // $10,800 for 24 months
      expect(result.termDiscount).toBe(360000); // $3,600 savings over 24 months
    });

    test('single seat calculation', () => {
      // $50/seat/month, 1 seat
      const result = calculateBaseProductCost(5000, 1, 'monthly');
      expect(result.monthlyTotal).toBe(5000);
      expect(result.termTotal).toBe(5000);
    });
  });

  describe('calculateAddOnCost - Fixed pricing', () => {
    test('fixed monthly add-on - monthly term', () => {
      // $200/month fixed, monthly term
      const result = calculateAddOnCost('fixed', 20000, 1, 50000, 'monthly');
      expect(result.monthlyTotal).toBe(20000); // $200/month
      expect(result.termTotal).toBe(20000); // 1 month
      expect(result.description).toContain('$200');
    });

    test('fixed monthly add-on - annual term', () => {
      // $200/month fixed, annual term
      const result = calculateAddOnCost('fixed', 20000, 1, 50000, 'annual');
      expect(result.monthlyTotal).toBe(20000); // $200/month
      expect(result.termTotal).toBe(240000); // 12 months × $200
    });
  });

  describe('calculateAddOnCost - Per seat pricing', () => {
    test('per-seat add-on - single seat', () => {
      // $50/seat/month, 1 seat
      const result = calculateAddOnCost('per_seat', 5000, 1, 50000, 'monthly');
      expect(result.monthlyTotal).toBe(5000); // $50 × 1 seat
      expect(result.termTotal).toBe(5000); // 1 month
      expect(result.description).toContain('$50');
    });

    test('per-seat add-on - multiple seats', () => {
      // $50/seat/month, 10 seats
      const result = calculateAddOnCost('per_seat', 5000, 10, 100000, 'monthly');
      expect(result.monthlyTotal).toBe(50000); // $50 × 10 seats
      expect(result.termTotal).toBe(50000); // 1 month
      expect(result.description).toContain('10 seats');
    });

    test('per-seat add-on - annual term', () => {
      // $50/seat/month, 5 seats, annual
      const result = calculateAddOnCost('per_seat', 5000, 5, 100000, 'annual');
      expect(result.monthlyTotal).toBe(25000); // $50 × 5 = $250/month
      expect(result.termTotal).toBe(300000); // $250 × 12 months
    });
  });

  describe('calculateAddOnCost - Percentage pricing', () => {
    test('10% of product cost - monthly', () => {
      // 10% of $500/month product cost (stored as 1000 basis points)
      const result = calculateAddOnCost('percentage', 1000, 1, 50000, 'monthly');
      expect(result.monthlyTotal).toBe(5000); // 10% of $500
      expect(result.termTotal).toBe(5000); // 1 month
      expect(result.description).toContain('10%');
    });

    test('15% of product cost - annual', () => {
      // 15% of $500/month product cost (stored as 1500 basis points)
      const result = calculateAddOnCost('percentage', 1500, 1, 50000, 'annual');
      expect(result.monthlyTotal).toBe(7500); // 15% of $500
      expect(result.termTotal).toBe(90000); // $75 × 12 months
    });

    test('percentage rounds correctly', () => {
      // 10% of $333.33/month (imprecise, should round correctly)
      const result = calculateAddOnCost('percentage', 1000, 1, 33333, 'monthly');
      expect(result.monthlyTotal).toBe(3333); // Round 10% of $333.33 = $33.33
    });
  });

  describe('calculateQuote', () => {
    test('basic quote - monthly, no add-ons, no discount', () => {
      const result = calculateQuote(
        'Test Product',
        'Starter',
        5000, // $50/seat/month
        10, // 10 seats
        'monthly',
        [],
        0
      );

      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].name).toContain('Test Product');
      expect(result.lineItems[0].termAmount).toBe(50000); // $500 (5000 cents × 10 seats × 1 month)
      expect(result.totalTerm).toBe(50000);
      expect(result.totalMonthly).toBe(50000);
      expect(result.termDiscountAmount).toBe(0);
      expect(result.additionalDiscountAmount).toBe(0);
    });

    test('annual quote - term discount applied', () => {
      const result = calculateQuote(
        'Test Product',
        'Growth',
        10000, // $100/seat/month
        5, // 5 seats
        'annual',
        [],
        0
      );

      // Base: $500/month, 15% off = $425/month
      // Annual: $425 × 12 = $5100
      expect(result.lineItems).toHaveLength(2); // Base + discount line item
      expect(result.termDiscountAmount).toBe(90000); // $900 savings
      expect(result.totalTerm).toBe(510000); // $5100

      const discountItem = result.lineItems.find((item) => item.type === 'discount');
      expect(discountItem).toBeTruthy();
    });

    test('quote with fixed add-on', () => {
      const result = calculateQuote(
        'Test Product',
        'Growth',
        10000, // $100/seat/month
        5, // 5 seats
        'monthly',
        [
          {
            featureName: 'SSO',
            pricingModel: 'fixed',
            price: 20000, // $200/month fixed
            quantity: 1,
          },
        ],
        0
      );

      expect(result.lineItems).toHaveLength(2); // Base + add-on
      const addOnItem = result.lineItems.find((item) => item.type === 'addon');
      expect(addOnItem?.termAmount).toBe(20000); // $200 for 1 month
      expect(result.totalTerm).toBe(70000); // $500 + $200 = $700
    });

    test('quote with per-seat add-on', () => {
      const result = calculateQuote(
        'Test Product',
        'Growth',
        10000, // $100/seat/month
        5, // 5 seats
        'monthly',
        [
          {
            featureName: 'Advanced Analytics',
            pricingModel: 'per_seat',
            price: 2000, // $20/seat/month
            quantity: 3, // 3 seats
          },
        ],
        0
      );

      expect(result.lineItems).toHaveLength(2);
      const addOnItem = result.lineItems.find((item) => item.type === 'addon');
      expect(addOnItem?.termAmount).toBe(6000); // $20 × 3 seats = $60
      expect(result.totalTerm).toBe(56000); // $500 + $60 = $560
    });

    test('quote with percentage add-on uses discounted base price', () => {
      // Annual quote, 15% off base price
      // Base: $500/month, discounted to $425/month
      // Add-on: 10% of product = 10% of $425 = $42.50/month
      const result = calculateQuote(
        'Test Product',
        'Enterprise',
        10000, // $100/seat/month
        5, // 5 seats
        'annual',
        [
          {
            featureName: 'White Labeling',
            pricingModel: 'percentage',
            price: 1000, // 10% (1000 basis points)
            quantity: 1,
          },
        ],
        0
      );

      const addOnItem = result.lineItems.find((item) => item.type === 'addon');
      // 10% of $425 (discounted monthly) = $42.50/month = $510 for 12 months
      expect(addOnItem?.monthlyAmount).toBe(4250); // $42.50
      expect(addOnItem?.termAmount).toBe(51000); // $42.50 × 12
    });

    test('quote with additional discount applied to subtotal', () => {
      const result = calculateQuote(
        'Test Product',
        'Starter',
        5000, // $50/seat/month
        10, // 10 seats
        'monthly',
        [],
        1000 // 10% additional discount (1000 basis points)
      );

      // Base: $500/month = 50000 cents (5000 cents × 10 seats × 1 month)
      // After 10% discount: $450 = 45000 cents
      expect(result.additionalDiscountAmount).toBe(5000); // $50 discount = 5000 cents
      expect(result.totalTerm).toBe(45000); // $450 after 10% off

      const discountItem = result.lineItems.find((item) => item.type === 'discount');
      expect(discountItem).toBeTruthy();
      expect(discountItem?.termAmount).toBe(-5000); // -$50 discount = -5000 cents
    });

    test('quote with both term discount and additional discount', () => {
      // Annual: $500/month → $425/month (15% off) → $5100 for 12 months
      // Additional 10% off: $5100 × 10% = $510 discount → $4590 total
      const result = calculateQuote(
        'Test Product',
        'Growth',
        10000, // $100/seat/month
        5, // 5 seats
        'annual',
        [],
        1000 // 10% additional discount
      );

      expect(result.termDiscountAmount).toBe(90000); // $900 term discount
      expect(result.additionalDiscountAmount).toBe(51000); // 10% of $5100
      expect(result.totalTerm).toBe(459000); // $4590 final total
    });

    test('two-year term with multiple add-ons', () => {
      const result = calculateQuote(
        'Test Product',
        'Enterprise',
        15000, // $150/seat/month
        10, // 10 seats
        'two_year',
        [
          {
            featureName: 'SSO',
            pricingModel: 'fixed',
            price: 25000, // $250/month fixed
            quantity: 1,
          },
          {
            featureName: 'Priority Support',
            pricingModel: 'per_seat',
            price: 1000, // $10/seat/month
            quantity: 10,
          },
        ],
        0
      );

      // Base: $1500/month, 25% off = $1125/month × 24 = $27,000
      // Fixed add-on: $250 × 24 = $6,000
      // Per-seat add-on: $10 × 10 × 24 = $2,400
      // Total = $27,000 + $6,000 + $2,400 = $35,400

      // Base monthly total: $1500/month = 150000 cents
      // Discounted monthly: $1125/month = 112500 cents
      // termDiscount = ($1500 - $1125) × 24 = $375 × 24 = $9,000 = 900000 cents
      expect(result.termDiscountAmount).toBe(900000); // $9,000
      expect(result.totalTerm).toBe(3540000); // $35,400
    });
  });
});
