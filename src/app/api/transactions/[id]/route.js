// app/api/transactions/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Transaction from '@/app/models/Transaction';

export async function DELETE(request, { params }) {
  await dbConnect();

  const { id } = params;
  const body = await request.json();
  const { userId } = body;
  console.log("id, body, userId", id, body, userId)

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const transaction = await Transaction.findById(id);

    if (!transaction || transaction.userId !== userId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await Transaction.deleteOne({ _id: id });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
