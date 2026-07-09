import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/products - List all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        tiers: {
          orderBy: { displayOrder: 'asc' },
          include: {
            featureConfigs: {
              include: {
                feature: true,
              },
            },
          },
        },
        features: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Create a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
