"use client"

import { BarChart3, IndianRupee, PieChart, Target, Menu, X } from 'lucide-react'
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

export default function TabNavigation({ activeTab }) {
  const [mounted, setMounted] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen)
  }

  const handleTabClick = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <div className="md:hidden absolute top-4 right-4 z-20">
        <button
          onClick={toggleMobileSidebar}
          className="bg-gradient-to-r from-[#1a1f2b] to-[#2c3347] p-2 rounded-lg border border-[#ffffff20] shadow-lg"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={toggleMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="md:hidden fixed top-0 left-0 bottom-0 w-[75%] max-w-[300px] z-40 bg-gradient-to-br from-blue-800 via-[#2a2a2a] to-[#1c1c1c] shadow-xl"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">MoneyMap</h2>
              <button onClick={toggleMobileSidebar} className="text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <TabsList className="flex mt-20 flex-col space-y-3 bg-transparent border-0 p-0">
                <TabsTrigger
                  value="overview"
                  onClick={handleTabClick}
                  className={`relative text-white w-full py-3 px-4 rounded-lg flex items-center justify-start ${
                    activeTab === "overview"
                      ? "bg-gradient-to-r from-[#1c1d1c] from-12% to-blue-900 shadow-lg"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  <span className="font-medium">Overview</span>
                </TabsTrigger>

                <TabsTrigger
                  value="transactions"
                  onClick={handleTabClick}
                  className={`relative text-white w-full py-3 px-4 rounded-lg flex items-center justify-start ${
                    activeTab === "transactions"
                      ? "bg-gradient-to-r from-[#1c1d1c] from-12% to-blue-900 shadow-lg"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <IndianRupee className="w-5 h-5 mr-3" />
                  <span className="font-medium">Transactions</span>
                </TabsTrigger>

                <TabsTrigger
                  value="budgets"
                  onClick={handleTabClick}
                  className={`relative text-white w-full py-3 px-4 rounded-lg flex items-center justify-start ${
                    activeTab === "budgets"
                      ? "bg-gradient-to-r from-[#1c1d1c] from-12% to-blue-900 shadow-lg"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <PieChart className="w-5 h-5 mr-3" />
                  <span className="font-medium">Budgets</span>
                </TabsTrigger>

                <TabsTrigger
                  value="goals"
                  onClick={handleTabClick}
                  className={`relative text-white w-full py-3 px-4 rounded-lg flex items-center justify-start ${
                    activeTab === "goals"
                      ? "bg-gradient-to-r from-[#1c1d1c] from-12% to-blue-900 shadow-lg"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <Target className="w-5 h-5 mr-3" />
                  <span className="font-medium">Savings Goals</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* App version or additional info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white/50 text-xs text-center border-t border-white/10">
              MoneyMap v1.0
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Tabs - Only visible on medium screens and up */}
      <TabsList className="hidden md:grid absolute top-2 right-[30%] gap-2 z-10 mt-2 grid-cols-4 mb-4 bg-gradient-to-r from-[#1a1f2b]/80 to-[#2c3347]/80 backdrop-blur-md border border-[#ffffff20] rounded-xl p-1 shadow-lg">
        <TabsTrigger
          value="overview"
          className="relative text-white bg-gradient-to-r from-gray-800 to-gray-700 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          {activeTab === "overview" && (
            <motion.div
              layoutId="tab-background-desktop"
              className="absolute inset-0 bg-gradient-to-r from-[#1c1d1c] from-12% to-blue-900 rounded-lg shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="transactions"
          className="relative text-white bg-gradient-to-r from-gray-800 to-gray-700 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          {activeTab === "transactions" && (
            <motion.div
              layoutId="tab-background-desktop"
              className="absolute inset-0 bg-gradient-to-r from-[#1c1d1c] from-32% to-blue-900 rounded-lg shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 mr-2" />
            Transactions
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="budgets"
          className="relative text-white bg-gradient-to-r from-gray-800 to-gray-700 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          {activeTab === "budgets" && (
            <motion.div
              layoutId="tab-background-desktop"
              className="absolute inset-0 bg-gradient-to-r from-[#1c1d1c] from-32% to-blue-900 rounded-lg shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center">
            <PieChart className="w-4 h-4 mr-2" />
            Budgets
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="goals"
          className="relative text-white bg-gradient-to-r from-gray-800 to-gray-700 data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          {activeTab === "goals" && (
            <motion.div
              layoutId="tab-background-desktop"
              className="absolute inset-0 bg-gradient-to-r from-[#1c1d1c] from-32% to-blue-900 rounded-lg shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center">
            <Target className="w-4 h-4 mr-2" />
            Savings Goals
          </span>
        </TabsTrigger>
      </TabsList>
    </>
  )
}
