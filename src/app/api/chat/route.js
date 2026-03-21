// app/api/chat/route.js
import { NextResponse } from "next/server";
import { createSavingsAdvisorGraph } from "@/app/lib/agents/savingsAdvisor";
import dbConnect from "@/app/lib/db";
import Transaction from "@/app/models/Transaction";
import ChatSession from "@/app/models/ChatSession";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

// ─── Today info ───────────────────────────────────────────────────────────────
function getTodayInfo() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    date: now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    day: days[now.getDay()],
    month: months[now.getMonth()],
    year: now.getFullYear(),
    daysLeftInMonth: lastDay - now.getDate(),
    totalDaysInMonth: lastDay,
    currentDay: now.getDate(),
  };
}

// ─── Conversational bypass — no LLM or DB needed ─────────────────────────────
// ✅ Bug fix #18: quickReply was defined but never called in Document 14's route.js
function quickReply(msg) {
  const t = msg.trim().toLowerCase();
  const raw = msg.trim();

  if (/^(hi+|hello+|hey+|hiya|yo|sup|namaste|helo|hii+)[\s!.?]*$/.test(t))
    return "Hey! I'm MoneyMap Intelligence — your personal finance assistant. What would you like to know? 💰";
  if (/^how are you[\s!.?]*$/.test(t))
    return "Running smoothly and ready to help! What's on your financial mind?";
  if (/^(i am fine|i'm fine|i'm good|doing (well|good|great))[\s!.?]*$/.test(t))
    return "Glad to hear it! How can I help with your finances today?";
  if (/what is your name[\s!.?]*$/.test(t) || /^who are you[\s!.?]*$/.test(t))
    return "I'm **MoneyMap Intelligence** — your AI-powered finance assistant. I track expenses, analyse spending, manage savings goals, and help you plan your budget.";
  if (/what (can|do) you do[\s!.?]*$/.test(t) || /what u can do[\s!.?]*$/.test(t) || /how can (u|you) help[\s!.?]*$/.test(t) || /what.*(capabilities|features|help with)[\s!.?]*$/.test(t))
    return `Here's what I can do:\n\n**💳 Transaction Logging** — "paid ₹500 for groceries" or "doodh 40"\n**📊 Financial Analysis** — balance, safe-to-spend, burn rate, anomalies\n**🎯 Savings Goals** — create, track, and add money to goals\n**🧮 Financial Planning** — "I have ₹5000 for 15 days, cab ₹120/day — how to manage?"\n**🛡️ Budget Health** — which budgets are exceeded or at risk\n\nWhat would you like to do?`;
  if (/what is my name[\s!.?]*$/.test(t))
    return "I don't store your personal details — Clerk manages your profile. I focus on your finances!";

  const today = getTodayInfo();
  if (/what.*(date|day) (is it|today|now)[\s!.?]*$/.test(t) || /today.*(date|day)[\s!.?]*$/.test(t) || /what is the date[\s!.?]*$/.test(t) || /^(today|the date|date today)[\s!.?]*$/.test(t))
    return `Today is **${today.day}, ${today.date}**.`;
  if (/(how many days (left|remaining) in (this )?month|days left (in|this) month)/.test(t))
    return `**${today.daysLeftInMonth} days** left in ${today.month} ${today.year} (today is the ${today.currentDay}${["st", "nd", "rd"][((today.currentDay + 90) % 100 - 10) % 10 - 1] || "th"}).`;
  if (/what (month|year) is (it|this)[\s!.?]*$/.test(t) || /current (month|year)[\s!.?]*$/.test(t))
    return `It's **${today.month} ${today.year}**.`;
  if (/what day is (it|today)[\s!.?]*$/.test(t))
    return `Today is **${today.day}**.`;

  if (/^thank(s| you)[\s!.?]*$/.test(t) || /^(thanks a lot|thank you so much|thx|ty)[\s!.?]*$/.test(t))
    return "You're welcome!";
  if (/^(ok|okay|got it|sure|cool|nice|great|awesome|sounds good|perfect|noted)[\s!.?]*$/.test(t))
    return "Got it!";
  if (/^(bye|goodbye|see you|cya|take care|ttyl)[\s!.?]*$/.test(t))
    return "Take care! Come back anytime. 👋";
  if (/^(good morning|good evening|good afternoon|good night)[\s!.?]*$/.test(t))
    return `${raw.charAt(0).toUpperCase() + raw.slice(1).replace(/[\s!.?]*$/, "")}! How can I help with your finances today?`;
  // Financial advice / list questions that don't need DB data
  if (/how (can|do) (i|u|we).*(avoid|reduce|cut|save|improve|manage|list|track)[\s!.?]*$/.test(t) ||
    /give me (a list|tips|advice|suggestions)/.test(t) ||
    /what (should|can) i (do|avoid|cut|reduce)[\s!.?]*$/.test(t) ||
    /how (can u|can you) help.*(list|avoid|suggest|tips)/.test(t)) {
    return `Here are common spending areas people benefit from reviewing:

1. **Food delivery** (Swiggy/Zomato) — usually the biggest discretionary drain
2. **Subscriptions** — audit monthly charges, cancel unused ones
3. **Impulse shopping** — Amazon/Flipkart late-night buys
4. **Transport** — daily cab costs vs metro/bus alternatives
5. **Dining out** — coffee shops, restaurants vs cooking at home

Want me to check your actual spending? Try: "Show me my spending breakdown"`;
  }

  if (/^(what happened|what.?s wrong|what is the issue|why.?s it (not working|failing))[\s!.?]*$/.test(t))
    return "I had a brief hiccup! Please ask again — I'm ready.";
  if (/^(try again|retry|again)[\s!.?]*$/.test(t))
    return "Sure, go ahead — what would you like to know?";

  return null;
}

