"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Sparkles, SendHorizontal, Bot, TrendingUp, PiggyBank,
  Search, AlertTriangle, Plus, Target, RefreshCw,
  ChevronDown, WifiOff, Clock, Flame, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

// ─── Tool metadata ─────────────────────────────────────────────────────────────
const TOOL_META = {
  add_transaction: { icon: Plus, label: "Transaction Logged", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  add_savings_goal: { icon: Target, label: "Goal Created", color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)" },
  get_safe_to_spend: { icon: TrendingUp, label: "Budget Analysed", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  get_recent_anomalies: { icon: AlertTriangle, label: "Anomalies Scanned", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
  get_spending_summary: { icon: PiggyBank, label: "Spending Summarised", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)" },
  agentic_semantic_search: { icon: Search, label: "History Searched", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)" },
  get_burn_rate: { icon: Flame, label: "Burn Rate Calculated", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)" },
  get_goals: { icon: Target, label: "Goals Fetched", color: "#06b6d4", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)" },
  get_budget_status: { icon: ShieldCheck, label: "Budgets Reviewed", color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)" },
};

const AGENT_LABELS = {
  Ledger_Manager: { label: "Ledger Manager", color: "#10b981" },
  Financial_Analyst: { label: "Financial Analyst", color: "#f59e0b" },
  Goal_Specialist: { label: "Goal Specialist", color: "#6366f1" },
  Budget_Advisor: { label: "Budget Advisor", color: "#a855f7" },
  supervisor: { label: "Routing…", color: "#94a3b8" },
};

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: "Safe to spend?", prompt: "What's my safe-to-spend limit today?" },
  { icon: Flame, label: "Burn rate", prompt: "What's my daily burn rate this month?" },
  { icon: AlertTriangle, label: "Find anomalies", prompt: "Show me any unusual spending this month." },
  { icon: PiggyBank, label: "Spending breakdown", prompt: "Give me a full breakdown of my spending." },
  { icon: ShieldCheck, label: "Budget health", prompt: "Show me the status of all my budgets." },
  { icon: Target, label: "My goals", prompt: "Show me all my savings goals and progress." },
];

// ─── Markdown renderer ─────────────────────────────────────────────────────────
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|₹[\d,]+(?:\.\d{1,2})?)/g);
  return parts.map((part, i) => {
    if (/^\*\*/.test(part)) return <strong key={i} className="font-semibold text-zinc-100">{part.replace(/\*\*/g, "")}</strong>;
    if (/^₹/.test(part)) return <span key={i} className="font-semibold text-emerald-400">{part}</span>;
    return part;
  });
}

function renderContent(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let key = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t) { elements.push(<div key={key++} className="h-1.5" />); continue; }
    if (/^\*\*(.+)\*\*$/.test(t)) {
      elements.push(<p key={key++} className="font-semibold text-zinc-100 mt-2 mb-0.5">{t.replace(/\*\*/g, "")}</p>);
    } else if (/^[-•*]\s/.test(t)) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
          <span className="text-zinc-300 text-[14px] leading-relaxed">{renderInline(t.replace(/^[-•*]\s/, ""))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(t)) {
      const num = t.match(/^(\d+)\./)[1];
      elements.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="shrink-0 text-[11px] font-bold text-zinc-500 mt-[3px] w-4">{num}.</span>
          <span className="text-zinc-300 text-[14px] leading-relaxed">{renderInline(t.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    } else if (/^[🔴🟡🟢]/.test(t)) {
      const emoji = t[0];
      const content = t.slice(2);
      const statusColor = emoji === "🔴" ? "#ef4444" : emoji === "🟡" ? "#f59e0b" : "#10b981";
      elements.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="shrink-0 text-[13px] mt-0.5">{emoji}</span>
          <span className="text-[14px] leading-relaxed" style={{ color: statusColor }}>{renderInline(content)}</span>
        </div>
      );
    } else {
      elements.push(<p key={key++} className="text-[14px] text-zinc-300 leading-relaxed">{renderInline(t)}</p>);
    }
  }
  return elements;
}

function ToolBadge({ toolName }) {
  const meta = TOOL_META[toolName];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
      <Icon className="w-3 h-3" />{meta.label}
    </div>
  );
}

