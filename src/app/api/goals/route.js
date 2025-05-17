import { NextResponse } from "next/server"
import dbConnect from "@/app/lib/db"
import SavingGoal from "@/app/models/SavingGoal"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    await dbConnect()
    const goals = await SavingGoal.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(goals)
  } catch (error) {
    console.error("Error fetching savings goals:", error)
    return NextResponse.json({ error: "Failed to fetch savings goals" }, { status: 500 })
  }
}
export async function POST(request) {
  try {
    const { userId, name, targetAmount, currentAmount, deadline } = await request.json();

    if (!userId || !name || !targetAmount) {
      return NextResponse.json(
        { error: "User ID, name, and target amount are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedName = name.trim().replace(/\s+/g, " ");
    const targetAmountNum = Number(targetAmount);

    // Check for duplicate goal
    const existingGoal = await SavingGoal.findOne({
      userId,
      name: normalizedName,
      targetAmount: targetAmountNum,
    });

    if (existingGoal) {
      return NextResponse.json(
        { error: "A goal with the same name and target amount already exists." },
        { status: 409 }
      );
    }

    const newGoal = {
      userId,
      name: normalizedName,
      targetAmount: targetAmountNum,
      currentAmount: Number(currentAmount) || 0,
      deadline: deadline || null,
      disabled: false,
      createdAt: new Date().toISOString(),
    };

    await SavingGoal.insertOne(newGoal);
    console.log("Goal saved:", newGoal);

    return NextResponse.json(
      { message: "New goal added successfully", goal: newGoal },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating savings goal:", error);
    return NextResponse.json(
      { error: "Failed to create savings goal" },
      { status: 500 }
    );
  }
}
