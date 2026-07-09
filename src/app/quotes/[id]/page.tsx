import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import DownloadButton from './DownloadButton';
import {
  formatCurrency,
  TERM_DISCOUNTS,
  TERM_MONTHS,
  TermLength,
  PricingModel,
  basisPointsToPercent,
} from '@/lib/pricing';

interface QuoteViewPageProps {
  params: Promise<{ id: string }>;
}

function termLengthLabel(termLength: TermLength): string {
  const months = TERM_MONTHS[termLength];
  const discount = TERM_DISCOUNTS[termLength];
  if (termLength === 'monthly') return 'Monthly';
  const pct = Math.round(discount * 100);
  return `${termLength === 'annual' ? 'Annual' : '2-Year'} (${months} months, ${pct}% discount applies to per-seat price)`;
}

function buildLineItems(
  productName: string,
  tierName: string,
  basePricePerSeat: number,
  seats: number,
  termLength: TermLength,
  addOns: { featureName: string; pricingModel: PricingModel; price: number; quantity: number }[],
  discountPercent: number,
) {
  const months = TERM_MONTHS[termLength];
  const discountRate = TERM_DISCOUNTS[termLength];
  const items: { name: string; calculation: string; notes: string; amount: number; isDiscount?: boolean }[] = [];

  // Base product
  const baseMonthlyFull = basePricePerSeat * seats;
  const baseMonthlyDiscounted = Math.round(baseMonthlyFull * (1 - discountRate));
  const baseTermTotal = baseMonthlyDiscounted * months;

  let baseCalc: string;
  if (discountRate > 0) {
    const pct = Math.round(discountRate * 100);
    const label = termLength === 'annual' ? 'annual' : '2-year';
    baseCalc = `${seats} seats × ${formatCurrency(basePricePerSeat)}/seat/month × ${months} months × (1 − ${pct}% ${label} discount)`;
  } else {
    baseCalc = `${seats} seats × ${formatCurrency(basePricePerSeat)}/seat/month × ${months} months`;
  }

  items.push({
    name: `${productName} – ${tierName} tier`,
    calculation: baseCalc,
    notes: 'Base product cost',
    amount: baseTermTotal,
  });

  // Add-ons
  for (const addOn of addOns) {
    let amount: number;
    let calculation: string;
    let notes: string;

    if (addOn.pricingModel === 'fixed') {
      amount = addOn.price * months;
      calculation = `${formatCurrency(addOn.price)}/month × ${months} months`;
      notes = 'Fixed monthly add-on price';
    } else if (addOn.pricingModel === 'per_seat') {
      amount = addOn.price * addOn.quantity * months;
      calculation = `${addOn.quantity} seat${addOn.quantity !== 1 ? 's' : ''} × ${formatCurrency(addOn.price)}/seat/month × ${months} months`;
      notes =
        addOn.quantity !== seats
          ? `Per-seat add-on. The customer chose ${addOn.quantity} seat${addOn.quantity !== 1 ? 's' : ''} of ${addOn.featureName} even though the product has ${seats} seats — these are independent quantities.`
          : 'Per-seat add-on';
    } else {
      const pct = basisPointsToPercent(addOn.price);
      amount = Math.round(baseMonthlyDiscounted * (pct / 100)) * months;
      calculation = `${pct}% of ${formatCurrency(baseMonthlyDiscounted)}/month × ${months} months`;
      notes = 'Percentage-based add-on (applied to discounted base price)';
    }

    items.push({ name: `Add-on: ${addOn.featureName}`, calculation, notes, amount });
  }

  // Additional discount
  if (discountPercent > 0) {
    const pct = basisPointsToPercent(discountPercent);
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const discountAmount = Math.round(subtotal * (pct / 100));
    items.push({
      name: `Quote Discount (${pct}%)`,
      calculation: `${pct}% off subtotal of ${formatCurrency(subtotal)}`,
      notes: 'Additional negotiated discount applied to full quote',
      amount: -discountAmount,
      isDiscount: true,
    });
  }

  return items;
}