// ─── Intent pre-routing ───────────────────────────────────────────────────────
// ✅ Bug fix #19: detectIntent was also missing from Document 14's route.js
function detectIntent(msg) {
  const m = msg.toLowerCase().trim();

  // Ledger — transaction logging (handles typos like "trasaction"="tran?sac", "ad"="add")
  if (/^(add|log|ad|ads|addd?).*(tran?sac|transact|expens|incom|entry)/.test(m)) return { agent: "Ledger_Manager" };
  if (/tran?sac.*\d+|\d+.*tran?sac/.test(m)) return { agent: "Ledger_Manager" };  // typo "trasaction"
  if (/^(add|ad)\b.*\d+/.test(m) && m.split(" ").length >= 3) return { agent: "Ledger_Manager" }; // "add X 80"
  if (/\b(paid|spent|bought|purchased|received|got paid|salary came)\b/.test(m) && /₹|\d+/.test(m)) return { agent: "Ledger_Manager" };
  if (/^[a-zA-Z\u0900-\u097F\s]+ \d+$/.test(m) && m.split(" ").length <= 4) return { agent: "Ledger_Manager" };
  if (/(add|create|new).*(categor)/.test(m)) return { agent: "Ledger_Manager" }; // "add new category burger"

  if (/where (am i|i am) spending|which category|spending more|most spent|top spend|biggest expense|category where i spend|most expensive/.test(m)) return { agent: "Financial_Analyst", hint: "spending_breakdown" };
  if (/^(my |what is my |what is curr |check my |current )?(balance|curr balance|left money|money left|leftover|remaining money|how much (left|remaining|do i have))/.test(m)) return { agent: "Financial_Analyst", hint: "safe_to_spend" };
  if (/(what is|check|show).*(balance|curr balance|current balance|remaining|left money)/.test(m)) return { agent: "Financial_Analyst", hint: "safe_to_spend" };
  if (/^(my |what is my |check my |current )?(income|salary|earnings)/.test(m)) return { agent: "Financial_Analyst", hint: "safe_to_spend" };
  if (/(safe.?to.?spend|daily limit|burn rate|spending pace|how much can i spend)/.test(m)) return { agent: "Financial_Analyst", hint: "safe_to_spend" };
  if (/(spending (breakdown|summary|this month|this week)|breakdown of (my )?spending|where did (my )?money go)/.test(m)) return { agent: "Financial_Analyst", hint: "spending_breakdown" };
  if (/(anomal|unusual spend|money leak|overspend)/.test(m)) return { agent: "Financial_Analyst", hint: "anomalies" };
  if (/i have ₹?\d+.*(for|left|remaining).*(days?|week|month)/.test(m)) return { agent: "Financial_Analyst", hint: "planning" };

  if (/(add money to|put.*in.*goal|update.*goal|save.*towards|contributed to)/.test(m)) return { agent: "Goal_Specialist", hint: "update_goal" };
  if (/(save for|saving goal|create.*goal|set.*goal|new goal|want to save ₹?\d+)/.test(m)) return { agent: "Goal_Specialist", hint: "create_goal" };
  if (/^(show|my|check|view).*(goals?|savings goals?|targets?)/.test(m)) return { agent: "Goal_Specialist", hint: "show_goals" };

  if (/(budget status|over budget|budget health|exceeded budget|which budget)/.test(m)) return { agent: "Budget_Advisor" };

  return null;
}