function ThinkingIndicator({ agentName }) {
  const meta = AGENT_LABELS[agentName] || AGENT_LABELS.supervisor;
  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-[80%] gap-3">
        <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <Sparkles className="w-4 h-4 text-zinc-400 animate-pulse" />
        </div>
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: meta.color }}>{meta.label}</div>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const isError = msg.isError;
  return (
    <div className={`flex w-full animate-fadeIn ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] md:max-w-[78%] ${isUser ? "flex-row-reverse" : "flex-row"} gap-3`}>
        {!isUser && (
          <div className="shrink-0 mt-0.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isError ? "bg-red-500/10 border-red-500/20" : "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/20"
              }`}>
              {isError ? <WifiOff className="w-4 h-4 text-red-400" /> : <Bot className="w-4 h-4 text-indigo-400" />}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {isUser ? (
            <div className="bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-2xl rounded-tr-sm text-[14px] font-medium leading-relaxed shadow-sm">
              {msg.content}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {msg.tools?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-0.5">
                  {msg.tools.map((t) => <ToolBadge key={t} toolName={t} />)}
                </div>
              )}
              <div className={`text-[14px] leading-relaxed space-y-1 ${isError ? "text-red-400/80" : ""}`}>
                {isError ? <p className="text-[14px] leading-relaxed">{msg.content}</p> : renderContent(msg.content)}
              </div>
            </div>
          )}
          {msg.timestamp && (
            <div className={`text-[10px] text-zinc-600 ${isUser ? "text-right" : "text-left"}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AiAdvisorTab({ onDataChange }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "I'm **MoneyMap Intelligence** — your multi-agent financial analyst.\n\nI can:\n- Log transactions and update your budgets automatically\n- Calculate safe-to-spend limits and burn rate\n- Detect spending anomalies\n- Analyse your budget health\n- Track savings goal progress\n- Search your full transaction history\n\nWhat would you like to know?",
    timestamp: Date.now(),
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const agentTimerRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const fn = () => setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    el.addEventListener("scroll", fn);
    return () => el.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/chat/history?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.messages?.length > 0) {
          const msgs = data.messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: m.content, timestamp: m.createdAt ? new Date(m.createdAt).getTime() : Date.now() }));
          if (msgs.length > 0) { setMessages(msgs); setTimeout(() => scrollToBottom(false), 100); }
        }
      })
      .catch((err) => console.warn("Chat history:", err));
  }, [user]);

  useEffect(() => () => clearInterval(agentTimerRef.current), []);

  const handleSend = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || !user || isLoading) return;

    setMessages((p) => [...p, { role: "user", content: text, timestamp: Date.now() }]);
    setInput("");
    setIsLoading(true);
    setActiveAgent("supervisor");

    const seq = ["supervisor", "Financial_Analyst", "Ledger_Manager", "Budget_Advisor", "Goal_Specialist"];
    let idx = 0;
    agentTimerRef.current = setInterval(() => { idx = (idx + 1) % seq.length; setActiveAgent(seq[idx]); }, 2200);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, message: text }),
      });

      const data = await res.json();
      clearInterval(agentTimerRef.current);

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setMessages((p) => [...p, {
        role: "assistant",
        content: data.message,
        tools: data.tools || [],
        timestamp: Date.now(),
        isError: /^[⚠️⏱️]/.test(data.message),
      }]);

      if (onDataChange && data.tools?.length > 0) onDataChange();

      data.tools?.forEach((toolName, i) => {
        const meta = TOOL_META[toolName];
        if (!meta) return;
        setTimeout(() => {
          toast.custom(() => (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
              style={{ background: "rgba(18,18,28,0.95)", border: `1px solid ${meta.border}`, color: meta.color, backdropFilter: "blur(12px)" }}>
              <meta.icon className="w-4 h-4 shrink-0" />
              <span>{meta.label}</span>
            </div>
          ));
        }, i * 300);
      });

      if (/rate.limit|rate-limit|⏱️/i.test(data.message)) {
        toast.custom(() => (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
            style={{ background: "rgba(18,18,28,0.95)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", backdropFilter: "blur(12px)" }}>
            <Clock className="w-4 h-4 shrink-0" />
            <span>Rate limited — wait 20–30s before retrying</span>
          </div>
        ));
      }
    } catch (err) {
      clearInterval(agentTimerRef.current);
      setMessages((p) => [...p, { role: "assistant", content: `Network error: ${err.message}. Please check your connection.`, timestamp: Date.now(), isError: true }]);
      toast.error(`Request failed: ${err.message}`);
    } finally {
      setIsLoading(false);
      setActiveAgent(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const showQuickPrompts = messages.length <= 1 && !isLoading;

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}>
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {isLoading && <ThinkingIndicator agentName={activeAgent} />}

        {showQuickPrompts && (
          <div className="pt-2">
            <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3 px-1">Quick Actions</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                <button key={label} onClick={() => handleSend(prompt)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-zinc-400 text-[13px] hover:bg-white/[0.06] hover:text-zinc-200 hover:border-white/[0.12] transition-all duration-200 text-left">
                  <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />{label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {showScrollDown && (
        <div className="absolute bottom-24 right-8 z-20">
          <button onClick={() => scrollToBottom()}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors shadow-lg">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 md:px-6 pb-5 pt-2 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent">
        <div className="relative flex items-end">
          <textarea ref={inputRef} value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask anything about your finances…"
            rows={1} disabled={isLoading}
            className="w-full bg-[#18181b] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-zinc-200 text-[14px] placeholder:text-zinc-600 outline-none focus:border-zinc-500/60 transition-all shadow-sm resize-none overflow-hidden leading-relaxed disabled:opacity-60"
            style={{ minHeight: "46px", maxHeight: "120px" }}
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-white/5">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
          </button>
        </div>

        {/* Agent status bar */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1">
            {Object.entries(AGENT_LABELS).slice(0, 4).map(([key, { label, color }]) => (
              <span key={key} className="text-[10px] px-2 py-0.5 rounded-full border transition-all duration-500"
                style={{
                  color: activeAgent === key ? color : "#52525b",
                  borderColor: activeAgent === key ? color : "transparent",
                  background: activeAgent === key ? `${color}18` : "transparent",
                }}>
                {label}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-white/20">MoneyMap · LangGraph</span>
        </div>
      </div>
    </div>
  );
}