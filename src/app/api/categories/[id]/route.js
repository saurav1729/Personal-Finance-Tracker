// app/api/categories/[id]/route.js
import dbConnect from '@/lib/mongoose';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  await dbConnect(); // Ensure DB is connected

  const { id } = params;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = await Category.findById(id);

    if (!category || category.userId !== userId) {
      return NextResponse.json({ error: 'Category not found or unauthorized' }, { status: 404 });
    }

    // Delete all related transactions
    await Transaction.deleteMany({ categoryId: id });

    // Delete the category
    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Category and associated transactions deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
