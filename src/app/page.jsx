'use client'
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { LogIn, TrendingUp, Shield, Zap, Target, ArrowRight, BarChart3, Brain, Camera, Upload } from 'lucide-react'
import FinanceTracker from "./components/financeTracker"
import Image from "next/image"

const FEATURES = [
  {
    icon: Brain,
    title: "Autonomous AI Agent",
    desc: "Multi-agent LangGraph system with Ledger Manager, Financial Analyst, Goal Specialist and Budget Advisor working in parallel.",
    accent: "#818cf8",
    bg: "rgba(129,140,248,0.06)",
    border: "rgba(129,140,248,0.15)",
  },
  {
    icon: BarChart3,
    title: "Real-time Insights",
    desc: "Live burn rate tracking, spending anomaly detection, health scores, and AI-generated financial nudges — updated every 5 minutes.",
    accent: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
  },
  {
    icon: Camera,
    title: "Receipt OCR Scanner",
    desc: "Tesseract.js runs in your browser. Snap a UPI screenshot or physical receipt — Groq AI extracts merchant, amount, and category instantly.",
    accent: "#fb923c",
    bg: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.15)",
  },
  {
    icon: Target,
    title: "Smart Savings Goals",
    desc: "Create goals, allocate funds, track progress. Money locked in goals is deducted from your spendable balance automatically.",
    accent: "#a78bfa",
    bg: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.15)",
  },
  {
    icon: Upload,
    title: "CSV Bank Import",
    desc: "Import from HDFC, ICICI, SBI, PhonePe, GPay, Paytm. Auto-detects format, deduplicates, and categorises every transaction.",
    accent: "#38bdf8",
    bg: "rgba(56,189,248,0.06)",
    border: "rgba(56,189,248,0.15)",
  },
  {
    icon: Shield,
    title: "Budget Guardian",
    desc: "Set category budgets with emoji status indicators. Get warned before you exceed — not after. Visual arc progress on every card.",
    accent: "#f87171",
    bg: "rgba(248,113,113,0.06)",
    border: "rgba(248,113,113,0.15)",
  },
]

const STATS = [
  { value: "4", label: "AI Agents", suffix: "" },
  { value: "9", label: "Smart Tools", suffix: "+" },
  { value: "100", label: "Faster than spreadsheets", suffix: "×" },
  { value: "₹0", label: "Cost to you", suffix: "" },
]

