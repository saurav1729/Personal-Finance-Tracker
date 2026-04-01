// app/lib/agents/tools.js
// All tools use userId-baked-in factory pattern.
// userId is captured in closure — NOT passed as a schema param.
// This eliminates the LLM needing to pass userId and removes schema mismatch errors.

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import dbConnect from "@/app/lib/db";
import Transaction from "@/app/models/Transaction";
import Budget from "@/app/models/Budget";
import SavingsGoal from "@/app/models/SavingGoal";
import Category from "@/app/models/Category";

// ─── Tool 1: Safe-to-Spend ─────────────────────────────────────────────────────
export const build_getSafeToSpendTool = (closureUserId) => tool(
  async (args) => {
    const userId = args?.userId || closureUserId;
    try {
      await dbConnect();
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const remainingDays = lastDay.getDate() - now.getDate() + 1;
      const daysPassed = now.getDate();

      const [incTx, expTx, activeBudgets, goals] = await Promise.all([
        Transaction.find({ userId, type: "income", createdAt: { $gte: firstDay } }),
        Transaction.find({ userId, type: "expense", createdAt: { $gte: firstDay } }),
        Budget.find({ userId, status: "enabled" }),
        SavingsGoal.find({ userId, disabled: { $ne: true } }),
      ]);

      const totalIncome = incTx.reduce((s, t) => s + t.amount, 0);
      const totalSpent = expTx.reduce((s, t) => s + t.amount, 0);
      const totalBudgeted = activeBudgets.reduce((s, b) => s + b.amount, 0);
      const totalGoalAllocations = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);

      // Available balance = income − expenses − money locked in goals
      const remaining = totalIncome - totalSpent - totalGoalAllocations;
      const safeDaily = remaining > 0 ? (remaining / remainingDays).toFixed(2) : 0;
      const burnRate = daysPassed > 0 ? (totalSpent / daysPassed).toFixed(2) : 0;
      const healthScore = totalIncome > 0
        ? Math.max(0, Math.min(100, Math.round(((totalIncome - totalSpent) / totalIncome) * 100)))
        : 0;

      return JSON.stringify({
        totalIncome, totalSpent, totalBudgeted, totalGoalAllocations,
        unallocated: totalIncome - totalBudgeted,
        remaining, safeDailyLimit: Number(safeDaily),
        dailyBurnRate: Number(burnRate),
        remainingDaysInMonth: remainingDays, healthScore,
        note: totalGoalAllocations > 0 ? `₹${totalGoalAllocations} is locked in savings goals.` : undefined,
      });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "get_safe_to_spend",
    description: "Gets balance, safe-to-spend limit, burn rate, and health score for this month. Use for: balance, income, 'how much left', daily limit, health score.",
    schema: z.object({ userId: z.string().describe("User ID") }),
  }
);

