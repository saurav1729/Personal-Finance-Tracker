import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@clerk/nextjs'

const prisma = new PrismaClient()

export async function DELETE(request, { params }) {
    const body=await request.json(); 
  const { userId } = body; 
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  const transaction = await prisma.transaction.findUnique({
    where: { id },
  })

  if (!transaction || transaction.userId !== userId) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  await prisma.transaction.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Transaction deleted successfully' })
}