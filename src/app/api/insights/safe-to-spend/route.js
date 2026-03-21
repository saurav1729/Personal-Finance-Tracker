import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Transaction from '@/app/models/Transaction';
import Budget from '@/app/models/Budget';

export async function GET(request) {
  await dbConnect();
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const remainingDays = lastDay.getDate() - now.getDate() + 1; // +1 to include today

    // 1. Get current month income
    const incomeTransactions = await Transaction.find({
      userId,
      type: 'income',
      createdAt: { $gte: firstDay, $lte: lastDay }
    });
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

    // 2. Get active budgets limit
    const activeBudgets = await Budget.find({ userId, status: 'enabled' });
    const totalBudgeted = activeBudgets.reduce((sum, b) => sum + b.amount, 0);
    
    // 3. Safe to Spend
    const unallocated = totalIncome - totalBudgeted;
    const safeToSpendDaily = unallocated > 0 ? (unallocated / remainingDays).toFixed(2) : 0;

    return NextResponse.json({
      totalIncome,
      totalBudgeted,
      unallocated,
      remainingDays,
      safeToSpendDaily: Number(safeToSpendDaily),
      status: unallocated > 0 ? 'healthy' : 'over-budgeted'
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
