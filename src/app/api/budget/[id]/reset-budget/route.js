import dbConnect from "@/app/lib/db";
import Budget from "@/app/models/Budget";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
    await dbConnect();
  
    const { id } = params;
  
    try {
      const body = await request.json();
      const { userId } = body;
  
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const budget = await Budget.findById(id);
      console.log("budget before", budget); 
  
      if (!budget || budget.userId.toString() !== userId) {
        return NextResponse.json({ error: 'Budget not found or unauthorized' }, { status: 404 });
      }
  
      // Toggle status
      budget.spent = '0.0';
      await budget.save();
      console.log("budget after ", budget); 
  
      return NextResponse.json(
        { message: 'Budget is reseted', updatedBudget: budget },
        { status: 200 }
      );
    } catch (err) {
      console.error('Error toggling budget status:', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  