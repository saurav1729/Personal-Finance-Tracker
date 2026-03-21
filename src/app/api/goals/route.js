// app/api/goals/route.js
import { NextResponse } from "next/server"
import dbConnect from "@/app/lib/db"
import SavingGoal from "@/app/models/SavingGoal"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 })

    await dbConnect()
    const goals = await SavingGoal.find({ userId }).sort({ createdAt: -1 })
    return NextResponse.json(goals)
  } catch (error) {
    console.error("fetchGoals error:", error)
    return NextResponse.json({ error: "Failed to fetch savings goals" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId, name, targetAmount, currentAmount, deadline } = await request.json()

    if (!userId || !name || !targetAmount) {
      return NextResponse.json({ error: "userId, name, and targetAmount are required" }, { status: 400 })
    }

    await dbConnect()

    const normalizedName = name.trim().replace(/\s+/g, " ")
    const targetAmountNum = Number(targetAmount)

    // Duplicate check — only block exact same name+target combo
    const existing = await SavingGoal.findOne({ userId, name: normalizedName, targetAmount: targetAmountNum })
    if (existing) {
      return NextResponse.json({ error: "A goal with the same name and target already exists." }, { status: 409 })
    }

    // ✅ Use .create() not .insertOne() — Mongoose method
    const goal = await SavingGoal.create({
      userId,
      name: normalizedName,
      targetAmount: targetAmountNum,
      currentAmount: Number(currentAmount) || 0,
      deadline: deadline ? new Date(deadline) : null,
      disabled: false,
      allocations: [],
    })

    return NextResponse.json({ message: "Goal created successfully", goal }, { status: 201 })
  } catch (error) {
    console.error("createGoal error:", error)
    return NextResponse.json({ error: "Failed to create savings goal" }, { status: 500 })
  }
}