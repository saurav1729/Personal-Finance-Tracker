"use client"

import { Wallet, Calendar, Download, TrendingUp, TrendingDown, Activity, Hash, BarChart2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { IndianRupee } from "lucide-react"
import InsightsPanel from "./util/insights-panel"
import IncomeExpenseChart from "./IncomeExpenseChart"

// Compute how many days are in the selected period — used for avg/day
function getPeriodDays(selectedPeriod) {
  const now = new Date();
  if (selectedPeriod === "day") return 1;
  if (selectedPeriod === "week") return 7;
  if (selectedPeriod === "month") return now.getDate(); // days elapsed this month
  if (selectedPeriod === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((now - start) / 86400000) + 1;
  }
  // "all" — find earliest transaction date span
  return null;
}

export default function DashboardCards(props) {
  const {
    balance, totalIncome, totalExpense, savingsRate,
    selectedPeriod, setSelectedPeriod,
    handleExportData, barChartData,
    filteredTransactions = [],
  } = props

  const isPositive = balance >= 0

  // ── Live stats from filteredTransactions ───────────────────────────────────
  const txCount = filteredTransactions.length;
  const periodDays = getPeriodDays(selectedPeriod);
  const avgPerDay = periodDays && periodDays > 0 && totalExpense > 0
    ? (totalExpense / periodDays).toFixed(0)
    : null;

  const periodLabel = {
    day: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
    all: "All Time",
  }[selectedPeriod] || "Period";

  return (
    <div className="flex flex-col gap-5 w-full">

      {/* ── Row 1: 3 cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">

        {/* Balance Card */}
        <Card className="relative overflow-hidden bg-[#0d0d14] text-white border border-white/[0.05] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl">
          {/* Subtle ambient glow — softer than before */}
          <div className={`absolute inset-0 pointer-events-none ${isPositive
            ? "bg-[radial-gradient(ellipse_at_top_left,rgba(52,211,153,0.06)_0%,transparent_60%)]"
            : "bg-[radial-gradient(ellipse_at_top_left,rgba(248,113,113,0.06)_0%,transparent_60%)]"
            }`} />
          {/* Decorative chip */}
          <div className="absolute top-5 right-5 w-9 h-6 rounded border border-white/[0.08] opacity-50" />

          <CardHeader className="pb-2 relative z-10 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.08]">
                <Wallet className="w-3 h-3 text-zinc-500" />
              </div>
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">Current Balance</span>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 pb-6">
            <div className={`text-[36px] font-bold tracking-tight mt-1 mb-5 flex items-center gap-1 ${isPositive ? "text-zinc-100" : "text-red-400"
              }`}>
              <IndianRupee className="w-6 h-6 opacity-70" />
              {Math.abs(balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {!isPositive && <span className="text-[14px] text-red-400/70 ml-1 font-normal">deficit</span>}
            </div>

            {/* 3 stat tiles */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Income", value: totalIncome, clr: "text-emerald-400", icon: TrendingUp },
                { label: "Expenses", value: totalExpense, clr: "text-red-400", icon: TrendingDown },
                { label: "Savings", value: null, clr: savingsRate > 20 ? "text-emerald-400" : "text-amber-400", icon: Activity },
              ].map(({ label, value, clr, icon: Icon }) => (
                <div key={label}
                  className="bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors group">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Icon className={`w-3 h-3 ${clr} opacity-60`} />
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{label}</span>
                  </div>
                  <div className={`font-semibold text-[12px] ${clr} flex items-center gap-0.5`}>
                    {value !== null
                      ? <><IndianRupee className="w-2.5 h-2.5" />{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</>
                      : <>{savingsRate.toFixed(0)}%</>
                    }
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Period Selector Card */}
        <Card className="bg-[#0d0d14] border border-white/[0.05] shadow-[0_0_40px_rgba(0,0,0,0.3)] rounded-3xl text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.08]">
                <Calendar className="w-3 h-3 text-zinc-500" />
              </div>
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">Time Period</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.07] text-zinc-300 rounded-xl h-9 text-sm focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-[#13131f] border-white/[0.08] text-zinc-300 rounded-xl shadow-2xl">
                {[["day", "Today"], ["week", "This Week"], ["month", "This Month"], ["year", "This Year"], ["all", "All Time"]].map(([v, l]) => (
                  <SelectItem key={v} value={v} className="focus:bg-white/[0.08] rounded-lg text-sm">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ✅ Live stats — computed from filteredTransactions */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                <div className="flex items-center gap-1 mb-1">
                  <Hash className="w-3 h-3 text-zinc-600" />
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Transactions</p>
                </div>
                <p className="text-[15px] font-bold text-zinc-200">
                  {txCount > 0 ? txCount : <span className="text-zinc-600 text-sm font-normal">None</span>}
                </p>
                <p className="text-[9px] text-zinc-700 mt-0.5">{periodLabel}</p>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                <div className="flex items-center gap-1 mb-1">
                  <BarChart2 className="w-3 h-3 text-zinc-600" />
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Avg / day</p>
                </div>
                <p className="text-[15px] font-bold text-zinc-200 flex items-center gap-0.5">
                  {avgPerDay
                    ? <><IndianRupee className="w-3 h-3 text-zinc-500" />{Number(avgPerDay).toLocaleString("en-IN")}</>
                    : <span className="text-zinc-600 text-sm font-normal">—</span>
                  }
                </p>
                <p className="text-[9px] text-zinc-700 mt-0.5">expenses only</p>
              </div>
            </div>

            <Button variant="outline" onClick={handleExportData}
              className="w-full bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200 rounded-xl h-9 text-[13px] transition-all">
              <Download className="w-3.5 h-3.5 mr-2 opacity-60" />
              Export to Excel
            </Button>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <InsightsPanel />
      </div>

      {/* ── Row 2: Chart — rendered ONCE here, never in OverviewTab ── */}
      {/* {barChartData && barChartData.length > 0 && (
        <IncomeExpenseChart barChartData={barChartData} />
      )} */}
    </div>
  )
}