"use client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { IndianRupee } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, CartesianGrid } from "recharts"



export default function IncomeExpenseChart({ barChartData }) {

  return (
    <Card className="bg-gradient-to-br from-[#0a0a0f]/90 to-[#12121e]/90 backdrop-blur-3xl border-white/[0.05] shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-3xl h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-white">Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              baseValue={0}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <ReferenceLine y={0} stroke="#ffffff20" />

              <XAxis
                dataKey="name"
                stroke="#ffffff50"
                tick={{ fill: "#ffffff80", fontSize: 13, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#ffffff50"
                tickFormatter={(value) => `₹${value}`}
                tick={{ fill: "#ffffff80", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                formatter={(value) => [
                  <span key="val" className="flex items-center text-md"><IndianRupee className="h-4 w-4 mr-1" />{value}</span>,
                  "Amount"
                ]}
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                contentStyle={{
                  backgroundColor: "rgba(10, 10, 15, 0.9)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={1500}
                minPointSize={2}
                barSize={40}
              >
                {barChartData && barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
