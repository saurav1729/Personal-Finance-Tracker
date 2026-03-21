import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Transaction from '@/app/models/Transaction';

export async function GET(request) {
  await dbConnect();
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent expenses
    const recentExpenses = await Transaction.find({
      userId,
      type: 'expense',
      createdAt: { $gte: thirtyDaysAgo }
    }).populate('categoryId');

    // Group by category to find averages
    const categoryStats = {};
    recentExpenses.forEach(t => {
      const cat = t.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, count: 0, transactions: [] };
      }
      categoryStats[cat].total += t.amount;
      categoryStats[cat].count += 1;
      categoryStats[cat].transactions.push(t);
    });

    const anomalies = [];

    // Find anomalies (amount > 2x the average for that category, and amount > $50)
    Object.keys(categoryStats).forEach(cat => {
      const stats = categoryStats[cat];
      if (stats.count < 3) return; // Need at least 3 transactions to establish a baseline

      const average = stats.total / stats.count;
      
      stats.transactions.forEach(t => {
        if (t.amount > average * 2 && t.amount > 50) {
          anomalies.push({
            transactionId: t._id,
            category: cat,
            merchant: t.merchant || 'Unknown',
            description: t.description,
            amount: t.amount,
            date: t.createdAt,
            averageForCategory: Number(average.toFixed(2)),
            reason: `Amount is more than double your typical spend in ${cat}`
          });
        }
      });
    });

    return NextResponse.json({ anomalies });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