// ─── Tool 2: Anomalies ─────────────────────────────────────────────────────────
export const build_getAnomaliesTool = (closureUserId) => tool(
  async (args) => {
    const userId = args?.userId || closureUserId;
    try {
      await dbConnect();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const expenses = await Transaction.find({ userId, type: "expense", createdAt: { $gte: thirtyDaysAgo } });

      const catStats = {};
      expenses.forEach(t => {
        if (!catStats[t.category]) catStats[t.category] = { total: 0, count: 0, txs: [] };
        catStats[t.category].total += t.amount;
        catStats[t.category].count++;
        catStats[t.category].txs.push(t);
      });

      const anomalies = [];
      for (const [cat, stats] of Object.entries(catStats)) {
        if (stats.count >= 2) {
          const avg = stats.total / stats.count;
          stats.txs.forEach(t => {
            if (t.amount > avg * 1.8 && t.amount > 30)
              anomalies.push({
                merchant: t.merchant || t.description || "Unknown",
                amount: t.amount, category: cat,
                averageInCategory: Number(avg.toFixed(2)),
                overspendBy: Number((t.amount - avg).toFixed(2)),
                date: t.createdAt.toISOString().split("T")[0],
              });
          });
        }
      }
      anomalies.sort((a, b) => b.overspendBy - a.overspendBy);
      return JSON.stringify({ anomalousTransactions: anomalies.slice(0, 5), totalFound: anomalies.length });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "get_recent_anomalies",
    description: "Detects unusual spending spikes (1.8x+ category average) in last 30 days. Use for: anomalies, unusual spending, money leaks.",
    schema: z.object({ userId: z.string().describe("User ID") }),
  }
);

// ─── Tool 3: Spending Summary ──────────────────────────────────────────────────
export const build_getSpendingSummaryTool = (closureUserId) => tool(
  async (args) => {
    const { period, userId: argsUserId } = args || {};
    const userId = argsUserId || closureUserId;
    try {
      await dbConnect();
      const now = new Date();
      let startDate;
      if (period === "week") { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
      else if (period === "month") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      else { startDate = new Date(now); startDate.setDate(now.getDate() - 30); }

      const [expenses, income] = await Promise.all([
        Transaction.find({ userId, type: "expense", createdAt: { $gte: startDate } }),
        Transaction.find({ userId, type: "income", createdAt: { $gte: startDate } }),
      ]);

      const byCategory = {};
      let totalSpent = 0;
      expenses.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        totalSpent += t.amount;
      });
      const totalIncome = income.reduce((s, t) => s + t.amount, 0);
      const sorted = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => ({
          category: cat, amount: amt,
          percentage: totalSpent > 0 ? Number(((amt / totalSpent) * 100).toFixed(1)) : 0,
        }));

      return JSON.stringify({
        period, totalSpent, totalIncome,
        netSavings: totalIncome - totalSpent,
        savingsRate: totalIncome > 0 ? Number(((1 - totalSpent / totalIncome) * 100).toFixed(1)) : 0,
        transactionCount: expenses.length,
        topCategories: sorted.slice(0, 6),
        biggestDrain: sorted[0] || null,
      });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "get_spending_summary",
    description: "Spending breakdown by category with percentages. Use for: spending breakdown, where money went, top categories, which category most, spending more.",
    schema: z.object({
      userId: z.string().describe("User ID"),
      period: z.enum(["week", "month", "30days"]).describe("Time period for summary"),
    }),
  }
);

