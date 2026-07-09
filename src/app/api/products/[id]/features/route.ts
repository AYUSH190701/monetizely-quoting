import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/products/[id]/features - List all features for a product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const features = await prisma.feature.findMany({
      where: { productId: id },
      include: {
        tierConfigs: {
          include: {
            tier: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

// POST /api/products/[id]/features - Create a new feature for a product
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, tierConfigs } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: { tiers: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create feature with tier configurations
    const feature = await prisma.feature.create({
      data: {
        name,
        description: description || null,
        productId: id,
        tierConfigs: tierConfigs && tierConfigs.length > 0
          ? {
              create: tierConfigs.map((config: {
                tierId: string;
                availability: string;
                pricingModel?: string;
                price?: number;
              }) => ({
                tierId: config.tierId,
                availability: config.availability,
                pricingModel: config.pricingModel || null,
                price: config.price !== undefined ? Math.round(config.price) : null,
              })),
            }
          : undefined,
      },
      include: {
        tierConfigs: {
          include: {
            tier: true,
          },
        },
      },
    });

    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 });
  }
}
