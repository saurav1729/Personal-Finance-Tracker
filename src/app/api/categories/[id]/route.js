import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@clerk/nextjs'

const prisma = new PrismaClient()

export async function DELETE(request, { params }) {


  const { id } = params

  try {
    const body = await request.json();
    const{userId}=body; 

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  

    const category = await prisma.category.findUnique({
      where: { id },
    })

    if (!category || category.userId !== userId) {
      return NextResponse.json({ error: 'Category not found or unauthorized' }, { status: 404 })
    }

    await prisma.transaction.deleteMany({
      where: { categoryId: id },
    })

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Category and associated transactions deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}