export default function Home() {
  return (
    <>
      <SignedIn>
        <div className="h-screen w-screen relative overflow-hidden text-zinc-100 bg-[#09090b]">
          <div className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: "url('/images/money_bank.png')", backgroundSize: "180px 180px", backgroundRepeat: "repeat" }} />
          <div className="relative z-10 w-full h-full">
            <FinanceTracker />
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">

          {/* Background texture */}
          <div className="fixed inset-0 z-0 opacity-[0.018] pointer-events-none"
            style={{ backgroundImage: "url('/images/money_bank.png')", backgroundSize: "160px 160px", backgroundRepeat: "repeat" }} />

          {/* Ambient glow top */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none z-0"
            style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />

          {/* ── NAV ── */}
          <nav className="relative z-20 w-full border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(9,9,11,0.8)", backdropFilter: "blur(12px)" }}>
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="#818cf8" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#e4e4e7", letterSpacing: "-0.02em" }}>MoneyMap</span>
                  <span style={{ fontSize: 10, color: "rgba(129,140,248,0.8)", display: "block", letterSpacing: "0.08em", marginTop: -2 }}>INTELLIGENCE</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "pulse 2s ease infinite" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#34d399", letterSpacing: "0.06em" }}>AI ACTIVE</span>
                </div>
                <SignInButton mode="modal">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: "#4f46e5", color: "#fff", border: "1px solid rgba(129,140,248,0.3)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#4338ca"}
                    onMouseLeave={e => e.currentTarget.style.background = "#4f46e5"}>
                    <LogIn style={{ width: 15, height: 15 }} />
                    Get Started
                  </button>
                </SignInButton>
              </div>
            </div>
          </nav>

          {/* ── HERO ── */}
          <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left: Copy */}
              <div className="flex flex-col gap-7">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
                  style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <Zap style={{ width: 12, height: 12, color: "#818cf8" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#818cf8", letterSpacing: "0.06em" }}>POWERED BY GROQ + LANGGRAPH</span>
                </div>

                <div>
                  <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#f4f4f5" }}>
                    Your money,<br />
                    <span style={{ color: "#818cf8" }}>finally intelligent</span>
                  </h1>
                  <p style={{ fontSize: 18, color: "rgba(161,161,170,0.85)", lineHeight: 1.6, marginTop: 20, maxWidth: 480 }}>
                    MoneyMap is an autonomous finance tracker with 4 AI agents that log transactions, detect anomalies, manage budgets, and guide your savings goals — all in real time.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <SignInButton mode="modal">
                    <button className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-base transition-all"
                      style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 0 30px rgba(99,102,241,0.25)" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                      Start tracking free
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                  </SignInButton>
                  <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-base transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(228,228,231,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
                    Watch demo
                  </button>
                </div>

                {/* Mini trust row */}
                <div className="flex items-center gap-4 pt-2">
                  {["No credit card", "Free forever", "Indian ₹ native"].map(t => (
                    <div key={t} className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(52,211,153,0.15)" }}>
                        <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3.5 6L6.5 2" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>
                      </div>
                      <span style={{ fontSize: 12, color: "rgba(113,113,122,0.8)" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Piggy bank + floating cards */}
              <div className="relative flex items-center justify-center min-h-[420px]">

                {/* Ambient glow */}
                <div className="absolute w-80 h-80 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

                {/* Piggy bank */}
                <div className="relative z-10" style={{ animation: "float 5s ease-in-out infinite" }}>
                  <Image src="/images/money_bank.png" alt="MoneyMap" width={320} height={380}
                    className="object-contain drop-shadow-2xl" priority />
                </div>

                {/* Floating stat card — Balance */}
                <div className="absolute top-8 -left-4 z-20 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(13,13,20,0.92)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", animation: "float 6s ease-in-out infinite 0.5s", minWidth: 160 }}>
                  <p style={{ fontSize: 10, color: "rgba(113,113,122,0.7)", letterSpacing: "0.06em", marginBottom: 3 }}>BALANCE</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#34d399", letterSpacing: "-0.02em" }}>₹94,510</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp style={{ width: 10, height: 10, color: "#34d399" }} />
                    <span style={{ fontSize: 10, color: "#34d399" }}>+12.4% this month</span>
                  </div>
                </div>

                {/* Floating AI card */}
                <div className="absolute bottom-10 -right-2 z-20 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(13,13,20,0.92)", border: "1px solid rgba(129,140,248,0.25)", backdropFilter: "blur(16px)", animation: "float 7s ease-in-out infinite 1s", minWidth: 180 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(129,140,248,0.15)" }}>
                      <Brain style={{ width: 12, height: 12, color: "#818cf8" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#818cf8" }}>AI Insight</span>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(161,161,170,0.8)", lineHeight: 1.4 }}>
                    Biryani up 3× avg.<br />₹420 spike detected.
                  </p>
                </div>

                {/* Floating health score */}
                <div className="absolute bottom-28 left-0 z-20 px-3 py-2.5 rounded-2xl"
                  style={{ background: "rgba(13,13,20,0.92)", border: "1px solid rgba(52,211,153,0.2)", backdropFilter: "blur(16px)", animation: "float 5.5s ease-in-out infinite 1.5s" }}>
                  <p style={{ fontSize: 9.5, color: "rgba(113,113,122,0.6)", letterSpacing: "0.05em" }}>HEALTH SCORE</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#34d399" }}>95<span style={{ fontSize: 12, fontWeight: 400 }}>/100</span></p>
                </div>

                {/* Coin animations */}
                {[
                  { top: "12%", right: "15%", size: 36, delay: "0s" },
                  { top: "55%", right: "-2%", size: 28, delay: "1.2s" },
                  { top: "80%", left: "22%", size: 22, delay: "0.6s" },
                ].map((coin, i) => (
                  <div key={i} className="absolute z-10 rounded-full flex items-center justify-center font-bold"
                    style={{
                      ...coin, width: coin.size, height: coin.size,
                      background: "linear-gradient(135deg,#f59e0b,#d97706)",
                      border: "2px solid rgba(251,191,36,0.5)",
                      color: "#78350f", fontSize: coin.size * 0.38,
                      animation: `coinFloat 4s ease-in-out infinite ${coin.delay}`,
                    }}>₹</div>
                ))}
              </div>
            </div>
          </section>

          {/* ── STATS BAR ── */}
          <section className="relative z-10 max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map(({ value, label, suffix }) => (
                <div key={label} className="flex flex-col items-center text-center py-6 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#e4e4e7", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {value}{suffix}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(113,113,122,0.7)", marginTop: 6, letterSpacing: "0.02em" }}>{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section className="relative z-10 max-w-6xl mx-auto px-6 py-12">
            <div className="text-center mb-12">
              <p style={{ fontSize: 11, fontWeight: 600, color: "#818cf8", letterSpacing: "0.1em", marginBottom: 12 }}>WHAT MONEYMAP DOES</p>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                Everything your spreadsheet<br />can't do
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc, accent, bg, border }) => (
                <div key={title} className="flex flex-col gap-3.5 p-5 rounded-2xl transition-all duration-200 cursor-default"
                  style={{ background: '#09090b', border: `1px solid ${border}` }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}25` }}>
                    <Icon style={{ width: 18, height: 18, color: accent }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 6 }}>{title}</p>
                    <p style={{ fontSize: 12.5, color: "rgba(161,161,170,0.75)", lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section className="relative z-10 max-w-6xl mx-auto px-6 py-12">
            <div className="rounded-3xl overflow-hidden"
              style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <div className="p-8 md:p-12">
                <p style={{ fontSize: 11, fontWeight: 600, color: "#818cf8", letterSpacing: "0.1em", marginBottom: 10 }}>HOW IT WORKS</p>
                <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.02em", marginBottom: 40 }}>
                  Just talk to it
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { step: "01", title: "Say what happened", desc: '"Paid ₹420 for biryani" or "Netflix 649 subscription" — the Ledger Manager logs it instantly, infers category, updates your budget.', color: "#818cf8" },
                    { step: "02", title: "Ask anything", desc: '"Where am I spending most?" or "How much can I spend today?" — the Financial Analyst fetches your data and answers with exact numbers.', color: "#34d399" },
                    { step: "03", title: "Set goals & track", desc: '"Save ₹10000 for a trip by May" — Goal Specialist creates it, calculates monthly targets, and tracks every rupee you allocate.', color: "#fb923c" },
                  ].map(({ step, title, desc, color }) => (
                    <div key={step} className="flex flex-col gap-3">
                      <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.1em" }}>{step}</span>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#e4e4e7" }}>{title}</h3>
                      <p style={{ fontSize: 13, color: "rgba(161,161,170,0.75)", lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="relative z-10 max-w-6xl mx-auto px-6 py-12 pb-20">
            <div className="text-center flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute w-64 h-64 rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
                <Image src="/images/money_bank.png" alt="MoneyMap" width={120} height={140}
                  className="object-contain relative z-10" style={{ animation: "float 5s ease-in-out infinite" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                  Take control of your<br />finances today
                </h2>
                <p style={{ fontSize: 16, color: "rgba(161,161,170,0.7)", marginTop: 14 }}>
                  Free. No spreadsheets. No manual entry. Just AI.
                </p>
              </div>
              <SignInButton mode="modal">
                <button className="flex items-center gap-2.5 px-9 py-4 rounded-xl font-semibold text-base transition-all"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 0 40px rgba(99,102,241,0.3)", fontSize: 16 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  Start for free
                  <ArrowRight style={{ width: 18, height: 18 }} />
                </button>
              </SignInButton>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="relative z-10 border-t py-8"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(9,9,11,0.6)" }}>
            <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="#818cf8" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>MoneyMap</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(113,113,122,0.6)" }}>
                © {new Date().getFullYear()} MoneyMap · Built with Groq, LangGraph & Next.js
              </p>
            </div>
          </footer>

          <style jsx global>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-14px); }
            }
            @keyframes coinFloat {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              33% { transform: translate(-8px, 12px) rotate(120deg); }
              66% { transform: translate(8px, -8px) rotate(240deg); }
            }
          `}</style>
        </div>
      </SignedOut>
    </>
  )
}