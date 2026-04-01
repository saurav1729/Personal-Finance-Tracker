"use client"

import { useState, useEffect, useCallback } from "react"
import { DragDropContext } from "react-beautiful-dnd"
import { useUser } from "@clerk/nextjs"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Toaster } from 'sonner'

import DashboardCards from "./dashboard-card"
import TabNavigation from "./tab-navigation"
import OverviewTab from "./tabs/overview-tabs"
import LedgerHub from "./tabs/ledger-hub"
import PlanningHub from "./tabs/planning-hub"
import IntelligenceHub from "./tabs/intelligence-hub"

import { mockTransactions, mockCategories, mockBudgets, mockSavingsGoals, mockInsights } from "./util/mockData"

// ─────────────────────────────────────────────────────────────────────────────
// STYLED EXCEL EXPORT
// Uses xlsx-js-style (drop-in replacement for xlsx with full cell styling)
// Install: npm install xlsx-js-style
// ─────────────────────────────────────────────────────────────────────────────
async function exportStyledExcel({ transactions, budgets, savingsGoals }) {
  // xlsx-js-style preserves .s (style) objects on write — plain xlsx does NOT
  const XLSXStyle = await import("xlsx-js-style")
  const XLSX = XLSXStyle.default ?? XLSXStyle

  const wb = XLSX.utils.book_new()

  // ── Design tokens ──────────────────────────────────────────────────────────
  const C = {
    // Backgrounds
    pageBg: "0D0D14",
    rowEven: "12121E",
    rowOdd: "1A1A2E",
    titleBg: "1E1B4B",

    // Headers per sheet
    txHeader: "4F46E5",   // indigo
    budHeader: "D97706",   // amber
    goalHeader: "7C3AED",   // violet

    // Semantic
    green: "10B981",
    greenBg: "052E16",
    red: "F43F5E",
    redBg: "2D0810",
    amber: "F59E0B",
    amberBg: "2D1F02",
    indigo: "818CF8",
    indigoBg: "1E1B4B",
    muted: "94A3B8",
    white: "FFFFFF",
    border: "2D2D4A",
  }

  // ── Style builders ─────────────────────────────────────────────────────────
  const border = (clr = C.border) => ({
    top: { style: "thin", color: { rgb: clr } },
    bottom: { style: "thin", color: { rgb: clr } },
    left: { style: "thin", color: { rgb: clr } },
    right: { style: "thin", color: { rgb: clr } },
  })

  const hairBorder = () => ({
    top: { style: "hair", color: { rgb: C.border } },
    bottom: { style: "hair", color: { rgb: C.border } },
    left: { style: "hair", color: { rgb: C.border } },
    right: { style: "hair", color: { rgb: C.border } },
  })

  // Title cell (merged, large, centered)
  const mkTitle = (value, bg = C.titleBg) => ({
    v: value, t: "s",
    s: {
      fill: { patternType: "solid", fgColor: { rgb: bg } },
      font: { bold: true, color: { rgb: C.white }, sz: 16, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: false },
      border: border(bg),
    }
  })

  // Subtitle / meta row
  const mkMeta = (value, bg = C.pageBg) => ({
    v: value, t: "s",
    s: {
      fill: { patternType: "solid", fgColor: { rgb: bg } },
      font: { italic: true, color: { rgb: C.muted }, sz: 9 },
      alignment: { horizontal: "center", vertical: "center" },
    }
  })

  // Column header
  const mkHeader = (value, bg, align = "center") => ({
    v: value, t: "s",
    s: {
      fill: { patternType: "solid", fgColor: { rgb: bg } },
      font: { bold: true, color: { rgb: C.white }, sz: 10, name: "Calibri" },
      alignment: { horizontal: align, vertical: "center", wrapText: true },
      border: border(),
    }
  })

  // Regular data cell
  const mkCell = (value, type = "s", bg = C.rowEven, fontClr = C.white, bold = false, align = "left") => ({
    v: value, t: type,
    s: {
      fill: { patternType: "solid", fgColor: { rgb: bg } },
      font: { color: { rgb: fontClr }, sz: 10, bold, name: "Calibri" },
      alignment: { horizontal: align, vertical: "center" },
      border: hairBorder(),
    }
  })

  // Currency cell — colored bg by income vs expense
  const mkMoney = (amount, isPositive = true) => ({
    v: amount, t: "n",
    s: {
      fill: { patternType: "solid", fgColor: { rgb: isPositive ? C.greenBg : C.redBg } },
      font: { bold: true, color: { rgb: isPositive ? C.green : C.red }, sz: 10, name: "Calibri" },
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: '"₹"#,##0.00',
      border: hairBorder(),
    }
  })

  // Status badge cell
  const mkStatus = (label, clr, bg) => ({
    v: label, t: "s",
    s: {
      fill: { patternType: "solid", fgColor: { rgb: bg } },
      font: { bold: true, color: { rgb: clr }, sz: 9, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center" },
      border: hairBorder(),
    }
  })

  // Totals row cell
  const mkTotal = (value, type = "s", clr = C.white, bg = C.titleBg) => ({
    v: value, t: type,
    s: {
      fill: { patternType: "solid", fgColor: { rgb: bg } },
      font: { bold: true, color: { rgb: clr }, sz: 11, name: "Calibri" },
      alignment: { horizontal: type === "n" ? "right" : "center", vertical: "center" },
      numFmt: type === "n" ? '"₹"#,##0.00' : undefined,
      border: border(),
    }
  })

  // Empty filler cell (keeps bg consistent)
  const mkEmpty = (bg = C.pageBg) => ({
    v: "", t: "s",
    s: { fill: { patternType: "solid", fgColor: { rgb: bg } } }
  })

  // ── Helper: write rows array into a worksheet ──────────────────────────────
  function buildSheet(rows, colWidths, merges = [], rowHeights = []) {
    const ws = {}
    rows.forEach((row, R) => {
      row.forEach((cell, C2) => {
        if (cell === null || cell === undefined) return
        const addr = XLSX.utils.encode_cell({ r: R, c: C2 })
        ws[addr] = typeof cell === "object" && "v" in cell ? cell : { v: cell, t: "s" }
      })
    })
    const lastRow = rows.length - 1
    const lastCol = Math.max(...rows.map(r => r.length)) - 1
    ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } })
    ws["!cols"] = colWidths.map(w => ({ wch: w }))
    ws["!merges"] = merges
    if (rowHeights.length) ws["!rows"] = rowHeights
    return ws
  }

  const NUM_COLS = 6

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 1 — TRANSACTIONS
  // ════════════════════════════════════════════════════════════════════════════
  {
    const hBg = C.txHeader
    const rows = []

    // Row 0 — Title (merged across all cols)
    rows.push([mkTitle("  💳  MoneyMap — Transaction History", C.titleBg),
    ...Array(NUM_COLS - 1).fill(mkEmpty(C.titleBg))])

    // Row 1 — Generated timestamp
    const now = new Date()
    rows.push([mkMeta(`Generated on ${now.toLocaleDateString("en-IN")} at ${now.toLocaleTimeString("en-IN")}`, C.pageBg),
    ...Array(NUM_COLS - 1).fill(mkEmpty(C.pageBg))])

    // Row 2 — Spacer
    rows.push(Array(NUM_COLS).fill(mkEmpty(C.pageBg)))

    // Row 3 — Column headers
    rows.push([
      mkHeader("Date", hBg),
      mkHeader("Category", hBg),
      mkHeader("Merchant / Description", hBg, "left"),
      mkHeader("Amount", hBg, "right"),
      mkHeader("Type", hBg),
      mkHeader("Month", hBg),
    ])

    // Data rows
    transactions.forEach((t, i) => {
      const isIncome = t.type === "income"
      const bg = i % 2 === 0 ? C.rowEven : C.rowOdd
      const date = new Date(t.createdAt)
      rows.push([
        mkCell(date.toLocaleDateString("en-IN"), "s", bg, C.muted),
        mkCell(t.category || "", "s", bg, C.white, true),
        mkCell(t.merchant || t.description || t.category || "", "s", bg, C.muted),
        mkMoney(Number(t.amount), isIncome),
        mkStatus(isIncome ? "Income" : "Expense",
          isIncome ? C.green : C.red,
          isIncome ? C.greenBg : C.redBg),
        mkCell(date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }), "s", bg, C.muted),
      ])
    })

    // Spacer before totals
    rows.push(Array(NUM_COLS).fill(mkEmpty(C.pageBg)))

    // Totals row
    const totalInc = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const totalExp = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const net = totalInc - totalExp
    rows.push([
      mkTotal("TOTAL", "s", C.white, C.titleBg),
      mkTotal(`${transactions.length} items`, "s", C.muted, C.titleBg),
      mkEmpty(C.titleBg),
      mkTotal(totalInc, "n", C.green, C.greenBg),
      mkTotal(-totalExp, "n", C.red, C.redBg),
      mkTotal(net, "n", net >= 0 ? C.green : C.red, net >= 0 ? C.indigoBg : C.redBg),
    ])

    const rowHeights = [
      { hpt: 36 },  // title
      { hpt: 16 },  // meta
      { hpt: 8 },  // spacer
      { hpt: 24 },  // header
      ...Array(transactions.length).fill({ hpt: 20 }),
      { hpt: 8 },
      { hpt: 24 },
    ]

    const ws = buildSheet(rows,
      [14, 20, 34, 16, 12, 18],
      [{ s: { r: 0, c: 0 }, e: { r: 0, c: NUM_COLS - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: NUM_COLS - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: NUM_COLS - 1 } }],
      rowHeights
    )
    XLSX.utils.book_append_sheet(wb, ws, "Transactions")
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 2 — BUDGETS
  // ════════════════════════════════════════════════════════════════════════════
  {
    const hBg = C.budHeader
    const rows = []

    rows.push([mkTitle("  🛡️  Budget Overview & Health", "1C1200"),
    ...Array(NUM_COLS - 1).fill(mkEmpty("1C1200"))])
    rows.push([mkMeta(`${budgets.length} budget categories · ${new Date().toLocaleDateString("en-IN")}`, C.pageBg),
    ...Array(NUM_COLS - 1).fill(mkEmpty(C.pageBg))])
    rows.push(Array(NUM_COLS).fill(mkEmpty(C.pageBg)))

    rows.push([
      mkHeader("Category", hBg, "left"),
      mkHeader("Budgeted", hBg, "right"),
      mkHeader("Spent", hBg, "right"),
      mkHeader("Remaining", hBg, "right"),
      mkHeader("Usage", hBg),
      mkHeader("Status", hBg),
    ])

    budgets.forEach((b, i) => {
      const spent = Number(b.spent || 0)
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0
      const rem = b.amount - spent
      const bg = i % 2 === 0 ? C.rowEven : C.rowOdd
      const isDisabled = b.status === "disabled"

      const statusLabel = isDisabled ? "PAUSED" : pct >= 100 ? "EXCEEDED" : pct >= 80 ? "AT RISK" : "HEALTHY"
      const statusClr = isDisabled ? C.muted : pct >= 100 ? C.red : pct >= 80 ? C.amber : C.green
      const statusBg = isDisabled ? C.pageBg : pct >= 100 ? C.redBg : pct >= 80 ? C.amberBg : C.greenBg

      // Usage bar: filled with blocks (Unicode trick)
      const barFilled = Math.round(Math.min(pct, 100) / 10)
      const usageBar = "█".repeat(barFilled) + "░".repeat(10 - barFilled) + ` ${pct.toFixed(0)}%`
      const usageClr = pct >= 100 ? C.red : pct >= 80 ? C.amber : C.green

      rows.push([
        mkCell(b.category, "s", bg, C.white, true),
        mkMoney(b.amount, true),
        mkMoney(spent, spent === 0),
        {
          v: rem, t: "n",
          s: {
            fill: { patternType: "solid", fgColor: { rgb: rem >= 0 ? C.greenBg : C.redBg } },
            font: { bold: true, color: { rgb: rem >= 0 ? C.green : C.red }, sz: 10, name: "Calibri" },
            alignment: { horizontal: "right", vertical: "center" },
            numFmt: '"₹"#,##0.00',
            border: hairBorder(),
          }
        },
        {
          v: usageBar, t: "s",
          s: {
            fill: { patternType: "solid", fgColor: { rgb: bg } },
            font: { color: { rgb: usageClr }, sz: 9, bold: true, name: "Courier New" },
            alignment: { horizontal: "left", vertical: "center" },
            border: hairBorder(),
          }
        },
        mkStatus(statusLabel, statusClr, statusBg),
      ])
    })

    // Totals
    rows.push(Array(NUM_COLS).fill(mkEmpty(C.pageBg)))
    const totalBud = budgets.filter(b => b.status !== "disabled").reduce((s, b) => s + b.amount, 0)
    const totalSpt = budgets.filter(b => b.status !== "disabled").reduce((s, b) => s + Number(b.spent || 0), 0)
    rows.push([
      mkTotal("TOTALS", "s", C.white, "1C1200"),
      mkTotal(totalBud, "n", C.amber, C.amberBg),
      mkTotal(totalSpt, "n", totalSpt > totalBud ? C.red : C.green, totalSpt > totalBud ? C.redBg : C.greenBg),
      mkTotal(totalBud - totalSpt, "n", (totalBud - totalSpt) >= 0 ? C.green : C.red, (totalBud - totalSpt) >= 0 ? C.greenBg : C.redBg),
      mkEmpty("1C1200"),
      mkEmpty("1C1200"),
    ])

    const rowHeights = [
      { hpt: 36 }, { hpt: 16 }, { hpt: 8 }, { hpt: 24 },
      ...Array(budgets.length).fill({ hpt: 22 }),
      { hpt: 8 }, { hpt: 24 },
    ]

    const ws = buildSheet(rows,
      [22, 16, 16, 16, 22, 12],
      [{ s: { r: 0, c: 0 }, e: { r: 0, c: NUM_COLS - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: NUM_COLS - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: NUM_COLS - 1 } }],
      rowHeights
    )
    XLSX.utils.book_append_sheet(wb, ws, "Budgets")
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHEET 3 — SAVINGS GOALS
  // ════════════════════════════════════════════════════════════════════════════
  {
    const hBg = C.goalHeader
    const rows = []

    rows.push([mkTitle("  🎯  Savings Goals Roadmap", "150B3C"),
    ...Array(NUM_COLS - 1).fill(mkEmpty("150B3C"))])
    rows.push([mkMeta(`${savingsGoals.filter(g => !g.disabled).length} active goals · ${new Date().toLocaleDateString("en-IN")}`, C.pageBg),
    ...Array(NUM_COLS - 1).fill(mkEmpty(C.pageBg))])
    rows.push(Array(NUM_COLS).fill(mkEmpty(C.pageBg)))

    rows.push([
      mkHeader("Goal", hBg, "left"),
      mkHeader("Target", hBg, "right"),
      mkHeader("Saved", hBg, "right"),
      mkHeader("Remaining", hBg, "right"),
      mkHeader("Progress", hBg),
      mkHeader("Deadline", hBg),
    ])

    savingsGoals.forEach((g, i) => {
      const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
      const rem = g.targetAmount - g.currentAmount
      const bg = i % 2 === 0 ? C.rowEven : C.rowOdd
      const done = rem <= 0

      const barFilled = Math.round(Math.min(pct, 100) / 10)
      const bar = "█".repeat(barFilled) + "░".repeat(10 - barFilled) + ` ${pct.toFixed(0)}%`
      const barClr = pct >= 100 ? C.green : pct >= 60 ? C.indigo : pct >= 30 ? C.amber : C.muted

      // Days left
      let deadlineLabel = "No deadline"
      let deadlineClr = C.muted
      if (g.deadline) {
        const days = Math.ceil((new Date(g.deadline) - new Date()) / 86400000)
        deadlineLabel = `${new Date(g.deadline).toLocaleDateString("en-IN")} (${days > 0 ? days + "d left" : "overdue"})`
        deadlineClr = days < 0 ? C.red : days < 30 ? C.amber : C.muted
      }

      rows.push([
        mkCell(g.name, "s", bg, C.white, true),
        mkMoney(g.targetAmount, true),
        mkMoney(g.currentAmount, true),
        done
          ? mkStatus("REACHED 🎉", C.green, C.greenBg)
          : {
            v: rem, t: "n",
            s: { fill: { patternType: "solid", fgColor: { rgb: bg } }, font: { color: { rgb: C.muted }, sz: 10, name: "Calibri" }, alignment: { horizontal: "right", vertical: "center" }, numFmt: '"₹"#,##0.00', border: hairBorder() }
          },
        {
          v: bar, t: "s",
          s: {
            fill: { patternType: "solid", fgColor: { rgb: bg } },
            font: { color: { rgb: barClr }, sz: 9, bold: true, name: "Courier New" },
            alignment: { horizontal: "left", vertical: "center" },
            border: hairBorder(),
          }
        },
        mkCell(deadlineLabel, "s", bg, deadlineClr),
      ])
    })

    // Summary
    rows.push(Array(NUM_COLS).fill(mkEmpty(C.pageBg)))
    const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0)
    const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0)
    const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
    const bar10 = "█".repeat(Math.round(overallPct / 10)) + "░".repeat(10 - Math.round(overallPct / 10))
    rows.push([
      mkTotal("OVERALL", "s", C.white, "150B3C"),
      mkTotal(totalTarget, "n", C.indigo, C.indigoBg),
      mkTotal(totalSaved, "n", C.green, C.greenBg),
      mkTotal(totalTarget - totalSaved, "n", C.muted, "150B3C"),
      mkTotal(`${bar10} ${overallPct.toFixed(0)}%`, "s", C.indigo, C.indigoBg),
      mkEmpty("150B3C"),
    ])

    const rowHeights = [
      { hpt: 36 }, { hpt: 16 }, { hpt: 8 }, { hpt: 24 },
      ...Array(savingsGoals.length).fill({ hpt: 22 }),
      { hpt: 8 }, { hpt: 24 },
    ]

    const ws = buildSheet(rows,
      [24, 16, 16, 16, 22, 24],
      [{ s: { r: 0, c: 0 }, e: { r: 0, c: NUM_COLS - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: NUM_COLS - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: NUM_COLS - 1 } }],
      rowHeights
    )
    XLSX.utils.book_append_sheet(wb, ws, "Goals")
  }

  // ── Write file ─────────────────────────────────────────────────────────────
  const fileName = `MoneyMap-Export-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FinanceTracker() {
  const { user } = useUser()

  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])
  const [savingsGoals, setSavingsGoals] = useState([])
  const [insights, setInsights] = useState([])

  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newCategoryType, setNewCategoryType] = useState("expense")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [activeTab, setActiveTab] = useState("overview")
  const [newBudget, setNewBudget] = useState({ category: "", amount: "", period: "month" })
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", currentAmount: 0, deadline: "" })

  const [chatMessages, setChatMessages] = useState([{
    role: "assistant",
    content: "I'm **MoneyMap Intelligence** — your multi-agent financial analyst.\n\nI can:\n- Log transactions and update your budgets automatically\n- Calculate safe-to-spend limits and burn rate\n- Detect spending anomalies\n- Analyse your budget health\n- Track savings goal progress\n- Search your full transaction history\n\nWhat would you like to know?",
    timestamp: Date.now(),
  }])

  // ── Fetch functions ───────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/transactions?userId=${user.id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTransactions(Array.isArray(data) ? data : data.transactions || [])
    } catch { setTransactions(mockTransactions) }
  }, [user?.id])

  const fetchCategories = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/categories?userId=${user.id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setCategories(await res.json())
    } catch { setCategories(mockCategories) }
  }, [user?.id])

  const fetchBudgets = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/budget?userId=${user.id}`, { cache: 'no-store' })
      const data = await res.json()
      setBudgets(Array.isArray(data) ? data : [])
    } catch { setBudgets(mockBudgets) }
  }, [user?.id])

  // ✅ fetchGoals — fixes "fetchGoals is not defined"
  const fetchGoals = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/goals?userId=${user.id}`, { cache: 'no-store' })
      const data = await res.json()
      setSavingsGoals(Array.isArray(data) ? data : [])
    } catch { setSavingsGoals(mockSavingsGoals) }
  }, [user?.id])

  // Called by AI agent after any data mutation
  const handleDataChange = useCallback(async () => {
    await Promise.allSettled([fetchTransactions(), fetchBudgets(), fetchGoals()])
  }, [fetchTransactions, fetchBudgets, fetchGoals])

  useEffect(() => {
    if (user) {
      fetchTransactions(); fetchCategories(); fetchBudgets(); fetchGoals()
      setInsights(mockInsights)
    } else {
      setTransactions(mockTransactions); setCategories(mockCategories)
      setBudgets(mockBudgets); setSavingsGoals(mockSavingsGoals); setInsights(mockInsights)
    }
  }, [user])

  // ── Transaction handlers ──────────────────────────────────────────────────
  const handleAddTransaction = async (category, type) => {
    if (!amount) return
    try {
      const tx = { id: `temp-${Date.now()}`, category, type, amount: parseFloat(amount), description: description || category, userId: user?.id, createdAt: new Date().toISOString() }
      setTransactions(p => [tx, ...p]); setAmount(""); setDescription("")
      if (user) {
        await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tx) })
        await Promise.allSettled([fetchTransactions(), fetchBudgets()])
      }
    } catch (err) { console.error(err) }
  }

  const handleAddCategory = async () => {
    if (!newCategory) return
    try {
      const obj = { id: `cat-${Date.now()}`, name: newCategory, type: newCategoryType, userId: user?.id }
      setCategories(p => [...p, obj]); setNewCategory("")
      if (user) { await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) }); fetchCategories() }
    } catch (err) { console.error(err) }
  }

  const handleDeleteCategory = async (categoryId) => {
    try {
      setCategories(p => p.filter(c => (c._id || c.id) !== categoryId))
      if (user) { await fetch(`/api/categories/${categoryId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) }); fetchCategories() }
    } catch (err) { console.error(err) }
  }

  // ── Budget handlers ───────────────────────────────────────────────────────
  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.amount || !user) return
    try {
      await fetch("/api/budget", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, category: newBudget.category, amount: parseFloat(newBudget.amount) }) })
      setNewBudget({ category: "", amount: "", period: "month" }); fetchBudgets()
    } catch (err) { console.error(err) }
  }

  const handleUpdateBudget = async (editingBudgetId) => {
    if (!newBudget.category || !newBudget.amount || !user) return
    try {
      const res = await fetch(`/api/budget/${editingBudgetId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, updatedBudget: newBudget }) })
      const { updatedBudgets } = await res.json()
      if (updatedBudgets) setBudgets(updatedBudgets)
      setNewBudget({ category: "", amount: "", period: "month" }); fetchBudgets()
    } catch (err) { console.error(err) }
  }

  const handleDeleteBudget = async (budgetId) => {
    if (!budgetId || !user) return
    try { await fetch(`/api/budget/${budgetId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) }); fetchBudgets() }
    catch (err) { console.error(err) }
  }

  const handleToggleBudgetStatus = async (budgetId) => {
    if (!budgetId || !user) return
    try {
      const res = await fetch(`/api/budget/${budgetId}/toggle-status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) })
      const { updatedBudget } = await res.json()
      setBudgets(p => p.map(b => b._id === budgetId ? { ...b, status: updatedBudget.status } : b))
    } catch (err) { console.error(err) }
  }

  const handleResetBudget = async (budgetId) => {
    if (!budgetId || !user) return
    try { await fetch(`/api/budget/${budgetId}/reset-budget`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) }); fetchBudgets() }
    catch (err) { console.error(err) }
  }

  // ── Goal handlers ─────────────────────────────────────────────────────────
  const handleAddSavingsGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) return
    try {
      await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id, name: newGoal.name, targetAmount: parseFloat(newGoal.targetAmount), currentAmount: parseFloat(newGoal.currentAmount) || 0, deadline: newGoal.deadline || null }) })
      setNewGoal({ name: "", targetAmount: "", currentAmount: 0, deadline: "" }); fetchGoals()
    } catch (err) { console.error(err) }
  }

  const handleUpdateSavingsGoal = async (goalId, updatedGoal) => {
    if (!goalId || !user) return
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, updatedGoal }) })
      const { updated } = await res.json()
      setSavingsGoals(p => p.map(g => g._id === goalId ? { ...g, ...updated } : g))
      setNewGoal({ name: "", targetAmount: "", currentAmount: "", deadline: "" })
    } catch (err) { console.error(err) }
  }

  const handleDeleteSavingsGoal = async (goalId) => {
    if (!goalId || !user) return
    try { await fetch(`/api/goals/${goalId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) }); fetchGoals() }
    catch (err) { console.error(err) }
  }

  const handleToggleSavingsGoalStatus = async (goalId) => {
    if (!goalId || !user) return
    try { await fetch(`/api/goals/${goalId}/toggle-status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) }); fetchGoals() }
    catch (err) { console.error(err) }
  }

  // ── DnD ───────────────────────────────────────────────────────────────────
  const onDragEnd = (result) => {
    if (!result.destination) return
    if (result.destination.droppableId === "delete-zone") handleDeleteCategory(result.draggableId)
  }

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExportData = () => {
    if (typeof window === "undefined") return
    exportStyledExcel({ transactions, budgets, savingsGoals })
      .catch(err => console.error("Export failed:", err))
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const filteredTransactions = transactions.filter(t => {
    if (selectedPeriod === "all") return true
    const d = new Date(t.createdAt), now = new Date()
    if (selectedPeriod === "day") return d.toDateString() === now.toDateString()
    if (selectedPeriod === "week") { const wa = new Date(); wa.setDate(now.getDate() - 7); return d >= wa }
    if (selectedPeriod === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (selectedPeriod === "year") return d.getFullYear() === now.getFullYear()
    return true
  })

  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = filteredTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  // ✅ Goal allocations reduce spendable balance (money locked in goals)
  const totalGoalAllocations = savingsGoals
    .filter(g => !g.disabled)
    .reduce((s, g) => s + (g.currentAmount || 0), 0)

  // Available balance = income - expenses - money locked in goals
  const balance = totalIncome - totalExpense - totalGoalAllocations
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0

  const barChartData = [
    { name: "Income", amount: totalIncome, fill: "#10b981" },
    { name: "Expenses", amount: totalExpense, fill: "#f43f5e" },
    { name: "In Goals", amount: totalGoalAllocations, fill: "#818cf8" },
    { name: "Available", amount: Math.max(0, balance), fill: balance >= 0 ? "#6366f1" : "#ef4444" },
  ].filter(d => d.amount > 0)

  const sharedProps = {
    amount, setAmount, description, setDescription,
    categories, newCategory, setNewCategory, newCategoryType, setNewCategoryType,
    budgets, newBudget, setNewBudget,
    savingsGoals, setSavingsGoals, newGoal, setNewGoal,
    filteredTransactions, transactions,
    handleAddTransaction, handleAddCategory,
    handleAddBudget, handleUpdateBudget, handleDeleteBudget,
    handleToggleBudgetStatus, handleResetBudget,
    handleAddSavingsGoal, handleUpdateSavingsGoal,
    handleDeleteSavingsGoal, handleToggleSavingsGoalStatus,
    fetchTransactions, fetchGoals,
    totalGoalAllocations,
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Toaster theme="dark" position="top-right" richColors />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-screen bg-transparent text-white overflow-hidden w-full relative">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 h-full overflow-y-auto relative w-full custom-scrollbar">
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-24 md:pb-8">

            <TabsContent value="overview" className="space-y-6 mt-0">
              <DashboardCards
                balance={balance} totalIncome={totalIncome} totalExpense={totalExpense}
                savingsRate={savingsRate} selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod} handleExportData={handleExportData}
                barChartData={barChartData}
                filteredTransactions={filteredTransactions}
              />
              {/* Chart renders inside DashboardCards — do NOT pass barChartData to OverviewTab */}
              <OverviewTab
                totalIncome={totalIncome} totalExpense={totalExpense}
                balance={balance} filteredTransactions={filteredTransactions}
              />
            </TabsContent>

            <TabsContent value="ledger" className="space-y-4 mt-0">
              <LedgerHub {...sharedProps} />
            </TabsContent>

            <TabsContent value="planning" className="space-y-6 mt-0">
              <PlanningHub {...sharedProps} />
            </TabsContent>

            <TabsContent value="intelligence" className="space-y-6 mt-0">
              <IntelligenceHub 
                onDataChange={handleDataChange} 
                chatMessages={chatMessages} 
                setChatMessages={setChatMessages} 
              />
            </TabsContent>

          </div>
        </div>
      </Tabs>
    </DragDropContext>
  )
}