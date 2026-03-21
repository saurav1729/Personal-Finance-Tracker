import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Transaction from '@/app/models/Transaction';

export async function GET(request) {
  await dbConnect();
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentDay = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // 1. Current month expenses so far
    const expenses = await Transaction.find({
      userId,
      type: 'expense',
      createdAt: { $gte: firstDay, $lte: now }
    });

    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Average daily spend
    const dailyBurnRate = currentDay > 0 ? totalSpent / currentDay : 0;
    
    // Projected EoM
    const projectedEoMSpend = dailyBurnRate * lastDay;

    return NextResponse.json({
      totalSpent,
      currentDay,
      dailyBurnRate: Number(dailyBurnRate.toFixed(2)),
      projectedEoMSpend: Number(projectedEoMSpend.toFixed(2))
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
