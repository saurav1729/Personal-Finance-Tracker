// app/api/transactions/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Transaction from '@/app/models/Transaction';
import Category from '@/app/models/Category';
import Budget from '@/app/models/Budget';

export async function GET(request) {
  await dbConnect();

  const userId = request.nextUrl.searchParams.get('userId');
  const page = parseInt(request.nextUrl.searchParams.get('page')) || 1;
  const limit = parseInt(request.nextUrl.searchParams.get('limit')) || 0;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const skip = (page - 1) * limit;
    const query = Transaction.find({ userId }).sort({ createdAt: -1 }).populate('categoryId');
    
    if (limit > 0) {
      query.skip(skip).limit(limit);
    }
    
    const transactions = await query;

    // Backward compatibility: If no limit is requested, return flat array to avoid breaking the UI right away
    if (limit === 0) {
      return NextResponse.json(transactions);
    }

    const totalCount = await Transaction.countDocuments({ userId });
    return NextResponse.json({
      transactions,
      meta: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect()

  const body = await request.json()
  const { category, amount, type, userId, description } = body
  console.log("Request body:", body)

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find or create the category
    let existingCategory = await Category.findOne({ name: category, userId })
    if (!existingCategory) {
      existingCategory = await Category.create({ name: category, type, userId })
    }

    // Create the transaction with explicit fields
    const transactionData = {
      userId,
      category,
      amount,
      description: description || "No description provided", // Provide a default if missing
      type,
      categoryId: existingCategory._id,
    }

    console.log("Creating transaction with fields:", transactionData)
    const newTransaction = await Transaction.create(transactionData)

    console.log("Transaction created in DB:", newTransaction)

    if (type === "expense") {
      const budgets = await Budget.find({
        userId,
        category: category.trim(),
      })

      console.log(`Found ${budgets.length} budgets for category "${category.trim()}"`)

      await Promise.all(
        budgets.map(async (budget) => {
          const currentSpent = Number.parseFloat(budget.spent || "0")
          const newSpent = (currentSpent + Number.parseFloat(amount)).toString()
          console.log(`Updating budget ${budget._id}: ${currentSpent} + ${amount} = ${newSpent}`)

          budget.spent = newSpent

          if (!budget.status) {
            budget.status = "enabled"
            console.log(`Setting missing status to "enabled" for budget ${budget._id}`)
          }

          await budget.save()
        }),
      )

     
      const budgetsWithoutStatus = await Budget.find({
        userId,
        $or: [{ status: { $exists: false } }, { status: null }],
      })

      if (budgetsWithoutStatus.length > 0) {
        console.log(`Found ${budgetsWithoutStatus.length} budgets without status, updating them...`)
        await Promise.all(
          budgetsWithoutStatus.map(async (budget) => {
            budget.status = "enabled"
            await budget.save()
          }),
        )
      }
    }

    // Fetch the populated transaction to return
    const populatedTransaction = await Transaction.findById(newTransaction._id).populate("categoryId")
    console.log("Populated transaction to return:", populatedTransaction)

    return NextResponse.json(populatedTransaction, { status: 201 })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}
