"use client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { IndianRupee } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts"



export default function IncomeExpenseChart({barChartData}) {
  
  return (
    <Card className="bg-white/10 backdrop-blur-none border-white/20 shadow-lg">
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
              <ReferenceLine y={0} stroke="#666" />

              <XAxis
                dataKey="name"
                stroke="#ffffff"
                tick={{ fill: "#ffffff", fontSize: 12 }}
                tickLine={{ stroke: "#ffffff" }}
                axisLine={{ stroke: "#666" }}
              />
              <YAxis
                stroke="#ffffff"
                domain={[0, "auto"]}
                tickFormatter={(value) => `$${value}`}
                tick={{ fill: "#ffffff", fontSize: 12 }}
                tickLine={{ stroke: "#ffffff" }}
                axisLine={{ stroke: "#666" }}
              />
              <Tooltip
               formatter={(value) => [
  <span className="flex items-center text-md">
    <IndianRupee className=" mr-1" />
    {value}
  </span>,
  ""
]}       contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px",
                  color: "#ffffff",
                }}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <Bar
                dataKey="amount"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                // Disable animation if it's causing issues
                isAnimationActive={false}
                // Ensure bars start from 0
                minPointSize={0}
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
