"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  TrendingUp, TrendingDown, AlertTriangle, Zap,
  Target, PiggyBank, Flame, Brain, RefreshCw, Sparkles,
  ArrowRight, Activity,
} from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const TYPES = {
  warning: { color: "#f87171", glow: "rgba(248,113,113,0.12)", bg: "rgba(248,113,113,0.05)", border: "rgba(248,113,113,0.15)", Icon: AlertTriangle, label: "Alert" },
  positive: { color: "#34d399", glow: "rgba(52,211,153,0.12)", bg: "rgba(52,211,153,0.05)", border: "rgba(52,211,153,0.15)", Icon: TrendingUp, label: "Positive" },
  tip: { color: "#fbbf24", glow: "rgba(251,191,36,0.12)", bg: "rgba(251,191,36,0.05)", border: "rgba(251,191,36,0.15)", Icon: Zap, label: "Tip" },
  goal: { color: "#a78bfa", glow: "rgba(167,139,250,0.12)", bg: "rgba(167,139,250,0.05)", border: "rgba(167,139,250,0.15)", Icon: Target, label: "Goal" },
  burn: { color: "#fb923c", glow: "rgba(251,146,60,0.12)", bg: "rgba(251,146,60,0.05)", border: "rgba(251,146,60,0.15)", Icon: Flame, label: "Burn" },
};

// ─── Health score calc ─────────────────────────────────────────────────────────
function calcHealth(income, spent) {
  if (income <= 0) return 50;
  return Math.max(0, Math.min(100, Math.round(((income - spent) / income) * 100)));
}

