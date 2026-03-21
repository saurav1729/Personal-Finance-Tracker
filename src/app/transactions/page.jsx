"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser } from "@clerk/nextjs"
import {
  TrendingUp, TrendingDown, Search, ArrowUpDown, X,
  Trash2, ArrowLeft, IndianRupee, Zap, Filter, Calendar,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx, onDelete, index }) {
  const isIncome = tx.type === "income"
  const date = new Date(tx.createdAt)
  const isToday = date.toDateString() === new Date().toDateString()
  const isYest = date.toDateString() === new Date(Date.now() - 86400000).toDateString()

  const dateLabel = isToday ? "Today"
    : isYest ? "Yesterday"
      : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3.5 border-b transition-all duration-150 hover:bg-white/[0.03]"
      style={{
        borderColor: "rgba(255,255,255,0.04)",
        animationDelay: `${Math.min(index * 20, 400)}ms`,
      }}
    >
      {/* Icon */}
      <div
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: isIncome ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
          border: `1px solid ${isIncome ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
        }}
      >
        {isIncome
          ? <TrendingUp style={{ width: 15, height: 15, color: "#10b981" }} />
          : <TrendingDown style={{ width: 15, height: 15, color: "#f43f5e" }} />
        }
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }} className="truncate">
            {tx.merchant || tx.category}
          </span>
          <span style={{ fontSize: 10, color: "rgba(113,113,122,0.7)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 999, padding: "1px 7px" }}>
            {tx.category}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {tx.description && tx.description !== tx.category && tx.description !== tx.merchant && (
            <span style={{ fontSize: 11, color: "rgba(113,113,122,0.6)" }} className="truncate">{tx.description}</span>
          )}
          <span style={{ fontSize: 10.5, color: "rgba(113,113,122,0.45)" }}>
            {dateLabel} · {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div
        className="shrink-0 flex items-center gap-0.5 tabular-nums"
        style={{ fontSize: 14, fontWeight: 700, color: isIncome ? "#10b981" : "#f43f5e" }}
      >
        <span>{isIncome ? "+" : "−"}</span>
        <IndianRupee style={{ width: 12, height: 12 }} />
        <span>{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(tx)}
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
        style={{ color: "rgba(113,113,122,0.6)" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#f43f5e"; e.currentTarget.style.background = "rgba(244,63,94,0.1)" }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(113,113,122,0.6)"; e.currentTarget.style.background = "transparent" }}
      >
        <Trash2 style={{ width: 13, height: 13 }} />
      </button>
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b animate-pulse" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="w-9 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="h-2 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
      </div>
      <div className="h-3.5 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
  )
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, color, accent, icon: Icon, count }) {
  return (
    <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-2xl min-w-0"
      style={{ background: `${accent}07`, border: `1px solid ${accent}18` }}>
      <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
        <Icon style={{ width: 13, height: 13, color: accent }} />
      </div>
      <div className="min-w-0">
        <p style={{ fontSize: 9, color: "rgba(113,113,122,0.65)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{label}</p>
        <p className="flex items-center gap-0.5" style={{ fontSize: 14, fontWeight: 700, color }}>
          {count !== undefined ? (
            <>{count}<span style={{ fontSize: 10, color: "rgba(113,113,122,0.5)", fontWeight: 400, marginLeft: 3 }}>entries</span></>
          ) : (
            <><IndianRupee style={{ width: 11, height: 11 }} />{Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Group header ─────────────────────────────────────────────────────────────
function groupByDate(txs) {
  const groups = {}
  txs.forEach(tx => {
    const d = new Date(tx.createdAt)
    const today = new Date()
    const yest = new Date(Date.now() - 86400000)
    let label
    if (d.toDateString() === today.toDateString()) label = "Today"
    else if (d.toDateString() === yest.toDateString()) label = "Yesterday"
    else label = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    if (!groups[label]) groups[label] = []
    groups[label].push(tx)
  })
  return groups
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AllTransactions() {
  const { user } = useUser()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("all")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sort, setSort] = useState("newest")
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (user) fetchTransactions()
  }, [user])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?userId=${user.id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTransactions(Array.isArray(data) ? data : data.transactions || [])
    } catch { setTransactions([]) }
    finally { setLoading(false) }
  }

  const handleDelete = async (tx) => {
    try {
      const res = await fetch(`/api/transactions/${tx._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t._id !== tx._id))
        setDeleteConfirm(null)
      }
    } catch (e) { console.error(e) }
  }

  // Period filter
  const periodFiltered = useMemo(() => {
    const now = new Date()
    return transactions.filter(t => {
      if (period === "all") return true
      const d = new Date(t.createdAt)
      if (period === "day") return d.toDateString() === now.toDateString()
      if (period === "week") { const wa = new Date(); wa.setDate(now.getDate() - 7); return d >= wa }
      if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      return true
    })
  }, [transactions, period])

  // Search + type filter + sort
  const displayed = useMemo(() => {
    let list = [...periodFiltered]
    if (typeFilter !== "all") list = list.filter(t => t.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        (t.category || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.merchant || "").toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      )
    }
    if (sort === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (sort === "oldest") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    if (sort === "highest") list.sort((a, b) => b.amount - a.amount)
    if (sort === "lowest") list.sort((a, b) => a.amount - b.amount)
    return list
  }, [periodFiltered, typeFilter, search, sort])

  const totalIncome = displayed.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = displayed.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpense

  const grouped = sort === "newest" || sort === "oldest" ? groupByDate(displayed) : null

  return (
    <div className="min-h-screen" style={{ background: "#09090b" }}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* ── Back nav ── */}
        <Link href="/" className="inline-flex items-center gap-1.5 transition-colors"
          style={{ fontSize: 13, color: "rgba(113,113,122,0.7)" }}
          onMouseEnter={e => e.currentTarget.style.color = "#e4e4e7"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(113,113,122,0.7)"}>
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Back to Dashboard
        </Link>

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e4e4e7", letterSpacing: "-0.02em" }}>Transactions</h1>
            <p style={{ fontSize: 12, color: "rgba(113,113,122,0.6)", marginTop: 2 }}>
              {transactions.length.toLocaleString()} total entries
            </p>
          </div>
          {/* Period selector */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 rounded-xl text-[12px] font-medium"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(228,228,231,0.8)", width: 130 }}>
              <Calendar style={{ width: 12, height: 12, marginRight: 6, opacity: 0.5 }} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.1)" }} className="text-white rounded-xl">
              {[["all", "All Time"], ["day", "Today"], ["week", "This Week"], ["month", "This Month"]].map(([v, l]) => (
                <SelectItem key={v} value={v} className="focus:bg-white/10 rounded-lg text-sm">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Stats ── */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <StatChip label="Income" value={totalIncome} color="#10b981" accent="#10b981" icon={TrendingUp} />
          <StatChip label="Expenses" value={totalExpense} color="#f43f5e" accent="#f43f5e" icon={TrendingDown} />
          <StatChip label="Net" value={Math.abs(net)} color={net >= 0 ? "#818cf8" : "#fb923c"} accent={net >= 0 ? "#818cf8" : "#fb923c"} icon={Zap} />
          <StatChip label="Count" count={displayed.length} color="#e4e4e7" accent="#71717a" icon={Filter} />
        </div>

        {/* ── Search + filter + sort ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "rgba(113,113,122,0.6)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, category, amount…"
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, paddingLeft: 36, paddingRight: search ? 32 : 12, height: 36,
                fontSize: 13, color: "#e4e4e7", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(113,113,122,0.6)" }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>

          {/* Type pills */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[["all", "All"], ["income", "Income"], ["expense", "Expense"]].map(([v, l]) => (
              <button key={v} onClick={() => setTypeFilter(v)}
                className="px-2.5 py-1 rounded-lg transition-all"
                style={{
                  fontSize: 11, fontWeight: 600,
                  background: typeFilter === v ? "rgba(255,255,255,0.08)" : "transparent",
                  color: typeFilter === v ? "#e4e4e7" : "rgba(113,113,122,0.7)",
                }}>
                {l}
              </button>
            ))}
          </div>

          {/* Sort */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 rounded-xl text-[11px]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(161,161,170,0.8)", width: 120 }}>
              <ArrowUpDown style={{ width: 11, height: 11, marginRight: 5, opacity: 0.5 }} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.1)" }} className="text-white rounded-xl">
              {[["newest", "Newest"], ["oldest", "Oldest"], ["highest", "Highest"], ["lowest", "Lowest"]].map(([v, l]) => (
                <SelectItem key={v} value={v} className="focus:bg-white/10 rounded-lg text-sm">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Transaction list ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Active filters badge */}
          {(search || typeFilter !== "all") && (
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(99,102,241,0.04)" }}>
              <span style={{ fontSize: 11, color: "rgba(129,140,248,0.8)" }}>
                {displayed.length} result{displayed.length !== 1 ? "s" : ""}
                {search && <> matching "<strong style={{ color: "#818cf8" }}>{search}</strong>"</>}
              </span>
              <button onClick={() => { setSearch(""); setTypeFilter("all") }}
                style={{ fontSize: 10, color: "rgba(129,140,248,0.6)", marginLeft: "auto" }}
                onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(129,140,248,0.6)"}>
                Clear filters
              </button>
            </div>
          )}

          {loading ? (
            <>{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Search style={{ width: 18, height: 18, color: "rgba(113,113,122,0.4)" }} />
              </div>
              <p style={{ fontSize: 13, color: "rgba(113,113,122,0.6)" }}>No transactions found</p>
              {search && <button onClick={() => setSearch("")} style={{ fontSize: 12, color: "#818cf8" }}>Clear search</button>}
            </div>
          ) : grouped ? (
            // Grouped by date
            Object.entries(grouped).map(([label, txs]) => (
              <div key={label}>
                <div className="flex items-center gap-3 px-4 py-2" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(113,113,122,0.6)", letterSpacing: "0.05em" }}>{label}</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                  <span style={{ fontSize: 10, color: "rgba(113,113,122,0.4)" }}>
                    ₹{txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} spent
                  </span>
                </div>
                {txs.map((tx, i) => (
                  <TxRow key={tx._id || i} tx={tx} index={i}
                    onDelete={tx => setDeleteConfirm(tx)} />
                ))}
              </div>
            ))
          ) : (
            // Flat list (sorted by amount)
            displayed.map((tx, i) => (
              <TxRow key={tx._id || i} tx={tx} index={i} onDelete={tx => setDeleteConfirm(tx)} />
            ))
          )}

          {/* Footer */}
          {!loading && displayed.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 10.5, color: "rgba(113,113,122,0.5)" }}>
                {displayed.length} of {transactions.length} transactions
              </span>
              <div className="flex items-center gap-1" style={{ fontSize: 10.5, color: "rgba(113,113,122,0.5)" }}>
                <span style={{ color: "#10b981" }}>+₹{totalIncome.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                <span>·</span>
                <span style={{ color: "#f43f5e" }}>−₹{totalExpense.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                <span>·</span>
                <span style={{ color: net >= 0 ? "#818cf8" : "#fb923c", fontWeight: 600 }}>
                  net ₹{Math.abs(net).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete confirm overlay ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7", marginBottom: 6 }}>Delete transaction?</p>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: deleteConfirm.type === "income" ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)" }}>
                  {deleteConfirm.type === "income"
                    ? <TrendingUp style={{ width: 14, height: 14, color: "#10b981" }} />
                    : <TrendingDown style={{ width: 14, height: 14, color: "#f43f5e" }} />
                  }
                </div>
                <div className="min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{deleteConfirm.merchant || deleteConfirm.category}</p>
                  <p style={{ fontSize: 11, color: "rgba(113,113,122,0.6)" }}>
                    {deleteConfirm.type === "income" ? "+" : "−"}₹{Number(deleteConfirm.amount).toLocaleString("en-IN")} · {deleteConfirm.category}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "rgba(113,113,122,0.6)", marginTop: 10 }}>This cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(161,161,170,0.8)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg,#be123c,#f43f5e)", color: "#fff" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}