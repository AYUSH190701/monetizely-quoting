import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/quotes - List all quotes
export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        product: true,
        tier: true,
        addOns: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

// POST /api/quotes - Create a new quote
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      customerName,
      productId,
      tierId,
      seats,
      termLength,
      discountPercent,
      addOns,
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Quote name is required' }, { status: 400 });
    }
    if (!productId || !tierId) {
      return NextResponse.json({ error: 'Product and tier are required' }, { status: 400 });
    }
    if (typeof seats !== 'number' || seats < 1) {
      return NextResponse.json({ error: 'Seats must be at least 1' }, { status: 400 });
    }
    if (!['monthly', 'annual', 'two_year'].includes(termLength)) {
      return NextResponse.json({ error: 'Invalid term length' }, { status: 400 });
    }

    // Fetch product and tier to get snapshot data
    const tier = await prisma.tier.findUnique({
      where: { id: tierId },
      include: { product: true },
    });

    if (!tier || tier.productId !== productId) {
      return NextResponse.json({ error: 'Invalid product or tier' }, { status: 400 });
    }

    // Prepare add-ons data with snapshots
    const addOnsData = [];
    if (addOns && Array.isArray(addOns)) {
      for (const addOn of addOns) {
        const config = await prisma.featureTierConfig.findUnique({
          where: { id: addOn.featureTierConfigId },
          include: { feature: true },
        });

        if (!config) {
          return NextResponse.json({ error: `Invalid add-on config: ${addOn.featureTierConfigId}` }, { status: 400 });
        }

        addOnsData.push({
          featureTierConfigId: config.id,
          featureName: config.feature.name,
          pricingModel: config.pricingModel || 'fixed',
          price: config.price || 0,
          quantity: addOn.quantity || 1,
        });
      }
    }

    // Create the quote
    const quote = await prisma.quote.create({
      data: {
        name,
        customerName: customerName || null,
        productId,
        tierId,
        seats,
        termLength,
        discountPercent: discountPercent || 0,
        // Snapshot fields
        productName: tier.product.name,
        tierName: tier.name,
        basePricePerSeat: tier.basePrice,
        // Add-ons
        addOns: {
          create: addOnsData,
        },
      },
      include: {
        product: true,
        tier: true,
        addOns: true,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
