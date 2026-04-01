// app/lib/agents/savingsAdvisor.js
import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, AIMessage } from "@langchain/core/messages";
import {
  build_getSafeToSpendTool, build_getAnomaliesTool, build_getSpendingSummaryTool,
  build_getBurnRateTool, build_addTransactionTool, build_addSavingsGoalTool,
  build_updateGoalAmountTool, build_getGoalsTool, build_getBudgetStatusTool,
} from "./tools";
import { build_agenticSemanticSearchTool } from "./vectorStore";

const AgentState = Annotation.Root({
  messages: Annotation({ reducer: (x, y) => x.concat(y), default: () => [] }),
  next: Annotation({ reducer: (_, y) => y ?? "FINISH", default: () => "FINISH" }),
  iterationCount: Annotation({ reducer: (x, y) => y ?? x, default: () => 0 }),
});

const MAX_ITERATIONS = 8;
const MEMBERS = [
  "Ledger_Manager", "Financial_Analyst",
  "Goal_Specialist", "Budget_Advisor", "General_Assistant",
];

function sanitizeForSupervisor(messages) {
  return messages
    .filter(m => m._getType() !== "system" && m._getType() !== "tool")
    .map(m => m._getType() === "ai"
      ? new AIMessage(typeof m.content === "string" && m.content.trim() ? m.content : "Done.")
      : m
    );
}

function sanitizeForAgent(messages, validToolNames) {
  return messages
    .filter(m => m._getType() !== "system")
    .filter(m => m._getType() !== "tool" || validToolNames.includes(m.name))
    .map(m => {
      if (m._getType() === "ai" && m.tool_calls?.some(tc => !validToolNames.includes(tc.name)))
        return new AIMessage(typeof m.content === "string" && m.content.trim() ? m.content : "Done.");
      return m;
    });
}