export default async function QuoteViewPage({ params }: QuoteViewPageProps) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      addOns: true,
      tier: {
        include: {
          featureConfigs: {
            where: { availability: 'included' },
            include: { feature: true },
          },
        },
      },
    },
  });

  if (!quote) notFound();

  const termLength = quote.termLength as TermLength;
  const addOns = quote.addOns.map((a) => ({
    featureName: a.featureName,
    pricingModel: a.pricingModel as PricingModel,
    price: a.price,
    quantity: a.quantity,
  }));

  const lineItems = buildLineItems(
    quote.productName,
    quote.tierName,
    quote.basePricePerSeat,
    quote.seats,
    termLength,
    addOns,
    quote.discountPercent,
  );

  const total = lineItems.reduce((s, i) => s + i.amount, 0);
  const includedFeatures = quote.tier?.featureConfigs.map((fc) => fc.feature.name) ?? [];

  const createdAt = new Date(quote.createdAt);
  const validUntil = new Date(createdAt);
  validUntil.setDate(validUntil.getDate() + 30);
  const dateFormat: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:min-h-0 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none">

        {/* Toolbar — hidden in print */}
        <div className="flex justify-end gap-2 px-8 pt-6 print:hidden">
          <DownloadButton quoteName={quote.name} />
        </div>

        <div className="px-8 pb-10 print:px-6 print:pb-6">

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-6 print:text-xl print:mb-4">
            Quote: {quote.name}
          </h1>

          {/* Quote Details */}
          <section className="mb-6 print-section">
            <h2 className="text-base font-bold text-[#1a5276] border-b border-[#1a5276] pb-1 mb-3 print:text-sm">
              Quote details
            </h2>
            <table className="w-full text-sm print:text-xs">
              <tbody>
                {quote.customerName && (
                  <tr>
                    <td className="py-1 font-semibold w-40 text-slate-700">Customer:</td>
                    <td className="py-1 text-slate-800">{quote.customerName}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 font-semibold w-40 text-slate-700">Quote name:</td>
                  <td className="py-1 text-slate-800">{quote.name}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold text-slate-700">Quote date:</td>
                  <td className="py-1 text-slate-800">{createdAt.toLocaleDateString('en-US', dateFormat)}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold text-slate-700">Valid until:</td>
                  <td className="py-1 text-slate-800">{validUntil.toLocaleDateString('en-US', dateFormat)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* What is being purchased */}
          <section className="mb-6 print-section">
            <h2 className="text-base font-bold text-[#1a5276] border-b border-[#1a5276] pb-1 mb-3 print:text-sm">
              What is being purchased
            </h2>
            <table className="w-full text-sm print:text-xs">
              <tbody>
                <tr>
                  <td className="py-1 font-semibold w-40 text-slate-700">Product:</td>
                  <td className="py-1 text-slate-800">{quote.productName}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold text-slate-700">Tier:</td>
                  <td className="py-1 text-slate-800">{quote.tierName}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold text-slate-700">Seats:</td>
                  <td className="py-1 text-slate-800">{quote.seats}</td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold text-slate-700">Term length:</td>
                  <td className="py-1 text-slate-800">{termLengthLabel(termLength)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Included Features */}
          {includedFeatures.length > 0 && (
            <section className="mb-6 print-section">
              <h2 className="text-base font-bold text-[#1a5276] border-b border-[#1a5276] pb-1 mb-3 print:text-sm">
                Included features
              </h2>
              <ul className="text-sm print:text-xs space-y-1">
                {includedFeatures.map((name) => (
                  <li key={name} className="flex items-center gap-2 text-slate-700">
                    <span className="text-green-600 font-bold">✓</span>
                    {name} <span className="text-slate-400 text-xs">(included in {quote.tierName} tier)</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Cost Breakdown */}
          <section className="mb-6 print-section">
            <h2 className="text-base font-bold text-[#1a5276] border-b border-[#1a5276] pb-1 mb-3 print:text-sm">
              Cost breakdown
            </h2>
            <table className="w-full text-sm border-collapse print:text-xs">
              <thead>
                <tr className="bg-[#1a3a5c] text-white">
                  <th className="text-left px-3 py-2 font-semibold w-[22%]">Line item</th>
                  <th className="text-left px-3 py-2 font-semibold w-[38%]">How it was calculated</th>
                  <th className="text-left px-3 py-2 font-semibold w-[28%]">Notes</th>
                  <th className="text-right px-3 py-2 font-semibold w-[12%]">Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-slate-200 align-top ${item.isDiscount ? 'text-green-700' : ''} ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}
                  >
                    <td className="px-3 py-2 font-medium">{item.name}</td>
                    <td className="px-3 py-2 text-slate-600">{item.calculation}</td>
                    <td className="px-3 py-2 text-slate-500">{item.notes}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {item.isDiscount ? `−${formatCurrency(Math.abs(item.amount))}` : formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-[#1a3a5c] text-white font-bold">
                  <td className="px-3 py-2" colSpan={3}>TOTAL</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(total)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Footer notes */}
          <section className="print-section text-xs text-slate-500 space-y-1 border-t border-slate-200 pt-4 print:pt-3">
            <p>• This quote is valid for 30 days from the date of creation.</p>
            <p>• All prices are in USD and do not include applicable taxes.</p>
            {addOns.some(a => a.pricingModel === 'per_seat' && a.quantity !== quote.seats) && (
              <p>• Per-seat add-on quantities are independent from the product seat count and reflect only the seats selected for that add-on.</p>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: QuoteViewPageProps) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { name: true, customerName: true },
  });
  if (!quote) return { title: 'Quote Not Found' };
  return {
    title: `Quote: ${quote.name}`,
    description: quote.customerName ? `Quote for ${quote.customerName}` : 'View quote details',
  };
}