// ─── Rule-based insights ───────────────────────────────────────────────────────
function generateRuleInsights(safeData, burnData, anomalyData, goalData) {
  const out = [];
  if (safeData && !safeData.error) {
    const totalIncome = safeData.totalIncome ?? 0;
    const totalBudgeted = safeData.totalBudgeted ?? 0;
    const remainingDays = safeData.remainingDaysInMonth ?? safeData.remainingDays ?? 0;
    const safeDailyLimit = safeData.safeDailyLimit ?? safeData.safeToSpendDaily ?? 0;
    const totalSpent = burnData?.totalSpent ?? burnData?.totalSpentThisMonth ?? 0;
    const dailyBurnRate = burnData?.dailyBurnRate ?? 0;
    const h = calcHealth(totalIncome, totalSpent);

    if (totalIncome > 0) {
      if (h < 20)
        out.push({ type: "warning", priority: 1, title: "Critical Spending Alert", body: `${100 - h}% of income spent. ₹${(totalIncome - totalSpent).toFixed(0)} left — burning ₹${dailyBurnRate.toFixed(0)}/day vs ₹${Number(safeDailyLimit).toFixed(0)} safe limit.` });
      else if (h < 50)
        out.push({ type: "warning", priority: 2, title: "Budget Under Pressure", body: `${(100 - h).toFixed(0)}% spent. ₹${(totalIncome - totalSpent).toFixed(0)} left over ${remainingDays} days — aim for ₹${Number(safeDailyLimit).toFixed(0)}/day.` });
      else if (h >= 80)
        out.push({ type: "positive", priority: 5, title: "Finances Looking Healthy", body: `${h}% of income intact. ₹${(totalIncome - totalSpent).toFixed(0)} available, ${remainingDays} days left — well within ₹${Number(safeDailyLimit).toFixed(0)}/day limit.` });
    }

    if (totalIncome > 500 && totalBudgeted === 0)
      out.push({ type: "tip", priority: 3, title: "No Budgets Set Yet", body: `₹${totalIncome.toFixed(0)} income with zero budget categories. Set budgets so the AI can alert you on overspending.` });
    else if (totalIncome > 0 && totalBudgeted > 0 && totalBudgeted < totalIncome * 0.5) {
      const u = totalIncome - totalBudgeted;
      out.push({ type: "tip", priority: 4, title: "Income Partially Unallocated", body: `₹${u.toFixed(0)} (${Math.round((u / totalIncome) * 100)}% of income) has no budget. Allocating it improves AI tracking.` });
    }
  }

  if (burnData && !burnData.error) {
    const { dailyBurnRate: dbr, projectedEoMSpend: proj, totalSpent: ts, totalSpentThisMonth: tsm } = burnData;
    const spent = ts ?? tsm ?? 0;
    const income = safeData?.totalIncome ?? 0;
    if (proj > 0 && income > 0) {
      if (proj > income * 0.95)
        out.push({ type: "burn", priority: 1, title: "On Track to Overspend", body: `₹${Number(dbr).toFixed(0)}/day burn projects ₹${Number(proj).toFixed(0)} month-end — nearly full income of ₹${income.toFixed(0)}. Cut ₹${Math.ceil(Number(dbr) * 0.2)}/day.` });
      else if (proj < income * 0.4 && spent > 0)
        out.push({ type: "positive", priority: 5, title: "Low Burn Rate", body: `₹${Number(dbr).toFixed(0)}/day — projecting ₹${Number(proj).toFixed(0)} month-end. Saving ${Math.round((1 - proj / income) * 100)}% of income.` });
      else if (spent > 0)
        out.push({ type: "tip", priority: 4, title: "Spending Pace", body: `₹${Number(dbr).toFixed(0)}/day burn → ₹${Number(proj).toFixed(0)} projected month-end out of ₹${income.toFixed(0)}.` });
    }
  }

  if (anomalyData?.anomalies?.length > 0) {
    const top = anomalyData.anomalies[0];
    const m = top.averageForCategory > 0 ? Math.round(top.amount / top.averageForCategory) : "?";
    out.push({ type: "warning", priority: 2, title: `Spike in ${top.category}`, body: `${top.merchant || "Transaction"} of ₹${top.amount} is ${m}× average (₹${top.averageForCategory}). ${anomalyData.anomalies.length > 1 ? `${anomalyData.anomalies.length} spikes total.` : ""}` });
  }

  if (Array.isArray(goalData) && goalData.length > 0) {
    const active = goalData.filter(g => !g.disabled);
    const urgent = active
      .filter(g => g.deadline)
      .map(g => ({ ...g, daysLeft: Math.ceil((new Date(g.deadline) - new Date()) / 86400000), pct: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0 }))
      .filter(g => g.daysLeft > 0 && g.daysLeft < 60 && g.pct < 80)
      .sort((a, b) => a.daysLeft - b.daysLeft)[0];
    if (urgent) {
      const n = urgent.targetAmount - urgent.currentAmount;
      out.push({ type: "goal", priority: 2, title: `Goal Deadline — ${urgent.name}`, body: `${urgent.daysLeft}d left. ₹${n.toFixed(0)} needed — save ₹${urgent.daysLeft > 0 ? (n / urgent.daysLeft).toFixed(0) : n}/day.` });
    }
    const nd = active.find(g => g.targetAmount > 0 && g.currentAmount / g.targetAmount >= 0.8 && g.currentAmount < g.targetAmount);
    if (nd) out.push({ type: "positive", priority: 4, title: `Almost There — ${nd.name}`, body: `${Math.round((nd.currentAmount / nd.targetAmount) * 100)}% complete. ₹${(nd.targetAmount - nd.currentAmount).toFixed(0)} to go.` });
  }

  return out.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

// ─── AI narrative ──────────────────────────────────────────────────────────────
async function generateAINarrative(safeData, burnData, anomalyData, goalData) {
  try {
    const totalSpent = burnData?.totalSpent ?? burnData?.totalSpentThisMonth ?? 0;
    const totalIncome = safeData?.totalIncome ?? 0;
    const summary = {
      income: totalIncome, spent: totalSpent,
      healthScore: calcHealth(totalIncome, totalSpent),
      safeDailyLimit: safeData?.safeDailyLimit ?? safeData?.safeToSpendDaily ?? 0,
      dailyBurnRate: burnData?.dailyBurnRate ?? 0,
      projectedEoM: burnData?.projectedEoMSpend ?? 0,
      anomalyCount: anomalyData?.anomalies?.length ?? 0,
      activeGoals: Array.isArray(goalData) ? goalData.filter(g => !g.disabled).length : 0,
    };
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: `Finance data: ${JSON.stringify(summary)}\n\nGive ONE sharp, specific, actionable insight in 1-2 sentences. Use exact ₹ numbers. Direct — no greeting, no "I notice".\n\nJSON only: { "title": "5 words max", "body": "1-2 sentences", "type": "warning|positive|tip|goal|burn" }` }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (parsed.title && parsed.body && TYPES[parsed.type]) return parsed;
  } catch (e) { console.warn("[Insights] AI failed:", e.message); }
  return null;
}

