"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Plus, Target, Calendar, TrendingUp, Edit, Trash2,
  EyeOff, Eye, MoreHorizontal, ArrowDownCircle, ArrowUpCircle,
  Wallet, ChevronDown, ChevronUp, History, Zap,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IndianRupee } from "lucide-react"

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 700) {
  const [val, setVal] = useState(0)
  const raf = useRef()
  useEffect(() => {
    const start = performance.now()
    const tick = now => {
      const p = Math.min((now - start) / duration, 1)
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target])
  return val
}

// ─── Arc progress ring ────────────────────────────────────────────────────────
function ArcRing({ pct, size = 64, stroke = 5, animate = true }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const [displayed, setDisplayed] = useState(animate ? 0 : pct)
  const raf = useRef()

  useEffect(() => {
    if (!animate) { setDisplayed(pct); return }
    const start = performance.now()
    const tick = now => {
      const p = Math.min((now - start) / 900, 1)
      setDisplayed(pct * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [pct])

  const clamped = Math.min(Math.max(displayed, 0), 100)
  const dash = (clamped / 100) * circ
  const clr = clamped >= 100 ? "#10b981" : clamped >= 60 ? "#6366f1" : clamped >= 30 ? "#f59e0b" : "#64748b"

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={clr} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: clamped > 10 ? `drop-shadow(0 0 4px ${clr}80)` : "none" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span style={{ fontSize: 11, fontWeight: 700, color: clr }}>{Math.round(clamped)}%</span>
      </div>
    </div>
  )
}

// ─── Days left badge ──────────────────────────────────────────────────────────
function DaysLeft({ deadline }) {
  if (!deadline) return null
  const d = Math.ceil((new Date(deadline) - new Date()) / 86400000)
  if (d < 0) return <span style={{ fontSize: 10, color: "#f87171", fontWeight: 600 }}>Overdue</span>
  if (d === 0) return <span style={{ fontSize: 10, color: "#f87171", fontWeight: 600 }}>Due today ⚡</span>
  if (d <= 7) return <span style={{ fontSize: 10, color: "#fb923c", fontWeight: 600 }}>{d}d left ⚡</span>
  if (d <= 30) return <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 600 }}>{d}d left</span>
  return <span style={{ fontSize: 10, color: "rgba(113,113,122,0.6)" }}>{d}d left</span>
}

// ─── Allocate funds modal ─────────────────────────────────────────────────────
function AllocateModal({ goal, open, onClose, onSuccess }) {
  const { user } = useUser()
  const [amount, setAmount] = useState("")
  const [direction, setDir] = useState("add")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const maxWithdraw = goal?.currentAmount || 0
  const maxAdd = goal ? goal.targetAmount - goal.currentAmount : 0

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return }
    if (direction === "withdraw" && amt > maxWithdraw) {
      setError(`Only ₹${maxWithdraw.toFixed(0)} available to withdraw`); return
    }
    if (direction === "add" && amt > maxAdd) {
      setError(`Goal only needs ₹${maxAdd.toFixed(0)} more`); return
    }
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/goals/${goal._id}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount: amt, direction, note }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed"); setLoading(false); return }
      onSuccess(data.goal)
      setAmount(""); setNote(""); setLoading(false); onClose()
    } catch (e) { setError(e.message); setLoading(false) }
  }

  if (!goal) return null

  const pctAfter = goal.targetAmount > 0
    ? ((direction === "add"
      ? Math.min(goal.currentAmount + parseFloat(amount || 0), goal.targetAmount)
      : Math.max(goal.currentAmount - parseFloat(amount || 0), 0)
    ) / goal.targetAmount) * 100
    : 0

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setAmount(""); setNote(""); setError(""); onClose() } }}>
      <DialogContent className="rounded-2xl border-white/10 text-white max-w-sm p-0 overflow-hidden"
        style={{ background: "#0d0d14" }}>
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-[15px] font-semibold text-zinc-200">{goal.name}</DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Direction toggle */}
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {[["add", "Add Funds", "#10b981"], ["withdraw", "Withdraw", "#f87171"]].map(([v, l, c]) => (
              <button key={v} onClick={() => { setDir(v); setAmount(""); setError("") }}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={{
                  background: direction === v ? `${c}18` : "transparent",
                  color: direction === v ? c : "rgba(113,113,122,0.7)",
                  border: direction === v ? `1px solid ${c}30` : "1px solid transparent",
                }}>
                {l}
              </button>
            ))}
          </div>

          {/* Current state */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <ArcRing pct={goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0} size={48} stroke={4} animate={false} />
            <div>
              <p style={{ fontSize: 11, color: "rgba(113,113,122,0.6)", marginBottom: 2 }}>Current savings</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7" }}>
                ₹{goal.currentAmount.toLocaleString("en-IN")} <span style={{ color: "rgba(113,113,122,0.5)", fontWeight: 400, fontSize: 12 }}>of ₹{goal.targetAmount.toLocaleString("en-IN")}</span>
              </p>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <Label className="text-[11px] text-zinc-500 uppercase tracking-widest block mb-2">Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input value={amount} onChange={e => { setAmount(e.target.value); setError("") }} type="number" min="1"
                className="pl-8 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-10 text-sm"
                placeholder={direction === "add" ? `max ₹${maxAdd.toFixed(0)}` : `max ₹${maxWithdraw.toFixed(0)}`} />
            </div>
            {/* Quick amount pills */}
            <div className="flex gap-1.5 mt-2">
              {[500, 1000, 2000].map(q => (
                <button key={q} onClick={() => setAmount(String(Math.min(q, direction === "add" ? maxAdd : maxWithdraw)))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(161,161,170,0.8)" }}>
                  ₹{q >= 1000 ? q / 1000 + "k" : q}
                </button>
              ))}
              <button onClick={() => setAmount(String(direction === "add" ? maxAdd : maxWithdraw))}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(161,161,170,0.8)" }}>
                Max
              </button>
            </div>
          </div>

          {/* Preview */}
          {parseFloat(amount) > 0 && (
            <div className="p-3 rounded-xl space-y-2" style={{ background: direction === "add" ? "rgba(16,185,129,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${direction === "add" ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)"}` }}>
              <p style={{ fontSize: 11, color: "rgba(113,113,122,0.7)" }}>After this {direction === "add" ? "allocation" : "withdrawal"}:</p>
              <div className="flex items-center gap-2">
                <ArcRing pct={pctAfter} size={32} stroke={3} animate={false} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: direction === "add" ? "#10b981" : "#f87171" }}>
                    ₹{Math.round(direction === "add"
                      ? Math.min(goal.currentAmount + parseFloat(amount), goal.targetAmount)
                      : Math.max(goal.currentAmount - parseFloat(amount), 0)).toLocaleString("en-IN")}
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(113,113,122,0.6)" }}>
                    {direction === "add" ? "Your available balance will decrease by ₹" + parseFloat(amount).toFixed(0) : "₹" + parseFloat(amount).toFixed(0) + " returns to your available balance"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <Input value={note} onChange={e => setNote(e.target.value)}
            className="bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-9 text-sm"
            placeholder="Note (optional)" />

          {error && <p style={{ fontSize: 11, color: "#f87171" }}>{error}</p>}

          <Button onClick={handleSubmit} disabled={loading || !amount}
            className="w-full h-10 rounded-xl text-sm font-semibold border-0 transition-all"
            style={{
              background: direction === "add" ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#be123c,#f43f5e)",
              opacity: !amount ? 0.5 : 1,
            }}>
            {loading ? "Processing…" : direction === "add" ? `Allocate ₹${amount || "—"} to Goal` : `Withdraw ₹${amount || "—"} from Goal`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Goal card ────────────────────────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete, onToggle, onAllocate, fetchGoals }) {
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  const remaining = goal.targetAmount - goal.currentAmount
  const disabled = goal.disabled
  const [showHistory, setShowHistory] = useState(false)
  const allocations = goal.allocations || []

  // Monthly savings needed
  let monthlySavings = null
  if (goal.deadline && remaining > 0) {
    const now = new Date(), dl = new Date(goal.deadline)
    const months = Math.max(1, (dl.getFullYear() - now.getFullYear()) * 12 + (dl.getMonth() - now.getMonth()))
    monthlySavings = remaining / months
  }

  return (
    <div className={`group relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden ${disabled ? "opacity-50" : "hover:border-white/10"
      }`} style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Completion glow */}
      {pct >= 100 && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(16,185,129,0.08) 0%,transparent 60%)" }} />}

      {/* Main content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <ArcRing pct={pct} size={56} stroke={4} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: disabled ? "rgba(113,113,122,0.7)" : "#e4e4e7" }}>{goal.name}</h3>
              {disabled && (
                <span style={{ fontSize: 9, color: "#71717a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "1px 6px", letterSpacing: "0.06em" }}>PAUSED</span>
              )}
              {pct >= 100 && <span style={{ fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 999, padding: "1px 6px", fontWeight: 700 }}>COMPLETE 🎉</span>}
            </div>
            {goal.deadline && (
              <div className="flex items-center gap-1.5">
                <Calendar style={{ width: 11, height: 11, color: "rgba(113,113,122,0.5)" }} />
                <span style={{ fontSize: 10.5, color: "rgba(113,113,122,0.6)" }}>{new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span style={{ color: "rgba(113,113,122,0.3)" }}>·</span>
                <DaysLeft deadline={goal.deadline} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!disabled && remaining > 0 && (
              <button onClick={() => onAllocate(goal)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.12)" }}>
                <Plus style={{ width: 11, height: 11 }} />Add
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  style={{ color: "rgba(113,113,122,0.7)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <MoreHorizontal style={{ width: 13, height: 13 }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#13131f]/98 backdrop-blur-2xl border-white/10 text-white rounded-xl shadow-2xl">
                <DropdownMenuItem onClick={() => onEdit(goal)} className="hover:bg-white/10 cursor-pointer focus:bg-white/10 rounded-lg text-sm"><Edit className="mr-2 h-3.5 w-3.5" />Edit goal</DropdownMenuItem>
                {goal.currentAmount > 0 && !disabled && (
                  <DropdownMenuItem onClick={() => onAllocate(goal, "withdraw")} className="hover:bg-white/10 cursor-pointer focus:bg-white/10 rounded-lg text-sm"><ArrowUpCircle className="mr-2 h-3.5 w-3.5 text-amber-400" />Withdraw funds</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onToggle(goal._id)} className="hover:bg-white/10 cursor-pointer focus:bg-white/10 rounded-lg text-sm">
                  {disabled ? <><Eye className="mr-2 h-3.5 w-3.5" />Resume goal</> : <><EyeOff className="mr-2 h-3.5 w-3.5" />Pause goal</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(goal._id)} className="text-rose-400 hover:bg-rose-500/10 cursor-pointer focus:bg-rose-500/10 rounded-lg mt-1 text-sm">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Amount row */}
        {!disabled && (
          <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-1" style={{ fontSize: 12, color: "rgba(161,161,170,0.7)" }}>
              <IndianRupee style={{ width: 11, height: 11 }} />
              <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{goal.currentAmount.toLocaleString("en-IN")}</span>
              <span style={{ color: "rgba(113,113,122,0.5)" }}>/</span>
              <IndianRupee style={{ width: 11, height: 11 }} />
              <span>{goal.targetAmount.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {remaining <= 0 ? (
                <span style={{ color: "#10b981" }}>Goal reached! 🎉</span>
              ) : (
                <span style={{ color: "rgba(113,113,122,0.6)" }}>₹{remaining.toLocaleString("en-IN")} to go</span>
              )}
            </div>
          </div>
        )}

        {/* Monthly savings needed */}
        {monthlySavings && !disabled && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
            <Zap style={{ width: 11, height: 11, color: "#818cf8" }} />
            <span style={{ fontSize: 10.5, color: "#818cf8" }}>Save <strong>₹{Math.ceil(monthlySavings).toLocaleString("en-IN")}/month</strong> to reach your goal on time</span>
          </div>
        )}
      </div>

      {/* Allocation history toggle */}
      {allocations.length > 0 && (
        <>
          <button onClick={() => setShowHistory(h => !h)}
            className="flex items-center justify-between px-4 py-2.5 w-full transition-colors"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", color: "rgba(113,113,122,0.7)" }}>
            <div className="flex items-center gap-1.5">
              <History style={{ width: 11, height: 11 }} />
              <span style={{ fontSize: 10.5, fontWeight: 500 }}>{allocations.length} allocation{allocations.length !== 1 ? "s" : ""}</span>
            </div>
            {showHistory ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
          </button>

          {showHistory && (
            <div className="px-4 pb-3 space-y-1.5">
              {[...allocations].reverse().slice(0, 8).map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {a.direction === "add"
                      ? <ArrowDownCircle style={{ width: 12, height: 12, color: "#10b981", flexShrink: 0 }} />
                      : <ArrowUpCircle style={{ width: 12, height: 12, color: "#f87171", flexShrink: 0 }} />}
                    <span style={{ fontSize: 11, color: "rgba(161,161,170,0.7)" }}>{a.note || (a.direction === "add" ? "Allocated" : "Withdrawn")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 11, fontWeight: 600, color: a.direction === "add" ? "#10b981" : "#f87171" }}>
                      {a.direction === "add" ? "+" : "−"}₹{Number(a.amount).toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(113,113,122,0.5)" }}>
                      {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SavingsGoalsTab(props) {
  const {
    savingsGoals, setSavingsGoals, newGoal, setNewGoal, categories,
    handleAddSavingsGoal, handleUpdateSavingsGoal,
    handleDeleteSavingsGoal, handleToggleSavingsGoalStatus,
    fetchGoals,
  } = props

  const [isEditing, setIsEditing] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState(null)
  const [allocateGoal, setAllocateGoal] = useState(null)
  const [allocateDir, setAllocateDir] = useState("add")

  const activeGoals = savingsGoals.filter(g => !g.disabled)
  const totalTargeted = activeGoals.reduce((s, g) => s + g.targetAmount, 0)
  const totalSaved = activeGoals.reduce((s, g) => s + g.currentAmount, 0)
  const overallPct = totalTargeted > 0 ? (totalSaved / totalTargeted) * 100 : 0
  const totalAllocated = savingsGoals.reduce((s, g) => s + g.currentAmount, 0)

  const handleEditGoal = (goal) => {
    setNewGoal({ name: goal.name, targetAmount: goal.targetAmount, currentAmount: goal.currentAmount, disabled: goal.disabled, deadline: goal.deadline ? goal.deadline.split("T")[0] : "" })
    setIsEditing(true)
    setEditingGoalId(goal._id)
  }

  const handleSaveEdit = () => { handleUpdateSavingsGoal(editingGoalId, newGoal); resetForm() }
  const confirmDelete = id => { setGoalToDelete(id); setShowDeleteAlert(true) }
  const executeDelete = () => { handleDeleteSavingsGoal(goalToDelete); setShowDeleteAlert(false); setGoalToDelete(null) }
  const resetForm = () => { setNewGoal({ name: "", targetAmount: "", currentAmount: "", deadline: "" }); setIsEditing(false); setEditingGoalId(null) }

  const handleAllocateOpen = (goal, dir = "add") => { setAllocateGoal(goal); setAllocateDir(dir) }
  const handleAllocateSuccess = (updatedGoal) => {
    if (setSavingsGoals) {
      setSavingsGoals(prev => prev.map(g => g._id === updatedGoal._id ? { ...g, ...updatedGoal } : g))
    }
    if (fetchGoals) fetchGoals()
  }

  return (
    <div className="w-full flex flex-col gap-5">

      {/* ── Summary banner ── */}
      {activeGoals.length > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <ArcRing pct={overallPct} size={52} stroke={4} />
          <div className="flex-1">
            <p style={{ fontSize: 10, color: "rgba(113,113,122,0.7)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Overall Progress</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>
              ₹{totalSaved.toLocaleString("en-IN")} <span style={{ color: "rgba(113,113,122,0.5)", fontWeight: 400 }}>saved of ₹{totalTargeted.toLocaleString("en-IN")}</span>
            </p>
            <p style={{ fontSize: 11, color: "rgba(113,113,122,0.6)", marginTop: 1 }}>
              across {activeGoals.length} active goal{activeGoals.length !== 1 ? "s" : ""}
            </p>
          </div>
          {totalAllocated > 0 && (
            <div className="text-right">
              <p style={{ fontSize: 9.5, color: "rgba(113,113,122,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Locked in goals</p>
              <div className="flex items-center gap-0.5 justify-end mt-1">
                <IndianRupee style={{ width: 12, height: 12, color: "#818cf8" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#818cf8" }}>{totalAllocated.toLocaleString("en-IN")}</span>
              </div>
              <p style={{ fontSize: 9.5, color: "rgba(113,113,122,0.4)" }}>deducted from balance</p>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Form ── */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: 10, color: "rgba(113,113,122,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
          {isEditing ? "Edit Goal" : "New Savings Goal"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Goal Name", key: "name", type: "text", ph: "e.g. Flight Ticket, Emergency Fund" },
            { label: "Target Amount (₹)", key: "targetAmount", type: "number", ph: "0" },
            { label: "Already Saved (₹)", key: "currentAmount", type: "number", ph: "0" },
            { label: "Target Date (Optional)", key: "deadline", type: "date", ph: "" },
          ].map(({ label, key, type, ph }) => (
            <div key={key}>
              <Label className="text-[11px] text-zinc-500 mb-1.5 block uppercase tracking-wider">{label}</Label>
              <Input type={type} value={newGoal[key] || ""} onChange={e => setNewGoal({ ...newGoal, [key]: e.target.value })}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-700 rounded-xl h-9 text-sm [color-scheme:dark]"
                placeholder={ph} />
            </div>
          ))}
        </div>
        {isEditing ? (
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-9 text-sm">
              <Edit className="w-3.5 h-3.5 mr-1.5" />Update Goal
            </Button>
            <Button onClick={resetForm} variant="outline" className="border-white/10 text-zinc-400 bg-white/[0.03] hover:bg-white/[0.07] rounded-xl h-9 text-sm px-4">Cancel</Button>
          </div>
        ) : (
          <Button onClick={handleAddSavingsGoal}
            className="w-full h-9 rounded-xl text-sm font-semibold border-0"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.2)" }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Create Savings Goal
          </Button>
        )}
      </div>

      {/* ── Balance impact note ── */}
      {savingsGoals.length > 0 && totalAllocated > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)" }}>
          <Wallet style={{ width: 14, height: 14, color: "#818cf8", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "rgba(129,140,248,0.8)", lineHeight: 1.5 }}>
            <strong style={{ color: "#818cf8" }}>₹{totalAllocated.toLocaleString("en-IN")}</strong> is locked in your savings goals. This is deducted from your available balance but is <em>not</em> an expense — it's your own money set aside for goals.
          </p>
        </div>
      )}

      {/* ── Goal cards ── */}
      {savingsGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Target style={{ width: 22, height: 22, color: "rgba(113,113,122,0.4)" }} />
          </div>
          <div className="text-center">
            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(161,161,170,0.7)", marginBottom: 4 }}>No savings goals yet</p>
            <p style={{ fontSize: 12, color: "rgba(113,113,122,0.5)" }}>Create a goal above to start tracking your savings</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {savingsGoals.map(goal => (
            <GoalCard key={goal._id || goal.id} goal={goal}
              onEdit={handleEditGoal}
              onDelete={confirmDelete}
              onToggle={handleToggleSavingsGoalStatus}
              onAllocate={handleAllocateOpen}
              fetchGoals={fetchGoals} />
          ))}
        </div>
      )}

      {/* ── Allocate modal ── */}
      <AllocateModal
        goal={allocateGoal}
        open={!!allocateGoal}
        onClose={() => setAllocateGoal(null)}
        onSuccess={handleAllocateSuccess} />

      {/* ── Delete confirm ── */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[#0d0d14] border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">Any money allocated to it will not automatically return to your balance. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}