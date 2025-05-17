import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts"
import IncomeExpenseChart from "../IncomeExpenseChart";
import { IndianRupeeIcon } from "lucide-react";
import { IndianRupee } from "lucide-react";


export default function OverviewTab(props) {
  const { totalIncome, totalExpense, balance, filteredTransactions } = props;
  const barChartData = [
    { name: "Income", amount: totalIncome, fill: "#10b981" },
    { name: "Expense", amount: totalExpense, fill: "#ef4444" },
    { name: "Balance", amount: balance, fill: "#3b82f6" },
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <IncomeExpenseChart barChartData = {barChartData}/>


      {/* Pie Chart */}
      <Card className="bg-white/10 backdrop-blur-none border-white/20 shadow-lg">
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
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                className="border-none"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