// ─── Tool 4: Burn Rate ─────────────────────────────────────────────────────────
export const build_getBurnRateTool = (closureUserId) => tool(
  async (args) => {
    const userId = args?.userId || closureUserId;
    try {
      await dbConnect();
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const currentDay = now.getDate();
      const expenses = await Transaction.find({ userId, type: "expense", createdAt: { $gte: firstDay, $lte: now } });
      const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
      const dailyBurnRate = currentDay > 0 ? totalSpent / currentDay : 0;
      return JSON.stringify({
        totalSpent, totalSpentThisMonth: totalSpent,
        dailyBurnRate: Number(dailyBurnRate.toFixed(2)),
        projectedEoMSpend: Number((dailyBurnRate * lastDay.getDate()).toFixed(2)),
        daysElapsed: currentDay,
        remainingDays: lastDay.getDate() - currentDay,
      });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "get_burn_rate",
    description: "Daily spending rate and projected month-end spend. Use for: burn rate, spending pace.",
    schema: z.object({ userId: z.string().describe("User ID") }),
  }
);

// ─── Tool 5: Add Transaction ───────────────────────────────────────────────────
export const build_addTransactionTool = (closureUserId) => tool(
  async (args) => {
    const { amount, merchant, description, category, type, userId: argsUserId } = args || {};
    const userId = argsUserId || closureUserId;
    try {
      await dbConnect();

      // Check if category exists with a DIFFERENT type → return conflict for user to resolve
      const existingCat = await Category.findOne({
        name: { $regex: new RegExp(`^${category}$`, "i") }, userId,
      });
      if (existingCat && existingCat.type !== type) {
        return JSON.stringify({
          conflict: true,
          existingType: existingCat.type,
          requestedType: type,
          category: existingCat.name,
          message: `Category "${existingCat.name}" already exists as ${existingCat.type}. Did you mean to log this as ${existingCat.type} instead? Or create a new "${category}" category under ${type}?`,
          options: [
            `Log ₹${amount} as ${existingCat.type} under existing "${existingCat.name}" category`,
            `Create a new "${category}" category under ${type} and log ₹${amount} there`,
          ],
        });
      }

      let catDoc = existingCat || await Category.findOne({ name: category, userId });
      if (!catDoc) catDoc = await Category.create({ name: category, type, userId });

      // Update budget spent amount if expense
      if (type === "expense") {
        const budgets = await Budget.find({ userId, category: catDoc.name.trim() });
        await Promise.all(budgets.map(async b => {
          b.spent = (Number(b.spent || 0) + Number(amount)).toString();
          await b.save();
        }));
      }

      const tx = await Transaction.create({
        userId, amount, merchant: merchant || category,
        description: description || merchant || category,
        category: catDoc.name, categoryId: catDoc._id, type,
        createdAt: new Date(),
        hash: `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      });

      return JSON.stringify({
        success: true, transactionId: tx._id,
        message: `Logged ₹${amount} ${type} at ${merchant || category} under "${catDoc.name}".`,
      });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "add_transaction",
    description: "Logs income or expense and updates budget. Only use 'income' for salary/received money; use 'expense' for all purchases/spending.",
    schema: z.object({
      userId: z.string().describe("User ID"),
      amount: z.number().describe("Transaction amount in rupees"),
      merchant: z.string().describe("Store, person, or item name"),
      description: z.string().describe("Brief description"),
      category: z.string().describe("Category e.g. Food, Transport, Salary, Entertainment"),
      type: z.enum(["income", "expense"]).describe("income for money received, expense for money spent"),
    }),
  }
);

// ─── Tool 6: Add Savings Goal ──────────────────────────────────────────────────
export const build_addSavingsGoalTool = (closureUserId) => tool(
  async (args) => {
    const { name, targetAmount, deadline, currentAmount, userId: argsUserId } = args || {};
    const userId = argsUserId || closureUserId;
    try {
      await dbConnect();
      const existing = await SavingsGoal.findOne({ userId, name: name.trim() });
      if (existing) return JSON.stringify({ error: `Goal "${name}" already exists. Use update_goal_amount to add money to it.` });

      const deadlineDate = new Date(deadline);
      const now = new Date();
      const monthsLeft = Math.max(1,
        (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
        (deadlineDate.getMonth() - now.getMonth())
      );
      const savedSoFar = currentAmount || 0;
      const monthlySavingsNeeded = ((targetAmount - savedSoFar) / monthsLeft).toFixed(2);

      const goal = await SavingsGoal.create({
        userId, name: name.trim(), targetAmount,
        currentAmount: savedSoFar, deadline: deadlineDate,
        disabled: false, allocations: [],
      });

      return JSON.stringify({
        success: true, goalId: goal._id,
        message: `Goal "${name}" created. Target: ₹${targetAmount} by ${deadline}. Save ₹${monthlySavingsNeeded}/month (${monthsLeft} month${monthsLeft !== 1 ? "s" : ""} to go).`,
        monthlySavingsNeeded: Number(monthlySavingsNeeded), monthsToDeadline: monthsLeft,
      });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "add_savings_goal",
    description: "Creates a new savings goal. Use for: 'save for X', 'create a goal', 'I want to save ₹X for Y'.",
    schema: z.object({
      userId: z.string().describe("User ID"),
      name: z.string().describe("Goal name e.g. 'Flight Ticket', 'Emergency Fund'"),
      targetAmount: z.number().describe("Target amount in rupees"),
      deadline: z.string().describe("Deadline in YYYY-MM-DD format"),
      currentAmount: z.number().optional().describe("Amount already saved, defaults to 0"),
    }),
  }
);

// ─── Tool 7: Update Goal Amount ────────────────────────────────────────────────
export const build_updateGoalAmountTool = (closureUserId) => tool(
  async (args) => {
    const { goalName, amountToAdd, setAmount, userId: argsUserId } = args || {};
    const userId = argsUserId || closureUserId;
    try {
      await dbConnect();
      const goals = await SavingsGoal.find({ userId, disabled: { $ne: true } });
      const goal = goals.find(g =>
        g.name.toLowerCase().includes(goalName.toLowerCase()) ||
        goalName.toLowerCase().includes(g.name.toLowerCase())
      );

      if (!goal) return JSON.stringify({
        error: `No active goal found matching "${goalName}".`,
        existingGoals: goals.map(g => g.name),
      });

      const oldAmount = goal.currentAmount;
      if (setAmount !== undefined) goal.currentAmount = setAmount;
      else if (amountToAdd !== undefined) goal.currentAmount = oldAmount + amountToAdd;
      else return JSON.stringify({ error: "Provide amountToAdd or setAmount" });

      goal.currentAmount = Math.min(goal.currentAmount, goal.targetAmount);

      // Push to allocation history
      if (!goal.allocations) goal.allocations = [];
      goal.allocations.push({
        amount: amountToAdd || Math.abs(goal.currentAmount - oldAmount),
        direction: "add",
        note: "Added via AI agent",
        createdAt: new Date(),
      });

      await goal.save();

      const pct = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1);
      const remaining = goal.targetAmount - goal.currentAmount;

      return JSON.stringify({
        success: true,
        message: remaining <= 0
          ? `🎉 Goal "${goal.name}" reached! ₹${goal.targetAmount} fully saved.`
          : `Updated "${goal.name}": ₹${goal.currentAmount}/₹${goal.targetAmount} (${pct}%). ₹${remaining.toFixed(0)} remaining.`,
        previousAmount: oldAmount, newAmount: goal.currentAmount,
        percentage: Number(pct), remaining, goalId: goal._id,
      });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "update_goal_amount",
    description: "Adds money to or sets amount of an existing savings goal. Use for: 'add money to goal', 'put ₹X in goal', 'I saved X towards goal'.",
    schema: z.object({
      userId: z.string().describe("User ID"),
      goalName: z.string().describe("Goal name or partial match"),
      amountToAdd: z.number().optional().describe("Amount to add to current savings"),
      setAmount: z.number().optional().describe("Set current savings to this exact value"),
    }),
  }
);

// ─── Tool 8: Get Goals ─────────────────────────────────────────────────────────
export const build_getGoalsTool = (closureUserId) => tool(
  async (args) => {
    const userId = args?.userId || closureUserId;
    try {
      await dbConnect();
      const goals = await SavingsGoal.find({ userId, disabled: { $ne: true } }).sort({ createdAt: -1 });
      const enriched = goals.map(g => ({
        id: g._id, name: g.name,
        targetAmount: g.targetAmount, currentAmount: g.currentAmount,
        percentage: g.targetAmount > 0 ? Number(((g.currentAmount / g.targetAmount) * 100).toFixed(1)) : 0,
        remaining: g.targetAmount - g.currentAmount,
        deadline: g.deadline ? g.deadline.toISOString().split("T")[0] : null,
        daysLeft: g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline) - new Date()) / 86400000)) : null,
      }));
      return JSON.stringify({
        goals: enriched,
        totalGoals: goals.length,
        totalTargeted: goals.reduce((s, g) => s + g.targetAmount, 0),
        totalSaved: goals.reduce((s, g) => s + g.currentAmount, 0),
        overallProgress: goals.length > 0
          ? Number(((goals.reduce((s, g) => s + g.currentAmount, 0) / goals.reduce((s, g) => s + g.targetAmount, 0)) * 100).toFixed(1))
          : 0,
      });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "get_goals",
    description: "Fetches all active savings goals with progress. Use for: show goals, goal progress.",
    schema: z.object({ userId: z.string().describe("User ID") }),
  }
);

// ─── Tool 9: Budget Status ─────────────────────────────────────────────────────
export const build_getBudgetStatusTool = (closureUserId) => tool(
  async (args) => {
    const userId = args?.userId || closureUserId;
    try {
      await dbConnect();
      const budgets = await Budget.find({ userId, status: "enabled" });
      const budgetStatus = budgets.map(b => {
        const pct = b.amount > 0 ? Number(((Number(b.spent) / b.amount) * 100).toFixed(1)) : 0;
        return {
          category: b.category, budgeted: b.amount,
          spent: Number(b.spent || 0), remaining: b.amount - Number(b.spent || 0),
          percentage: pct,
          status: pct >= 100 ? "exceeded" : pct >= 80 ? "warning" : "healthy",
        };
      });
      return JSON.stringify({
        budgets: budgetStatus,
        totalBudgeted: budgets.reduce((s, b) => s + b.amount, 0),
        totalSpent: budgets.reduce((s, b) => s + Number(b.spent || 0), 0),
        exceededCategories: budgetStatus.filter(b => b.status === "exceeded").map(b => b.category),
        warningCategories: budgetStatus.filter(b => b.status === "warning").map(b => b.category),
        overallHealth: budgetStatus.some(b => b.status === "exceeded")
          ? "over-budget" : budgetStatus.some(b => b.status === "warning") ? "at-risk" : "healthy",
      });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },
  {
    name: "get_budget_status",
    description: "Budget health overview — exceeded, at-risk, or healthy categories. Use for: budget status, over budget.",
    schema: z.object({ userId: z.string().describe("User ID") }),
  }
);