"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Plus, Minus, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function AllTransactions() {
  const { user } = useUser()
  const [transactions, setTransactions] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/transactions?userId=${user.id}`, {
        method: "GET",
      })

      if (!response.ok) throw new Error("Failed to fetch transactions")
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTransaction = async (transaction) => {
    console.log("transaction =", transaction)
    const response = await fetch(`/api/transactions/${transaction?._id}`, {
      method: "DELETE",
      body: JSON.stringify({ userId: user.id }),
    })

    if (response.ok) {
      fetchTransactions()
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (selectedPeriod === "all") return true
    const date = new Date(transaction.createdAt)
    const now = new Date()
    switch (selectedPeriod) {
      case "day":
        return date.toDateString() === now.toDateString()
      case "week":
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        return date >= weekAgo
      case "month":
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      default:
        return true
    }
  })

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-800 via-[#2a2a2a] to-[#1c1c1c] p-4">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <Link href="/" className="text-white mb-4 flex items-center hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <Card className="w-full flex-1 flex flex-col bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-center text-white">All Transactions</CardTitle>
          </CardHeader>

          <div className="flex justify-end px-6 mb-2">
            <Select onValueChange={(value) => setSelectedPeriod(value)} value={selectedPeriod}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CardContent className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center h-40 text-white/70">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex justify-center items-center h-40 text-white/70">
                No transactions found for the selected period.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[calc(100vh-250px)] pr-2 custom-scrollbar">
                <ul className="space-y-2">
                  {filteredTransactions.map((transaction) => (
                    <li
                      key={transaction.id || transaction._id}
                      className="flex justify-between items-center bg-white/10 p-3 rounded-lg hover:bg-white/15 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="flex items-center text-white font-medium">
                          {transaction.type === "income" ? (
                            <Plus className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          ) : (
                            <Minus className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
                          )}
                          {transaction.category}
                        </span>
                        {transaction.description && transaction.description !== transaction.category && (
                          <span className="text-white/60 text-sm ml-6">{transaction.description}</span>
                        )}
                        <span className="text-white/50 text-xs ml-6">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`${
                            transaction.type === "income" ? "text-green-400" : "text-red-400"
                          } mr-4 font-medium`}
                        >
                          ${Number(transaction.amount).toFixed(2)}
                        </span>
                        <Button
                          onClick={() => handleDeleteTransaction(transaction)}
                          variant="ghost"
                          size="icon"
                          className="text-white/50 hover:text-red-400 hover:bg-white/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-white/10 py-3 text-center text-white/50 text-sm">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
