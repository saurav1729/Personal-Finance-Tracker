import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()
export async function GET(request) {
  const userId = request.nextUrl.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { Category: true },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
export async function POST(request) {
  const body = await request.json(); 
  const { userId } = body; 
  console.log("this is user id:",userId); 
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { category, amount, type } = body

    const transaction = await prisma.transaction.create({
      data: {
        category,
        amount,
        type,
        userId,
        Category: {
          connectOrCreate: {
            where: { name_userId: { name: category, userId } },
            create: { name: category, type, userId },
          },
        },
      },
      include: { Category: true },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
} 