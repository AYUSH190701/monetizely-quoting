import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/products/[id]/tiers - List all tiers for a product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tiers = await prisma.tier.findMany({
      where: { productId: id },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json(tiers);
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
  }
}

// POST /api/products/[id]/tiers - Create a new tier for a product
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, basePrice, displayOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (typeof basePrice !== 'number' || basePrice < 0) {
      return NextResponse.json({ error: 'Base price must be a non-negative number' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const tier = await prisma.tier.create({
      data: {
        name,
        description: description || null,
        basePrice: Math.round(basePrice), // Ensure it's an integer (cents)
        displayOrder: displayOrder ?? 0,
        productId: id,
      },
    });

    return NextResponse.json(tier, { status: 201 });
  } catch (error) {
    console.error('Error creating tier:', error);
    return NextResponse.json({ error: 'Failed to create tier' }, { status: 500 });
  }
}
