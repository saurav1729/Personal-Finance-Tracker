import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const categories = await prisma.category.findMany();
  return NextResponse.json(categories);
}

export async function POST(request) {
  const body = await request.json();
  const { name, type } = body;

  const category = await prisma.category.create({
    data: {
      name,
      type,
    },
  });

  return NextResponse.json(category);
}
