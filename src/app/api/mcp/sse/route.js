import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { randomUUID } from "crypto";
import { sessions } from "@/app/lib/mcp-sessions";   // ← shared singleton
import dbConnect from "@/app/lib/db";
import {
    build_getSafeToSpendTool, build_getAnomaliesTool, build_getSpendingSummaryTool,
    build_getBurnRateTool, build_addTransactionTool, build_addSavingsGoalTool,
    build_updateGoalAmountTool, build_getGoalsTool, build_getBudgetStatusTool,
} from "@/app/lib/agents/tools";
import { build_agenticSemanticSearchTool } from "@/app/lib/agents/vectorStore";

export const dynamic = "force-dynamic";

const enc = new TextEncoder();

async function registerTools(server, userId) {
    await dbConnect();
    server.tool("get_safe_to_spend", "Gets balance, safe-to-spend limit, burn rate, and health score.", { userId: z.string() }, async (args) => ({ content: [{ type: "text", text: await build_getSafeToSpendTool(userId).invoke(args) }] }));
    server.tool("get_recent_anomalies", "Detects unusual spending spikes in last 30 days.", { userId: z.string() }, async (args) => ({ content: [{ type: "text", text: await build_getAnomaliesTool(userId).invoke(args) }] }));
    server.tool("get_spending_summary", "Spending breakdown by category.",
        { userId: z.string(), period: z.enum(["week", "month", "30days"]) },
        async (args) => ({ content: [{ type: "text", text: await build_getSpendingSummaryTool(userId).invoke(args) }] }));
    server.tool("get_burn_rate", "Daily spending rate and projected month-end spend.", { userId: z.string() }, async (args) => ({ content: [{ type: "text", text: await build_getBurnRateTool(userId).invoke(args) }] }));
    server.tool("add_transaction", "Logs income or expense.",
        { userId: z.string(), amount: z.number(), merchant: z.string(), description: z.string(), category: z.string(), type: z.enum(["income", "expense"]) },
        async (args) => ({ content: [{ type: "text", text: await build_addTransactionTool(userId).invoke(args) }] }));
    server.tool("add_savings_goal", "Creates a new savings goal.",
        { userId: z.string(), name: z.string(), targetAmount: z.number(), deadline: z.string(), currentAmount: z.number().optional() },
        async (args) => ({ content: [{ type: "text", text: await build_addSavingsGoalTool(userId).invoke(args) }] }));
    server.tool("update_goal_amount", "Adds money to an existing savings goal.",
        { userId: z.string(), goalName: z.string(), amountToAdd: z.number().optional(), setAmount: z.number().optional() },
        async (args) => ({ content: [{ type: "text", text: await build_updateGoalAmountTool(userId).invoke(args) }] }));
    server.tool("get_goals", "Fetches all active savings goals.", { userId: z.string() }, async (args) => ({ content: [{ type: "text", text: await build_getGoalsTool(userId).invoke(args) }] }));
    server.tool("get_budget_status", "Budget health overview.", { userId: z.string() }, async (args) => ({ content: [{ type: "text", text: await build_getBudgetStatusTool(userId).invoke(args) }] }));
    server.tool("agentic_semantic_search", "Searches transaction history using semantic similarity.",
        { userId: z.string(), query: z.string() },
        async (args) => ({ content: [{ type: "text", text: await build_agenticSemanticSearchTool(userId).invoke(args) }] }));
}

function createTransport(controller) {
    return {
        send(message) {
            try { controller.enqueue(enc.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`)); }
            catch { /* stream closed */ }
            return Promise.resolve();
        },
        start() { return Promise.resolve(); },
        close() { return Promise.resolve(); },
        onmessage: null,
        onerror: null,
        onclose: null,
    };
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

    const sessionId = randomUUID();
    let controller;
    let pingInterval;

    const stream = new ReadableStream({
        async start(ctrl) {
            controller = ctrl;
            const transport = createTransport(ctrl);
            const server = new McpServer({ name: "MoneyMap MCP", version: "1.0.0" });

            try {
                await registerTools(server, userId);
                await server.connect(transport);
            } catch (err) {
                console.error(`[MCP SSE] Setup error:`, err.message);
                ctrl.close();
                return;
            }

            // Store in globalThis-backed singleton — visible to message/route.js
            sessions.set(sessionId, { transport, userId });
            console.log(`[MCP SSE] Session ${sessionId} opened (userId=${userId}), total=${sessions.size}`);

            // MCP protocol: first event must be plain-text "endpoint" (no JSON wrapping)
            ctrl.enqueue(enc.encode(`event: endpoint\ndata: /api/mcp/message?sessionId=${sessionId}\n\n`));

            pingInterval = setInterval(() => {
                if (!sessions.has(sessionId)) { clearInterval(pingInterval); return; }
                try { ctrl.enqueue(enc.encode(`: ping\n\n`)); }
                catch { clearInterval(pingInterval); }
            }, 20_000);
        },
        cancel() {
            clearInterval(pingInterval);
            sessions.delete(sessionId);
            console.log(`[MCP SSE] Session ${sessionId} closed, total=${sessions.size}`);
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}