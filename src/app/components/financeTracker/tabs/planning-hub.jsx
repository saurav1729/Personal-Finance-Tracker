"use client"

import BudgetsTab from "./budget-tabs"
import SavingsGoalsTab from "./saving-goal-tabs"
import { Target, ShieldCheck, Sparkles } from "lucide-react"

export default function PlanningHub(props) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">

      {/* Agent context banner */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/15">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
        <p className="text-[12px] text-zinc-400">
          The <span className="text-indigo-400 font-medium">Budget Advisor</span> and{" "}
          <span className="text-purple-400 font-medium">Goal Specialist</span> agents can create and analyse these automatically — just ask in the Intelligence Agent tab.
        </p>
      </div>

      {/* Budgets */}
      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
        <div className="absolute inset-0 bg-orange-500/5 blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 rounded-3xl pointer-events-none" />
        <div className="relative bg-gradient-to-br from-[#0a0a0f]/90 to-[#12121e]/90 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col border border-white/[0.05]">
          <div className="px-6 py-5 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Active Budgets</p>
                <p className="text-[11px] text-zinc-600">Monthly spending limits by category</p>
              </div>
            </div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest">
              {props.budgets?.filter(b => b.status !== "disabled").length || 0} active
            </div>
          </div>
          <div className="p-6">
            <BudgetsTab {...props} />
          </div>
        </div>
      </div>

      {/* Savings Goals */}
      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
        <div className="absolute inset-0 bg-cyan-500/5 blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 rounded-3xl pointer-events-none" />
        <div className="relative bg-gradient-to-br from-[#0a0a0f]/90 to-[#12121e]/90 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col border border-white/[0.05]">
          <div className="px-6 py-5 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Savings Goals</p>
                <p className="text-[11px] text-zinc-600">Track progress toward your targets</p>
              </div>
            </div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest">
              {props.savingsGoals?.filter(g => !g.disabled).length || 0} active
            </div>
          </div>
          <div className="p-6">
            <SavingsGoalsTab {...props} />
          </div>
        </div>
      </div>

    </div>
  )
}