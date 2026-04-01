import AiAdvisorTab from "./ai-advisor"
import { Sparkles } from "lucide-react"

export default function IntelligenceHub({ onDataChange, chatMessages, setChatMessages }) {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto h-[calc(100vh-140px)] min-h-[600px]">
      {/* LangGraph Chat */}
      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent h-full">
        <div className="absolute inset-0 bg-indigo-500/5 blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 rounded-3xl pointer-events-none" />
        <div className="relative bg-gradient-to-br from-[#0a0a0f]/90 to-[#12121e]/90 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col h-full border border-white/[0.05]">
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between z-10">
            <div className="flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold tracking-wide text-sm">Autonomous Analyst</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Active</span>
            </div>
          </div>
          <div className="p-0 flex-1 flex flex-col overflow-hidden relative z-10">
            <AiAdvisorTab onDataChange={onDataChange} chatMessages={chatMessages} setChatMessages={setChatMessages} />
          </div>
        </div>
      </div>
    </div>
  )
}