// ─── Retry with backoff ────────────────────────────────────────────────────────
async function invokeWithRetry(graph, state, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await graph.invoke(state);
    } catch (err) {
      const isRL =
        err.status === 429 ||
        String(err.message).includes("429") ||
        String(err.message).toLowerCase().includes("rate limit") ||
        String(err.message).toLowerCase().includes("too many requests");
      if (isRL && attempt < maxRetries) {
        const delay = (attempt + 1) * 12000;
        console.warn(`[RateLimit] Retry ${attempt + 1} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      err.isRateLimit = isRL;
      throw err;
    }
  }
}

export async function POST(request) {
  try {
    const { message, userId } = await request.json();
    if (!userId || !message?.trim())
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    await dbConnect();

    // ── Session ────────────────────────────────────────────────────────────────
    let session = await ChatSession.findOne({ userId });
    if (!session) session = await ChatSession.create({ userId, messages: [] });

    // Push user message to session BEFORE quickReply check so history is complete
    session.messages.push({ role: "user", content: message.trim() });
    await session.save();

    // ── 1. Conversational bypass — no LLM needed ───────────────────────────────
    const quick = quickReply(message);
    if (quick) {
      session.messages.push({ role: "assistant", content: quick });
      await session.save();
      return NextResponse.json({ message: quick, tools: [] });
    }

    // ── 2. Intent pre-routing ──────────────────────────────────────────────────
    const intent = detectIntent(message);

    // ── 3. Transaction context ─────────────────────────────────────────────────
    const recentTx = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(12);
    const txContext = recentTx.length > 0
      ? recentTx.map(t => `${t.createdAt.toISOString().split("T")[0]} | ${t.merchant || t.description || "?"} | ₹${t.amount} | ${t.type} | ${t.category}`).join("\n")
      : "No transactions yet.";

    // ── 4. System prompt ───────────────────────────────────────────────────────
    const today = getTodayInfo();
    const intentHint = intent
      ? `\nROUTING HINT: Route to ${intent.agent}${intent.hint ? ` for ${intent.hint}` : ""}. Do not override.`
      : "";

    const systemPrompt = `Today: ${today.day}, ${today.date} | Days left in ${today.month}: ${today.daysLeftInMonth}${intentHint}

RECENT TRANSACTIONS (last 12, context only):
${txContext}

ABSOLUTE RULES:
1. TRANSACTION TYPE: milk, doodh, food, groceries, cab, biryani, chowmin = EXPENSE. Never log food/transport as income.
2. CATEGORY CONFLICT: If add_transaction returns a conflict JSON, show the two options clearly to the user.
3. PLANNING: User gives own numbers ("I have ₹X for Y days") → calculate directly, skip tools.
4. FOLLOW-UPS: "I also want X" → modify the previous plan from history, don't restart.
5. NO FILLER: Never say "feel free to ask", "I'm here to help", "is there anything else".
6. NO REPEATS: Never show the same data block twice in one response.`;

    // ── 5. Build history ───────────────────────────────────────────────────────
    // ✅ Bug fix #20: previous version pushed user message to session then included
    //    ALL session.messages in graphMessages — causing the current user message
    //    to appear TWICE (once from history, once appended at the end).
    //
    //    Fix: use session.messages.slice(-15, -1) to exclude the message we just pushed,
    //    then append the current message explicitly once at the end.
    const historyWindow = session.messages.slice(-15, -1); // exclude the message just pushed
    const graphMessages = [new SystemMessage(systemPrompt)];

    historyWindow.forEach(m => {
      if ((m.role === "user" || m.role === "human") && m.content?.trim())
        graphMessages.push(new HumanMessage(m.content));
      else if ((m.role === "assistant" || m.role === "ai") && m.content?.trim())
        graphMessages.push(new AIMessage(m.content));
      // Intentionally skip tool messages — they cause Groq schema errors if reconstructed without matching tool_calls
    });

    // Append current user message exactly once
    graphMessages.push(new HumanMessage(message.trim()));

    // ── 6. Run graph ───────────────────────────────────────────────────────────
    let responseText = "I ran into a brief issue. Please try again!";
    let executedTools = [];

    try {
      const graph = createSavingsAdvisorGraph(userId);
      const finalState = await invokeWithRetry(graph, { messages: graphMessages });
      const newMsgs = finalState.messages.slice(graphMessages.length);

      newMsgs.forEach(m => {
        if (m._getType() === "tool" && m.name) executedTools.push(m.name);
      });

      const aiMsgs = newMsgs.filter(
        m => m._getType() === "ai" &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      );
      if (aiMsgs.length > 0) responseText = aiMsgs[aiMsgs.length - 1].content.trim();

      session.messages.push({ role: "assistant", content: responseText });
      await session.save();

    } catch (graphError) {
      console.error("═══ GRAPH ERROR ═══");
      console.error("Status :", graphError.status);
      console.error("Msg    :", graphError.message);
      console.error("Stack  :", graphError.stack?.split("\n").slice(0, 5).join("\n"));
      console.error("═══════════════════");

      // ✅ Bug fix #21: Document 14 leaked raw error text as "[DEBUG ERROR]: ..."
      //    to the user in all environments. Now only shown in development.
      if (graphError.isRateLimit) {
        responseText = "⏱️ Rate limited. Please wait 20–30 seconds and try again.";
      } else if (process.env.NODE_ENV === "development") {
        responseText = `⚠️ Dev error: ${graphError.message}`;
      } else {
        responseText = "I ran into an issue. Please try again!";
      }
    }

    return NextResponse.json({ message: responseText, tools: [...new Set(executedTools)] });

  } catch (error) {
    console.error("[/api/chat] Outer:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}