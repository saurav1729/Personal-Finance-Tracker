import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts"
import IncomeExpenseChart from "../IncomeExpenseChart";
import { IndianRupeeIcon } from "lucide-react";
import { IndianRupee } from "lucide-react";


export default function OverviewTab(props) {
  const { totalIncome, totalExpense, balance, filteredTransactions } = props;
  const barChartData = [
    { name: "Income", amount: totalIncome, fill: "url(#colorIncome)" },
    { name: "Expense", amount: totalExpense, fill: "url(#colorExpense)" },
    { name: "Balance", amount: Math.max(0, balance), fill: "url(#colorBalance)" },
  ]

  const expensesByCategory = {}
  filteredTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount
    })

  const pieChartData = Object.keys(expensesByCategory).map((category) => ({
    name: category,
    value: expensesByCategory[category],
  }))


  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0];
      return (
        <div style={{ backgroundColor: "#1c1c1c99", backdropFilter:"blur(10px)",  color:"#fff",  border: "1px solid #ccc", borderRadius:"10px", padding: 10 }}>
          <p><strong>{name}</strong></p>
          <span className="flex items-center text-white gap-1">
      <IndianRupee className="inline-block h-3 w-3" />
      {value}
    </span>
        </div>
      );
    }

    return null;
  };

  const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#06b6d4", "#14b8a6", "#3b82f6", "#f43f5e", "#f59e0b"]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <IncomeExpenseChart barChartData = {barChartData}/>


      <Card className="bg-gradient-to-br from-[#0a0a0f]/90 to-[#12121e]/90 backdrop-blur-3xl border-white/[0.05] shadow-[0_0_80px_rgba(0,0,0,0.5)] rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={65}
                outerRadius={90}
                paddingAngle={4}
                cornerRadius={6}
                fill="#8884d8"
                dataKey="value"
                className="stroke-transparent outline-none"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
