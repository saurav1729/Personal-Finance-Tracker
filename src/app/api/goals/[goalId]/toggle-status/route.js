import { NextResponse } from "next/server"
import dbConnect from "@/app/lib/db"
import SavingGoal from "@/app/models/SavingGoal"


export async function POST(request, { params }) {
  await dbConnect();
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const goalId = params.goalId
    const currentGoal = await SavingGoal.findById(goalId);
    if (!currentGoal || currentGoal.userId.toString() !== userId){
      return NextResponse.json({ error: "Savings goal not found or you don't have permission" }, { status: 404 })
    }

   
    currentGoal.disabled = !currentGoal.disabled; 
    await currentGoal.save(); 
    console.log("goal after", currentGoal);

    return NextResponse.json({
      message: `Savings goal toggle successfully`,
      updatedGoal:currentGoal, 
    })
  } catch (error) {
    console.error("Error toggling savings goal status:", error)
    return NextResponse.json({ error: "Failed to toggle savings goal status" }, { status: 500 })
  }
}
