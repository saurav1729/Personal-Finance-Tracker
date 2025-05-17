import { NextResponse } from "next/server"
import dbConnect from "@/app/lib/db"
import SavingGoal from "@/app/models/SavingGoal"


export async function PUT(request, { params }) {
  try {
    const { userId, updatedGoal } = await request.json()
    console.log(userId , updatedGoal)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await dbConnect();

    const goalId = params.goalId


    const goalToUpdate = {
      name: updatedGoal.name,
      targetAmount: Number(updatedGoal.targetAmount),
      currentAmount: Number(updatedGoal.currentAmount) || 0,
      userId,
      disabled: updatedGoal.disabled || false,
      deadline: updatedGoal.deadline || null,
    }

    const existingSavingGoal = await SavingGoal.findById(goalId);

    if (!existingSavingGoal || existingSavingGoal.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Saving goal  not found or unauthorized' }, { status: 404 });
    }

    const updated =await SavingGoal.findByIdAndUpdate(
      goalId, 
      goalToUpdate,
      { new: true }
    );
    

    console.log(updated)


    return NextResponse.json({
      message: "Savings goal updated successfully",
      updated
    }, { status: 201 })
  } catch (error) {
    console.error("Error updating savings goal:", error)
    return NextResponse.json({ error: "Failed to update savings goal" }, { status: 500 })
  }
}


export async function DELETE(request, { params }) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await dbConnect()

    const goalId = params.goalId

    const existingGoal = await SavingGoal.findById(goalId);
    console.log("existing Goal is :\n ", existingGoal);

    if (!existingGoal || existingGoal.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    await SavingGoal.findByIdAndDelete(goalId);

    return NextResponse.json({
      message: "Savingsgoal deleted successfully",
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting savings goal:", error)
    return NextResponse.json({ error: "Failed to delete savings goal" }, { status: 500 })
  }
}
