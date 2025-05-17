"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpCircle, ArrowDownCircle, Info, Calendar, TrendingUp } from "lucide-react"
import { IndianRupee } from "lucide-react"
import SavingsGoalContribution from "./savingGoalCotribution"

export default function SavingsGoalDetails({ goal, transactions, categories, onContributionAdded }) {
  const [open, setOpen] = useState(false)
  const [goalTransactions, setGoalTransactions] = useState([])

  const daysRemaining = goal.deadline
    ? Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : null
  const percentComplete = (goal.currentAmount / goal.targetAmount) * 100
  const amountRemaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const dailySavingsNeeded = daysRemaining && daysRemaining > 0 ? amountRemaining / daysRemaining : 0
  useEffect(() => {
    const filtered = transactions.filter((t) => t.relatedGoal === goal.id)
    setGoalTransactions(filtered)
  }, [transactions, goal.id])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white bg-white/10">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{goal.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress and Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Progress</span>
              <span className="font-medium">{percentComplete.toFixed(0)}%</span>
            </div>
            <Progress value={percentComplete} className="h-2 bg-blue-950" indicatorClassName="bg-blue-500" />
            <div className="flex justify-between text-sm mt-1">
            <div className="flex justify-between text-sm mt-1">
  <span className="text-white/70">
    <IndianRupee className="inline h-3 w-3" /> 
    {Number(goal.currentAmount ?? 0).toFixed(2)}
  </span>
  <span className="text-white">
    <IndianRupee className="inline h-3 w-3" /> 
    {Number(goal.targetAmount ?? 0).toFixed(2)}
  </span>
</div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-700 border-gray-600 p-4">
              <div className="flex items-center space-x-2 text-white/70 mb-1">
                <IndianRupee className="h-4 w-4" />
                <span>Remaining</span>
              </div>
              <div className="text-xl font-medium">
                <IndianRupee className="inline h-4 w-4" /> {amountRemaining.toFixed(2)}
              </div>
            </Card>

            {goal.deadline && (
              <Card className="bg-gray-700 border-gray-600 p-4">
                <div className="flex items-center space-x-2 text-white/70 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Days Left</span>
                </div>
                <div className="text-xl font-medium">
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                </div>
              </Card>
            )}

            {goal.deadline && daysRemaining > 0 && (
              <Card className="bg-gray-700 border-gray-600 p-4">
                <div className="flex items-center space-x-2 text-white/70 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Daily Target</span>
                </div>
                <div className="text-xl font-medium">
                  <IndianRupee className="inline h-4 w-4" /> {dailySavingsNeeded.toFixed(2)}
                </div>
              </Card>
            )}
          </div>

          {/* Contribution Button */}
          <div className="flex justify-end">
            <SavingsGoalContribution goal={goal} categories={categories} onContributionAdded={onContributionAdded} />
          </div>

          {/* Transactions */}
          <div>
            <h3 className="text-lg font-medium mb-3">Goal Transactions</h3>
            {goalTransactions.length === 0 ? (
              <div className="text-center py-4 text-white/70 bg-gray-700/50 rounded-md">
                No transactions for this goal yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-white">Description</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goalTransactions.map((transaction) => (
                      <TableRow key={transaction._id || transaction.id} className="border-gray-700">
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center space-x-2">
                            {transaction.type === "income" ? (
                              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                            )}
                            <span>{transaction.description}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            transaction.type === "income" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          <div className="flex items-center justify-end">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {transaction.amount.toFixed(2)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
