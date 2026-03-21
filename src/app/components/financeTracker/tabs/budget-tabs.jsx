"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, EyeOff, Eye, ShieldCheck, AlertTriangle, Zap, Plus } from "lucide-react"
import { IndianRupee } from "lucide-react"
import { ResetIcon } from "@radix-ui/react-icons"

function StatusRing({ percentage, status }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const pct = Math.min(percentage, 100)
  const dash = (pct / 100) * circ
  const color = status === "exceeded" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#10b981"

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-zinc-300">{Math.round(pct)}%</span>
      </div>
    </div>
  )
}

function BudgetStatusBadge({ status }) {
  if (status === "exceeded") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
      <AlertTriangle className="w-2.5 h-2.5" />EXCEEDED
    </span>
  )
  if (status === "warning") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
      <Zap className="w-2.5 h-2.5" />AT RISK
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <ShieldCheck className="w-2.5 h-2.5" />HEALTHY
    </span>
  )
}

export default function BudgetsTab(props) {
  const {
    categories, budgets, newBudget, setNewBudget,
    handleAddBudget, handleUpdateBudget, handleDeleteBudget,
    handleToggleBudgetStatus, handleResetBudget,
  } = props

  const [isEditing, setIsEditing] = useState(false)
  const [editingBudgetId, setEditingBudgetId] = useState(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState(null)

  const handleEditBudget = (budget) => {
    setNewBudget({ category: budget.category, amount: budget.amount })
    setIsEditing(true)
    setEditingBudgetId(budget._id)
  }

  const handleSaveEdit = () => {
    handleUpdateBudget(editingBudgetId)
    resetForm()
  }

  const confirmDelete = (id) => { setBudgetToDelete(id); setShowDeleteAlert(true) }
  const executeDelete = () => { handleDeleteBudget(budgetToDelete); setShowDeleteAlert(false); setBudgetToDelete(null) }
  const resetForm = () => { setNewBudget({ category: "", amount: "" }); setIsEditing(false); setEditingBudgetId(null) }

  const enabledBudgets = budgets.filter(b => b.status !== "disabled")
  const disabledBudgets = budgets.filter(b => b.status === "disabled")
  const totalBudgeted = enabledBudgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = enabledBudgets.reduce((s, b) => s + Number(b.spent || 0), 0)
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── Summary bar ── */}
      {enabledBudgets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Budgeted", value: totalBudgeted, color: "text-zinc-200" },
            { label: "Total Spent", value: totalSpent, color: totalSpent > totalBudgeted ? "text-rose-400" : "text-emerald-400" },
            { label: "Remaining", value: totalBudgeted - totalSpent, color: (totalBudgeted - totalSpent) >= 0 ? "text-indigo-400" : "text-rose-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.03] rounded-2xl p-3 border border-white/[0.06]">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
              <p className={`font-bold text-sm ${color} flex items-center gap-0.5`}>
                <IndianRupee className="w-3 h-3" />{Math.abs(Number(value)).toFixed(0)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Form ── */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4 space-y-3">
        <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">
          {isEditing ? "Edit Budget" : "New Budget"}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Category</Label>
            <Select value={newBudget.category} onValueChange={v => setNewBudget({ ...newBudget, category: v })}>
              <SelectTrigger className="bg-white/[0.04] border-white/10 text-white rounded-xl h-9 text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#13131f] border-white/10 text-white rounded-xl">
                {categories.filter(c => c.type === "expense").map(c => (
                  <SelectItem key={c._id || c.id} value={c.name} className="focus:bg-white/10 rounded-lg">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Monthly Limit (₹)</Label>
            <Input
              type="number" value={newBudget.amount}
              onChange={e => setNewBudget({ ...newBudget, amount: e.target.value })}
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-9 text-sm"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-9 text-sm">Update</Button>
                <Button onClick={resetForm} variant="outline" className="flex-1 border-white/10 text-zinc-400 bg-white/[0.03] hover:bg-white/[0.07] rounded-xl h-9 text-sm">Cancel</Button>
              </>
            ) : (
              <Button onClick={handleAddBudget}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 rounded-xl h-9 text-sm shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all">
                <Plus className="w-3.5 h-3.5 mr-1.5" />Add Budget
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Budget Cards ── */}
      {budgets.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">
          <ShieldCheck className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No budgets yet. Add your first budget above.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {budgets.map(budget => {
            const spent = Number(budget.spent || 0)
            const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
            const status = pct >= 100 ? "exceeded" : pct >= 80 ? "warning" : "good"
            const disabled = budget.status === "disabled"

            return (
              <div key={budget._id || budget.id}
                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${disabled
                    ? "bg-white/[0.02] border-white/[0.04] opacity-50"
                    : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10"
                  }`}
              >
                {/* Status ring */}
                {!disabled ? (
                  <StatusRing percentage={pct} status={status} />
                ) : (
                  <div className="w-12 h-12 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <EyeOff className="w-4 h-4 text-zinc-600" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-semibold text-sm ${disabled ? "text-zinc-600" : "text-zinc-200"}`}>
                      {budget.category}
                    </span>
                    {disabled
                      ? <span className="text-[10px] text-zinc-600 border border-white/10 px-2 py-0.5 rounded-full">PAUSED</span>
                      : <BudgetStatusBadge status={status} />
                    }
                  </div>

                  {!disabled && (
                    <>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: status === "exceeded" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#10b981",
                            boxShadow: `0 0 6px ${status === "exceeded" ? "#ef444460" : status === "warning" ? "#f59e0b60" : "#10b98160"}`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <IndianRupee className="w-3 h-3 text-zinc-500" />
                        <span>{spent.toFixed(0)}</span>
                        <span className="text-zinc-700">/</span>
                        <IndianRupee className="w-3 h-3 text-zinc-500" />
                        <span>{Number(budget.amount).toFixed(0)}</span>
                        <span className="text-zinc-700 mx-1">·</span>
                        <span className={budget.amount - spent >= 0 ? "text-emerald-500" : "text-rose-500"}>
                          {budget.amount - spent >= 0 ? "₹" + (budget.amount - spent).toFixed(0) + " left" : "₹" + Math.abs(budget.amount - spent).toFixed(0) + " over"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" className="h-8 w-8 text-zinc-600 hover:text-zinc-200 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#13131f]/95 backdrop-blur-2xl border-white/10 text-white rounded-xl shadow-2xl">
                    <DropdownMenuItem onClick={() => handleEditBudget(budget)} className="hover:bg-white/10 cursor-pointer focus:bg-white/10 rounded-lg text-sm">
                      <Edit className="mr-2 h-3.5 w-3.5" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResetBudget(budget._id)} className="hover:bg-white/10 cursor-pointer focus:bg-white/10 rounded-lg text-sm">
                      <ResetIcon className="mr-2 h-3.5 w-3.5" />Reset Spent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleBudgetStatus(budget._id)} className="hover:bg-white/10 cursor-pointer focus:bg-white/10 rounded-lg text-sm">
                      {budget.status === "disabled" ? <><Eye className="mr-2 h-3.5 w-3.5" />Enable</> : <><EyeOff className="mr-2 h-3.5 w-3.5" />Disable</>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => confirmDelete(budget._id)} className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer focus:bg-rose-500/10 focus:text-rose-300 rounded-lg mt-1 text-sm">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[#13131f] border-white/10 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">This action cannot be undone.</AlertDialogDescription>
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