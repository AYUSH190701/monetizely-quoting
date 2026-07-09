import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// PUT /api/features/[id] - Update a feature
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, tierConfigs } = body;

    // Update feature basic info
    const feature = await prisma.feature.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    // If tier configs are provided, update them
    if (tierConfigs && Array.isArray(tierConfigs)) {
      for (const config of tierConfigs) {
        await prisma.featureTierConfig.upsert({
          where: {
            featureId_tierId: {
              featureId: id,
              tierId: config.tierId,
            },
          },
          update: {
            availability: config.availability,
            pricingModel: config.pricingModel || null,
            price: config.price !== undefined ? Math.round(config.price) : null,
          },
          create: {
            featureId: id,
            tierId: config.tierId,
            availability: config.availability,
            pricingModel: config.pricingModel || null,
            price: config.price !== undefined ? Math.round(config.price) : null,
          },
        });
      }
    }

    // Fetch updated feature with configs
    const updatedFeature = await prisma.feature.findUnique({
      where: { id },
      include: {
        tierConfigs: {
          include: {
            tier: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFeature);
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
  }
}

// GET /api/features/[id] - Get a feature with its tier configs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        tierConfigs: {
          include: {
            tier: true,
          },
        },
      },
    });

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json(feature);
  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json({ error: 'Failed to fetch feature' }, { status: 500 });
  }
}
