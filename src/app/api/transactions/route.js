import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(transactions);
}

export async function POST(request) {
  const body = await request.json();
  const { category, amount, type } = body;

  const transaction = await prisma.transaction.create({
    data: {
      category,
      amount,
      type,
    },
  });

  return NextResponse.json(transaction);
}
