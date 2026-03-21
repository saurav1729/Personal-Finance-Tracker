"use client"
import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { FastForward, Sliders } from "lucide-react"

export default function WhatIfSimulator() {
  const { user } = useUser()
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])
  const [selectedBudget, setSelectedBudget] = useState("")
  const [selectedGoal, setSelectedGoal] = useState("")
  const [cutPercentage, setCutPercentage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/budget?userId=${user.id}`).then(res => res.json()),
      fetch(`/api/goals?userId=${user.id}`).then(res => res.json())
    ]).then(([bData, gData]) => {
      setBudgets(bData.filter(b => b.status === "enabled" || b.status === "active"))
      setGoals(gData.filter(g => !g.disabled))
      if (bData.length > 0) setSelectedBudget(bData[0]._id)
      if (gData.length > 0) setSelectedGoal(gData[0]._id)
      setIsLoading(false)
    }).catch(err => {
      console.error(err)
      setIsLoading(false)
    })
  }, [user])

  if (isLoading) return <div className="animate-pulse h-64 bg-white/5 rounded-xl w-full"></div>

  const budget = budgets.find(b => b._id === selectedBudget)
  const goal = goals.find(g => g._id === selectedGoal)
  
  const savedAmount = budget ? (budget.amount * (cutPercentage / 100)) : 0
  const remainingTarget = goal ? (goal.targetAmount - goal.currentAmount) : 0
  
  // Baseline assumption: User saves $500/mo by default.
  // Mashing the savedAmount on top speeds up the goal.
  const baseMonthlySavings = 500
  const currentMonthsToGoal = remainingTarget / baseMonthlySavings
  const newMonthsToGoal = remainingTarget / (baseMonthlySavings + savedAmount)
  const monthsAccelerated = currentMonthsToGoal - newMonthsToGoal

  return (
    <div className="h-full p-8 md:p-12 border border-white/[0.05] rounded-3xl bg-gradient-to-br from-[#0a0a0f]/90 to-[#12121e]/90 shadow-[0_0_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl relative overflow-hidden flex flex-col justify-center max-w-5xl mx-auto min-h-[600px]">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex items-center space-x-4 mb-4 relative z-10">
        <div className="p-3 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
          <Sliders className="w-6 h-6 text-indigo-400" />
        </div>
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">Financial Forecasting</h2>
      </div>
      <p className="text-zinc-400 mb-12 relative z-10 text-lg max-w-2xl leading-relaxed">Simulate small daily sacrifices to see how fast you can hit your long-term goals.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
        {/* Controls */}
        <div className="space-y-8">
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-3 uppercase tracking-wider">If I cut my budget for...</label>
            <select 
              value={selectedBudget} 
              onChange={e => setSelectedBudget(e.target.value)}
              className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition focus:ring-1 focus:ring-indigo-500 appearance-none"
            >
              <option value="" disabled className="bg-[#12121e]">Select a Budget</option>
              {budgets.map(b => (
                <option key={b._id} value={b._id} className="bg-[#12121e]">{b.category} (₹{b.amount}/mo)</option>
              ))}
            </select>
          </div>

          <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 transition-opacity opacity-0 group-hover:opacity-100" />
            <label className="text-sm font-medium text-zinc-300 block mb-6 flex justify-between relative z-10">
              <span className="uppercase tracking-wider">By {cutPercentage}%</span> 
              <span className="text-indigo-400 font-bold">+₹{savedAmount.toFixed(2)} savings/mo</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={cutPercentage} 
              onChange={e => setCutPercentage(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 relative z-10"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-3 uppercase tracking-wider mt-2">To fund my goal...</label>
            <select 
              value={selectedGoal} 
              onChange={e => setSelectedGoal(e.target.value)}
              className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition focus:ring-1 focus:ring-indigo-500 appearance-none"
            >
              <option value="" disabled className="bg-[#12121e]">Select a Goal</option>
              {goals.map(g => (
                <option key={g._id} value={g._id} className="bg-[#12121e]">{g.name} (Need: ₹{(g.targetAmount - g.currentAmount).toFixed(2)})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col justify-center items-center text-center shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
          
          <FastForward className="w-12 h-12 text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-500 z-10" />
          <h3 className="text-xl text-zinc-300 font-medium mb-3 z-10 uppercase tracking-widest text-[13px]">Acceleration Impact</h3>
          
          {goal && budget ? (
            <div className="z-10 flex flex-col items-center">
              <div className="text-7xl font-light text-white my-6 tracking-tight flex items-baseline">
                {monthsAccelerated.toFixed(1)} 
                <span className="text-2xl text-zinc-400 ml-3">Months</span>
              </div>
              <p className="text-zinc-400 text-base max-w-sm mt-4 leading-relaxed">
                You will reach <span className="text-white font-medium">"{goal.name}"</span> faster by voluntarily diverting <span className="text-indigo-400 font-bold">₹{savedAmount.toFixed(2)}/mo</span>.
              </p>
            </div>
          ) : (
            <p className="text-zinc-500 mt-6 z-10">Set up an active budget and goal to run simulations.</p>
          )}
        </div>
      </div>
    </div>
  )
}
