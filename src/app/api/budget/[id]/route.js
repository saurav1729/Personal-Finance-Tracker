import dbConnect from '@/app/lib/db';
import Budget from '@/app/models/Budget';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  console.log("request inside delete budget :")
  await dbConnect();

  const { id } = params;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingBudget = await Budget.findById(id);
    console.log("existing Budget is :\n ", existingBudget);

    if (!existingBudget || existingBudget.userId !== userId) {
      return NextResponse.json({ error: 'Budget not found or unauthorized' }, { status: 404 });
    }

    // // Delete all related transactions
    // await Transaction.deleteMany({ categoryId: id });

    // // Delete the budget
    await Budget.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Budget deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  await dbConnect();

  const { id } = params;
  try {
    const body = await request.json();
    const { userId, updatedBudget } = body;
    const { category, amount } = updatedBudget;
    console.log("body is", userId, updatedBudget, id)

    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const existingBudget = await Budget.findById(id);
    if (!existingBudget || existingBudget.userId.toString() !== userId) {
      return NextResponse.json({ error: "Budget not found or unauthorized" }, { status: 404 });
    }
    const updated = await Budget.findByIdAndUpdate(
      id,
      { category, amount, userId, spent: existingBudget.spent },
      { new: true }
    );
    console.log(updated)
    const budgets = await Budget.find({ userId });
    return NextResponse.json(
      { message: "Budget updated", updatedBudgets: budgets },
      { status: 201 }
    );
  } catch (err) {

  }
}
