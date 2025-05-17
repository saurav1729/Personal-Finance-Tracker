"use client"

import { Wallet, Calendar, TrendingUp, Download, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { IndianRupee } from "lucide-react"



export default function DashboardCards(props) {
  const {
    balance,
    totalIncome,
    totalExpense,
    savingsRate,
    selectedPeriod,
    setSelectedPeriod,
    handleExportData,
    insights,
  } = props;
  return (
    <div className=" grid grid-cols-1 md:grid-cols-3 gap-6  mb-6">
      {/* Balance Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#1a1f2b] via-[#2c3347] to-[#1e293b] text-white border border-[#ffffff20] shadow-xl">
        {/* Platinum card texture/pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-400/20 to-purple-500/20"></div>
          <div className="absolute top-10 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-r from-blue-400/10 to-purple-500/10"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgtMXYxaDF2LTF6bS0yLTJoMXYxaC0xdi0xem0yLTJoMXYxaC0xdi0xem0tMi0yaDF2MWgtMXYtMXptLTItMmgxdjFoLTF2LTF6bS0yIDBoMXYxaC0xdi0xem0tMi0yaDF2MWgtMXYtMXptMi0yaDF2MWgtMXYtMXptLTItMmgxdjFoLTF2LTF6bTQtMmgxdjFoLTF2LTF6bTItMmgxdjFoLTF2LTF6bTIgMGgxdjFoLTF2LTF6bTIgMGgxdjFoLTF2LTF6bTIgMGgxdjFoLTF2LTF6bTIgMGgxdjFoLTF2LTF6bTIgMGgxdjFoLTF2LTF6bTIgMGgxdjFoLTF2LTF6bTIgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6bTAgMmgxdjFoLTF2LTF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        </div>

        {/* Decorative card elements */}
        <div className="absolute top-3 right-3 w-12 h-8 rounded-md border border-[#ffffff30] opacity-50"></div>
        <div className="absolute bottom-4 left-4 w-10 h-6 rounded-sm bg-gradient-to-r from-yellow-400/30 to-yellow-600/30"></div>

        {/* Horizontal lines like credit card */}
        <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
        <div className="absolute top-2/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"></div>

        <CardHeader className="pb-2 relative z-10 pt-6">
          <CardTitle className="text-xl font-medium flex items-center">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-1.5 rounded-full mr-2 shadow-lg">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-white">Current Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 pb-6">
          <div className="text-4xl font-bold text-white mt-2 mb-6">
            <span className="flex start-0 items-center">
              <IndianRupee className="inline" /> {balance.toFixed(2)}
            </span>


          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#ffffff10] p-3 rounded-lg border border-[#ffffff15]">
              <div className="text-gray-300 text-sm mb-1">Income</div>
              <div className="font-semibold text-white">
                <span className="flex start-0 items-center ">
                  <IndianRupee className="inline h-4 w-4" />  {totalIncome.toFixed(2)}
                </span>

              </div>
            </div>
            <div className="bg-[#ffffff10] p-3 rounded-lg border border-[#ffffff15]">
              <div className="text-gray-300 text-sm mb-1">Expenses</div>
              <div className="font-semibold text-white">
                <span className="flex start-0 items-center ">
                  <IndianRupee className="inline h-4 w-4" />   {totalExpense.toFixed(2)}
                </span>

              </div>
            </div>
            <div className="bg-[#ffffff10] p-3 rounded-lg border border-[#ffffff15]">
              <div className="text-gray-300 text-sm mb-1">Savings Rate</div>
              <div className="font-semibold text-white">{savingsRate.toFixed(0)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Selector and Export */}
      <Card className="bg-white/10 border-white/20 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Time Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="w-full mt-4 bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={handleExportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card className="bg-white/10 backdrop-blur-none border-white/20 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.map((insight) => (
            <div key={insight.id} className="flex items-start space-x-2 text-sm">
              <AlertCircle className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-white">{insight.title}</div>
                <div className="text-white/80">{insight.description}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