// ── userId is passed in so all tools are built with it baked in ──────────────
export function createSavingsAdvisorGraph(userId) {
  const LLM = new ChatOpenAI({
    modelName: "llama-3.1-8b-instant",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
    configuration: { baseURL: "https://api.groq.com/openai/v1" },
  });

  // ── Supervisor ──────────────────────────────────────────────────────────────
  const supervisorNode = async (state) => {
    const count = (state.iterationCount ?? 0) + 1;
    if (count > MAX_ITERATIONS) {
      console.warn("[Supervisor] Max iterations → FINISH");
      return { next: "FINISH", iterationCount: count };
    }

    const sysContent = state.messages
      .filter(m => m._getType() === "system")
      .map(m => m.content).join("\n");

    // ✅ Routing hint ONLY fires on the FIRST supervisor visit (count === 1).
    // On return visits the agent has already run — must check if done, not re-route.
    // The old bug: hint fired every visit → agent → supervisor → hint → agent → infinite loop.
    if (count === 1) {
      const hintMatch = sysContent.match(/ROUTING HINT: Route to (\w+)/);
      if (hintMatch && MEMBERS.includes(hintMatch[1])) {
        console.log(`[Supervisor] Routing → ${hintMatch[1]} (pre-routed, agent LLM will still run to answer)`);
        return { next: hintMatch[1], iterationCount: count };
      }
    }

    const sysPrompt = `Route to ONE specialist. Return ONLY the name — no punctuation, no explanation.

Financial_Analyst handles ALL of these:
- balance, my balance, left money, how much left, remaining, available
- income, my income, salary, what is my income
- safe to spend, daily limit, burn rate, health score
- spending breakdown, spending summary, spending this month/week
- where am I spending, which category, spending more, most spent, top categories
- anomalies, unusual spending, money leaks
- financial planning with user's numbers, follow-up plans

Ledger_Manager handles:
- add transaction, add expense, add income, log
- I paid, I spent, I bought, I received, I got
- short amounts: "doodh 40", "biryani 420", "petrol 200"
- search past transactions

Goal_Specialist handles:
- save for, savings goal, create goal, new goal
- add money to goal, put X in goal, update goal
- show goals, goal progress, my goals

Budget_Advisor handles:
- budget status, over budget, budget health

General_Assistant handles:
- greetings: hi, hello, hey
- identity questions: who are you, what can you do
- date/time questions: what is today, what day is it
- casual chat, thank you, good morning
- any question that does NOT need financial data from a database

IMPORTANT RULES:
- If the message contains a number (like "80", "500") and any item name → Ledger_Manager
- If the message asks about money, spending, income, balance, or categories → Financial_Analyst
- If the message is conversational, advice-seeking, or unclear → General_Assistant
- NEVER return FINISH for a question that has financial content or asks for help
- FINISH only if the message is completely empty or pure gibberish

Return exactly ONE of: Financial_Analyst, Ledger_Manager, Goal_Specialist, Budget_Advisor, General_Assistant, or FINISH`;

    const combinedSys = new SystemMessage(sysPrompt + "\n\nContext:\n" + sysContent);

    try {
      const response = await LLM.invoke([combinedSys, ...sanitizeForSupervisor(state.messages)]);
      // Normalize: handle "**Financial_Analyst**", "Financial_Analyst.", "1. Financial_Analyst"
      const cleaned = response.content.trim().replace(/['"`.:\n,!?*#\[\]()]/g, " ").trim();
      const raw = cleaned.split(/\s+/).find(w => MEMBERS.includes(w)) || cleaned.split(/\s+/)[0];
      // Fallback: if LLM returns unrecognised text, send to General_Assistant (never FINISH for real questions)
      const hasFinancialContent = /\d|₹|money|balance|spend|income|goal|budget|transact|categor|help/.test(
        state.messages.filter(m => m._getType() === "human").slice(-1)[0]?.content?.toLowerCase() || ""
      );
      const nextRoute = MEMBERS.includes(raw)
        ? raw
        : (hasFinancialContent ? "General_Assistant" : "FINISH");
      console.log(`[Supervisor] → ${nextRoute} (iter ${count})`);
      return { next: nextRoute, iterationCount: count };
    } catch (err) {
      console.error("[Supervisor] Error:", err.message);
      return { next: "FINISH", iterationCount: count };
    }
  };

  // ── Agent Factory ───────────────────────────────────────────────────────────
  const createAgent = (systemPrompt, tools) => {
    const boundLLM = tools.length > 0 ? LLM.bindTools(tools) : LLM;
    const validToolNames = tools.map(t => t.name);
    return async (state) => {
      const sysContent = state.messages
        .filter(m => m._getType() === "system")
        .map(m => m.content).join("\n\n");
      const combinedSys = new SystemMessage(systemPrompt + "\n\nContext:\n" + sysContent);
      try {
        const response = await boundLLM.invoke([combinedSys, ...sanitizeForAgent(state.messages, validToolNames)]);
        return { messages: [response] };
      } catch (err) {
        console.error("[Agent] Error:", err.message);
        return { messages: [new AIMessage("I hit an error. Please try again.")] };
      }
    };
  };

  // ── Prompts ─────────────────────────────────────────────────────────────────
  const LEDGER_PROMPT = `You are the Ledger Manager. You log transactions and search history.

TRANSACTION TYPE RULES:
- EXPENSE (money OUT): food, milk, doodh, groceries, cab, transport, biryani, chowmin, subscription, rent, entertainment, petrol, bills, shopping, medicine, giving money, sending money, paid friend, paid person
- INCOME (money IN): salary, freelance payment, received from person, refund, cashback

STEPS:
1. Infer correct type from context (food/transport = expense, salary/received = income)
2. Call add_transaction with the correct type
3. If tool returns conflict → show user clearly:
   "⚠️ [Category] already exists as [existingType]. Did you want to:
   1. Log ₹[X] as [existingType] under '[category]'
   2. Create a new '[category]' under [requestedType]"
4. If success → ONE sentence: "Logged ₹[X] [type] at [merchant] under [category]."

NEVER say "is there anything else", "feel free to ask", "I'm here to help".
NEVER log food/groceries/transport/subscriptions as income.`;

  const ANALYST_PROMPT = `You are the Financial Analyst. Provide precise, data-driven analysis.

TOOL SELECTION:
- balance / income / how much left / daily limit → get_safe_to_spend
- spending breakdown / which category / where spending / top categories → get_spending_summary (period: month)
- burn rate / spending pace / projected spend → get_burn_rate
- anomalies / unusual spending → get_recent_anomalies
- User's own numbers in message → NO tool, calculate directly

RESPONSE FORMAT:

get_safe_to_spend:
Balance: ₹[remaining] | Limit: ₹[safeDailyLimit]/day | Burn: ₹[dailyBurnRate]/day | Health: [healthScore]/100
[ONE tip based on actual numbers]

get_spending_summary:
Top spending this month:
1. [Category] — ₹[amount] ([pct]%)
2. [Category] — ₹[amount] ([pct]%)
Net savings: ₹[netSavings] | Rate: [savingsRate]%
Biggest drain: [category] — [ONE tip]

get_burn_rate:
Burn: ₹[dailyBurnRate]/day | Projected EoM: ₹[projectedEoMSpend] | Elapsed: [daysElapsed] days
[ONE insight]

Planning (user's own numbers):
Available: ₹[X] - ₹[savings] = ₹[spendable]
Days: [N] | Daily: ₹[spendable÷N] | Fixed: ₹[costs]/day | Flexible: ₹[remainder]/day
[Day-by-day plan]

Follow-up plan ("I also want X"):
Previous flexible: ₹[X]/day
[X] = ₹[cost] × [days] = ₹[total]
Updated flexible: ₹[new]/day

STRICT: No duplicate blocks. No filler. Use ₹ always.`;

  const GOAL_PROMPT = `You are the Goal Specialist. Create and manage savings goals.

TOOL MAPPING:
- "add money to goal" / "put X in goal" / "I saved X towards" → update_goal_amount
- "save for X" / "create goal" / "new goal" → add_savings_goal
- "show goals" / "my goals" / "goal progress" → get_goals

After update_goal_amount success:
[Goal name]: ₹[new]/₹[target] ([pct]%) — ₹[remaining] to go.
[If complete]: 🎉 Goal reached! [Name] at ₹[target].

After update_goal_amount error:
No goal found matching "[name]". Active goals: [list]. Did you mean one of these?

After add_savings_goal:
Goal created — [Name]: ₹[target] by [date]. Save ₹[monthly]/month for [N] months.

After get_goals:
• [Name]: ₹[current]/₹[target] ([pct]%) | [daysLeft] days left
Total saved: ₹[X] of ₹[Y]

No filler.`;

  const BUDGET_PROMPT = `You are the Budget Advisor.

Call get_budget_status first. Then:

BUDGET HEALTH:
🔴 EXCEEDED: [Cat] — ₹[spent]/₹[budget] ([pct]%)
🟡 AT RISK: [Cat] — ₹[spent]/₹[budget] ([pct]%)
🟢 HEALTHY: [Cat] — ₹[spent]/₹[budget] ([pct]%)

Overall: ₹[totalSpent]/₹[totalBudgeted] — [overallHealth]
Action: [ONE specific recommendation]`;

  const GENERAL_PROMPT = `You are MoneyMap Intelligence, a friendly AI personal finance assistant.
Answer concisely and helpfully. Do NOT use any tools — just respond directly.
Keep responses under 3 sentences unless a list is genuinely helpful.
Never say "I'm just an AI" or "I can't".`;

  // ── Build tools with userId baked in ────────────────────────────────────────
  const ledgerTools = [
    build_addTransactionTool(userId),
    build_agenticSemanticSearchTool(userId),
  ];
  const analystTools = [
    build_getSafeToSpendTool(userId),
    build_getAnomaliesTool(userId),
    build_getSpendingSummaryTool(userId),
    build_getBurnRateTool(userId),
  ];
  const goalTools = [
    build_addSavingsGoalTool(userId),
    build_updateGoalAmountTool(userId),
    build_getGoalsTool(userId),
  ];
  // ✅ Bug fix #17: budgetTools previously had build_getSafeToSpendTool listed twice
  //    causing duplicate tool name `get_safe_to_spend` in the same ToolNode → LangGraph crash
  const budgetTools = [
    build_getBudgetStatusTool(userId),
  ];

  const ledgerAgent = createAgent(LEDGER_PROMPT, ledgerTools);
  const analystAgent = createAgent(ANALYST_PROMPT, analystTools);
  const goalAgent = createAgent(GOAL_PROMPT, goalTools);
  const budgetAgent = createAgent(BUDGET_PROMPT, budgetTools);
  // ✅ General_Assistant has NO tools — bindTools([]) is fine
  const generalAgent = createAgent(GENERAL_PROMPT, []);

  // After an agent responds without tool calls → "done" → END
  // After a tool call → "tools" → tool node → back to agent
  const shouldContinue = s =>
    s.messages[s.messages.length - 1]?.tool_calls?.length > 0 ? "tools" : "done";

  // ── Graph ───────────────────────────────────────────────────────────────────
  const workflow = new StateGraph(AgentState)
    .addNode("supervisor", supervisorNode)
    .addNode("Ledger_Manager", ledgerAgent)
    .addNode("ledger_tools", new ToolNode(ledgerTools))
    .addNode("Financial_Analyst", analystAgent)
    .addNode("analyst_tools", new ToolNode(analystTools))
    .addNode("Goal_Specialist", goalAgent)
    .addNode("goal_tools", new ToolNode(goalTools))
    .addNode("Budget_Advisor", budgetAgent)
    .addNode("budget_tools", new ToolNode(budgetTools))
    .addNode("General_Assistant", generalAgent)

    .addEdge(START, "supervisor")
    .addConditionalEdges("supervisor", s => s.next, {
      Ledger_Manager: "Ledger_Manager",
      Financial_Analyst: "Financial_Analyst",
      Goal_Specialist: "Goal_Specialist",
      Budget_Advisor: "Budget_Advisor",
      General_Assistant: "General_Assistant",
      FINISH: END,
    })
    .addConditionalEdges("Ledger_Manager", shouldContinue, { tools: "ledger_tools", done: END })
    .addEdge("ledger_tools", "Ledger_Manager")
    .addConditionalEdges("Financial_Analyst", shouldContinue, { tools: "analyst_tools", done: END })
    .addEdge("analyst_tools", "Financial_Analyst")
    .addConditionalEdges("Goal_Specialist", shouldContinue, { tools: "goal_tools", done: END })
    .addEdge("goal_tools", "Goal_Specialist")
    .addConditionalEdges("Budget_Advisor", shouldContinue, { tools: "budget_tools", done: END })
    .addEdge("budget_tools", "Budget_Advisor")
    // ✅ Bug fix #14/#15: General_Assistant has NO tools so shouldContinue will always
    //    return "supervisor" (never "tools"). But we just go straight to END — no loop back.
    .addEdge("General_Assistant", END);

  return workflow.compile();
}