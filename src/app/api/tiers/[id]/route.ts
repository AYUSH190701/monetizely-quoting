import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// PUT /api/tiers/[id] - Update a tier
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, basePrice, displayOrder } = body;

    const tier = await prisma.tier.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(typeof basePrice === 'number' && { basePrice: Math.round(basePrice) }),
        ...(typeof displayOrder === 'number' && { displayOrder }),
      },
    });

    return NextResponse.json(tier);
  } catch (error) {
    console.error('Error updating tier:', error);
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
  }
}