// ─── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── Mini sparkline SVG ────────────────────────────────────────────────────────
function Sparkline({ values, color }) {
  if (!values || values.length < 2) return null;
  const w = 48, h = 20;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

// ─── Health ring ───────────────────────────────────────────────────────────────
function HealthRing({ score }) {
  const r = 14, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const clr = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={clr} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: "9px", fontWeight: 700, color: clr }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Insight card ──────────────────────────────────────────────────────────────
function InsightCard({ insight, index, isAI }) {
  const meta = TYPES[insight.type] || TYPES.tip;
  const Icon = meta.Icon;
  const bodyText = useTypewriter(isAI ? insight.body : null, 14);
  const displayBody = isAI ? bodyText : insight.body;

  return (
    <div
      className="group relative flex gap-3 p-3.5 rounded-2xl cursor-default"
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        animation: `slideUp 0.35s ease both`,
        animationDelay: `${index * 55}ms`,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = meta.color + "40"}
      onMouseLeave={e => e.currentTarget.style.borderColor = meta.border}
    >
      {/* Left accent line */}
      <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full"
        style={{ background: meta.color, opacity: 0.5 }} />

      {/* Icon */}
      <div className="shrink-0 w-7 h-7 rounded-xl flex items-center justify-center mt-0.5 ml-1"
        style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}22` }}>
        <Icon style={{ width: 13, height: 13, color: meta.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <p style={{ fontSize: "11.5px", fontWeight: 600, color: meta.color, lineHeight: 1.3 }}>
            {insight.title}
          </p>
          {isAI && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
              style={{ fontSize: "8.5px", fontWeight: 700, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", letterSpacing: "0.04em" }}>
              <Sparkles style={{ width: 7, height: 7 }} />AI
            </span>
          )}
          <span className="ml-auto shrink-0"
            style={{ fontSize: "8.5px", color: meta.color, opacity: 0.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {meta.label}
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "rgba(161,161,170,0.85)", lineHeight: 1.55 }}>
          {displayBody}
          {isAI && bodyText.length < insight.body.length && (
            <span style={{ display: "inline-block", width: "1px", height: "10px", background: "#a78bfa", marginLeft: "1px", verticalAlign: "middle", animation: "blink 0.9s step-end infinite" }} />
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ delay = 0 }) {
  return (
    <div className="flex gap-3 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", animationDelay: `${delay}ms` }}>
      <div className="shrink-0 w-7 h-7 rounded-xl ml-1" style={{ background: "rgba(255,255,255,0.04)", animation: "shimmer 1.6s ease-in-out infinite" }} />
      <div className="flex-1 space-y-2 pt-0.5">
        <div style={{ height: 9, width: "40%", borderRadius: 6, background: "rgba(255,255,255,0.04)", animation: "shimmer 1.6s ease-in-out infinite" }} />
        <div style={{ height: 8, width: "90%", borderRadius: 6, background: "rgba(255,255,255,0.03)", animation: "shimmer 1.6s ease-in-out infinite", animationDelay: "0.2s" }} />
        <div style={{ height: 8, width: "65%", borderRadius: 6, background: "rgba(255,255,255,0.03)", animation: "shimmer 1.6s ease-in-out infinite", animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function InsightsPanel() {
  const { user } = useUser();
  const [insights, setInsights] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [burnValues, setBurnValues] = useState([]);
  const [liveIndicator, setLive] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!user) return;
    setLoading(true); setAiInsight(null); setLive(false);
    try {
      const [safeRes, burnRes, anomalyRes, goalRes] = await Promise.allSettled([
        fetch(`/api/insights/safe-to-spend?userId=${user.id}`).then(r => r.json()),
        fetch(`/api/insights/burn-rate?userId=${user.id}`).then(r => r.json()),
        fetch(`/api/insights/anomalies?userId=${user.id}`).then(r => r.json()),
        fetch(`/api/goals?userId=${user.id}`).then(r => r.json()),
      ]);
      const safe = safeRes.status === "fulfilled" ? safeRes.value : null;
      const burn = burnRes.status === "fulfilled" ? burnRes.value : null;
      const anomaly = anomalyRes.status === "fulfilled" ? anomalyRes.value : null;
      const goals = goalRes.status === "fulfilled"
        ? (Array.isArray(goalRes.value) ? goalRes.value : goalRes.value?.goals ?? [])
        : [];

      const spent = burn?.totalSpent ?? burn?.totalSpentThisMonth ?? 0;
      const income = safe?.totalIncome ?? 0;
      if (income > 0) setHealthScore(calcHealth(income, spent));
      if (burn?.dailyBurnRate > 0) {
        const elapsed = burn.daysElapsed ?? 1;
        setBurnValues(Array.from({ length: Math.min(elapsed, 7) }, (_, i) =>
          Math.max(0, burn.dailyBurnRate * (1 + (Math.random() - 0.5) * 0.3))
        ));
      }

      const generated = generateRuleInsights(safe, burn, anomaly, goals);
      setInsights(generated);
      setLastUpdated(new Date());
      setLoading(false);
      setLive(true);

      const ai = await generateAINarrative(safe, burn, anomaly, goals);
      if (ai) setAiInsight(ai);
    } catch (err) {
      console.error("[Insights]", err);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInsights();
    const t = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchInsights]);

  const all = aiInsight
    ? [{ ...aiInsight, _isAI: true }, ...insights].slice(0, 5)
    : insights;

  return (
    <div className="rounded-3xl overflow-hidden flex flex-col"
      style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.06)" }}>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }
        @keyframes blink   { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse2  { 0%,100% { opacity:1;transform:scale(1) } 50% { opacity:0.6;transform:scale(0.85) } }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2.5">
          {/* Health ring or brain icon */}
          {healthScore !== null ? (
            <HealthRing score={healthScore} />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.15)" }}>
              <Brain style={{ width: 14, height: 14, color: "#a78bfa" }} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p style={{ fontSize: "12.5px", fontWeight: 600, color: "rgba(228,228,231,0.9)" }}>AI Insights</p>
              {liveIndicator && (
                <span className="flex items-center gap-1">
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", animation: "pulse2 2s ease infinite", display: "inline-block" }} />
                  <span style={{ fontSize: "9px", color: "#34d399", fontWeight: 600, letterSpacing: "0.06em" }}>LIVE</span>
                </span>
              )}
            </div>
            {lastUpdated && (
              <p style={{ fontSize: "9.5px", color: "rgba(113,113,122,0.7)" }}>
                {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Burn sparkline */}
          {burnValues.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: "9px", color: "rgba(113,113,122,0.6)" }}>7d burn</span>
              <Sparkline values={burnValues} color="#fb923c" />
            </div>
          )}
          <button onClick={fetchInsights} disabled={loading}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "rgba(113,113,122,0.7)" }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(228,228,231,0.8)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(113,113,122,0.7)"}>
            <RefreshCw style={{ width: 13, height: 13, animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* ── Insight list ── */}
      <div className="flex flex-col gap-2 p-3  overflow-y-auto"
        style={{ maxHeight: 170, scrollbarWidth: "none" }}>
        {loading ? (
          <><Skeleton /><Skeleton delay={80} /><Skeleton delay={160} /></>
        ) : all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Activity style={{ width: 16, height: 16, color: "rgba(113,113,122,0.5)" }} />
            </div>
            <p style={{ fontSize: "11.5px", color: "rgba(113,113,122,0.6)", textAlign: "center", lineHeight: 1.5 }}>
              Add income & transactions<br />to generate insights
            </p>
          </div>
        ) : (
          all.map((ins, i) => <InsightCard key={i} insight={ins} index={i} isAI={ins._isAI} />)
        )}
      </div>

      {/* ── Footer ── */}
      {!loading && all.length > 0 && (
        <div className="px-4 py-2.5 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontSize: "9.5px", color: "rgba(113,113,122,0.5)", letterSpacing: "0.04em" }}>
            {all.length} insight{all.length !== 1 ? "s" : ""} · refreshes every 5m
          </p>
          {/* <button
            onClick={() => window.dispatchEvent(new CustomEvent("openIntelligence"))}
            className="flex items-center gap-1 transition-all"
            style={{ fontSize: "9.5px", color: "rgba(167,139,250,0.7)", fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(167,139,250,0.7)"}>
            Ask agent
            <ArrowRight style={{ width: 9, height: 9 }} />
          </button> */}
        </div>
      )}
    </div>
  );
}