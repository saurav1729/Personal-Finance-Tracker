// app/api/goals/[goalId]/allocate/route.js
// Handles adding money TO a goal (allocation) or withdrawing FROM a goal
// This is NOT a transaction — it's a balance re-allocation
// Balance = income - expenses - total_goal_allocations

import { NextResponse } from "next/server"
import dbConnect from "@/app/lib/db"
import SavingGoal from "@/app/models/SavingGoal"

export async function POST(request, { params }) {
    try {
        await dbConnect()
        const { userId, amount, note, direction = "add" } = await request.json()
        const { goalId } = params

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ error: "userId and positive amount required" }, { status: 400 })
        }

        const goal = await SavingGoal.findById(goalId)
        if (!goal || goal.userId.toString() !== userId) {
            return NextResponse.json({ error: "Goal not found or unauthorized" }, { status: 404 })
        }

        if (goal.disabled) {
            return NextResponse.json({ error: "Cannot allocate funds to a paused goal" }, { status: 400 })
        }

        const prevAmount = goal.currentAmount

        if (direction === "add") {
            goal.currentAmount = Math.min(prevAmount + Number(amount), goal.targetAmount)
        } else if (direction === "withdraw") {
            if (Number(amount) > goal.currentAmount) {
                return NextResponse.json({ error: `Cannot withdraw ₹${amount} — only ₹${goal.currentAmount} saved.` }, { status: 400 })
            }
            goal.currentAmount = prevAmount - Number(amount)
        } else {
            return NextResponse.json({ error: "direction must be 'add' or 'withdraw'" }, { status: 400 })
        }

        // Push to allocation history
        if (!goal.allocations) goal.allocations = []
        goal.allocations.push({
            amount: Number(amount),
            direction,
            note: note || (direction === "add" ? "Manual allocation" : "Withdrawal"),
            createdAt: new Date(),
        })

        await goal.save()

        const pct = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0
        const remaining = goal.targetAmount - goal.currentAmount

        return NextResponse.json({
            success: true,
            goal: {
                _id: goal._id,
                name: goal.name,
                currentAmount: goal.currentAmount,
                targetAmount: goal.targetAmount,
                percentage: Number(pct),
                remaining,
            },
            message: direction === "add"
                ? `₹${amount} allocated to "${goal.name}". Now at ₹${goal.currentAmount} (${pct}%).`
                : `₹${amount} withdrawn from "${goal.name}". Now at ₹${goal.currentAmount} (${pct}%).`,
        })
    } catch (error) {
        console.error("Allocate error:", error)
        return NextResponse.json({ error: "Failed to allocate funds" }, { status: 500 })
    }
}