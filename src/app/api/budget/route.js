import dbConnect from "@/app/lib/db";
import Budget from "@/app/models/Budget";
import { NextResponse } from "next/server";


export async function GET(request) {
    await dbConnect(); 
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const budgets = await Budget.find({ userId });
    return NextResponse.json(budgets);
}



export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const { userId, category, amount } = body;
    console.log("Received:", userId, category, amount);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    const newBudget = new Budget({
      userId,
      category,
      amount,
      spent: "0",
      status: "enabled", // Ensure status is set
    })

    await newBudget.save()
    console.log("Budget saved:", newBudget)

    return NextResponse.json(newBudget, { status: 201 })

  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}




