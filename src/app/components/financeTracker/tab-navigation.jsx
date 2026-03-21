"use client"

import { BarChart3, IndianRupee, Target, Sparkles, Sliders } from 'lucide-react'
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs"
import { LogOut } from "lucide-react"

export default function TabNavigation({ activeTab, setActiveTab }) {
  const { user } = useUser()

  return (
    <>
      {/* Desktop Sidebar (Left) */}
      <div className="hidden md:flex flex-col w-[280px] h-full bg-gradient-to-b from-[#0a0a0f]/80 to-[#12121e]/80 backdrop-blur-3xl border-r border-white-[0.05] flex-shrink-0 relative z-20 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
        
        {/* Abstract Glow behind sidebar */}
        <div className="absolute top-0 left-0 w-full h-80 bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-80 bg-rose-500/10 blur-[100px] pointer-events-none" />

        <div className="p-8 pb-4 relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center p-[1px] shadow-lg shadow-indigo-500/30">
              <div className="absolute inset-0 bg-black/20 rounded-2xl pointer-events-none" />
              <Sparkles className="w-5 h-5 text-white z-10 relative" />
            </div>
            <span className="font-bold tracking-wider text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              MoneyMap
            </span>
          </div>

          <TabsList className="flex flex-col space-y-4 h-auto bg-transparent p-0 w-full items-start justify-start text-left shrink-0 block">
            <SidebarButton value="overview" icon={<BarChart3 className="w-[18px] h-[18px]"/>} label="Dashboard" active={activeTab} />
            <SidebarButton value="ledger" icon={<IndianRupee className="w-[18px] h-[18px]"/>} label="Transactions" active={activeTab} />
            <SidebarButton value="planning" icon={<Target className="w-[18px] h-[18px]"/>} label="Financial Plan" active={activeTab} />
            <SidebarButton value="intelligence" icon={<Sparkles className="w-[18px] h-[18px]"/>} label="Intelligence Agent" active={activeTab} />
          </TabsList>
        </div>
        
        <div className="mt-auto p-5 m-4 mt-8 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.05] backdrop-blur-md relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="relative flex items-center justify-center">
                 <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 border-2 border-indigo-500/30 shadow-indigo-500/20 shadow-lg" } }} />
               </div>
               <div className="flex flex-col">
                 <span className="text-sm font-semibold text-white tracking-wide">{user?.firstName || "Analyst"}</span>
                 <SignOutButton>
                   <button className="flex items-center mt-1 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer text-left outline-none">
                     <LogOut className="w-3 h-3 mr-1" />
                     <span className="text-[10px] font-medium uppercase tracking-widest">Sign Out</span>
                   </button>
                 </SignOutButton>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-2xl border-t border-white/5 px-6 py-4 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
        <TabsList className="flex w-full justify-between items-center h-auto bg-transparent p-0">
          <MobileButton value="overview" icon={<BarChart3 className="w-5 h-5"/>} label="Home" active={activeTab} />
          <MobileButton value="ledger" icon={<IndianRupee className="w-5 h-5"/>} label="Txns" active={activeTab} />
          <MobileButton value="planning" icon={<Target className="w-5 h-5"/>} label="Plans" active={activeTab} />
          <MobileButton value="intelligence" icon={<Sparkles className="w-5 h-5"/>} label="AI" active={activeTab} />
          <div className="flex flex-col items-center justify-center relative translate-y-[2px]">
             <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 opacity-80" } }} />
             <span className="text-[10px] mt-1 font-medium text-zinc-500">Profile</span>
          </div>
        </TabsList>
      </div>
    </>
  )
}

function SidebarButton({ value, icon, label, active }) {
  const isActive = active === value;
  return (
    <TabsTrigger
      value={value}
      className={`relative text-left w-full justify-start py-4 px-5 rounded-2xl transition-all duration-500 border-0 shadow-none focus-visible:ring-0 overflow-hidden group ${
        isActive ? "text-white" : "text-zinc-400 hover:text-white"
      } data-[state=active]:bg-transparent data-[state=active]:shadow-none`}
    >
      {isActive && (
        <>
          <motion.div
            layoutId="active-nav-glow"
            className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/5 opacity-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
        </>
      )}
      
      {/* Hover ambient glow */}
      {!isActive && (
        <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      )}

      <div className="relative z-10 flex items-center w-full gap-4">
        <div className={`p-2 rounded-xl transition-colors duration-300 ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-transparent text-zinc-500 group-hover:text-zinc-300 group-hover:bg-white/5'}`}>
          {icon}
        </div>
        <span className={`font-medium text-[14px] tracking-wide transition-all duration-300 ${isActive ? 'font-semibold' : ''}`}>{label}</span>
      </div>
    </TabsTrigger>
  )
}

function MobileButton({ value, icon, label, active }) {
  const isActive = active === value;
  return (
    <TabsTrigger
      value={value}
      className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 border-0 shadow-none focus-visible:ring-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
        isActive ? "text-indigo-400" : "text-zinc-500"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="mobile-bg"
          className="absolute inset-0 bg-indigo-500/10 rounded-2xl border border-indigo-500/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center">
        {icon}
        <span className="text-[10px] mt-1.5 font-medium tracking-wider uppercase">{label}</span>
      </div>
    </TabsTrigger>
  )
}
