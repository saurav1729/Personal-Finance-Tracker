"use client"

import { useState, useEffect } from "react"
import { PiggyBank, MoreHorizontal, Edit, Trash2, EyeOff, Eye } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import SavingsGoalDetails from "./savingsGoal/savingGoalDetail"
import { IndianRupee } from "lucide-react"

export default function SavingsGoalsTab(props) {
  const {
    savingsGoals,
    newGoal,
    setNewGoal,
    categories, 
    handleAddSavingsGoal,
    handleUpdateSavingsGoal,
    handleDeleteSavingsGoal,
    handleToggleSavingsGoalStatus,
  } = props

  const [isEditing, setIsEditing] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Load transactions
  // useEffect(() => {
  //   // const loadTransactions = async () => {
  //   //   try {
  //   //     const response = await fetch("/api/transactions")
  //   //     if (response.ok) {
  //   //       const data = await response.json()
  //   //       setTransactions(data)
  //   //     }
  //   //   } catch (error) {
  //   //     console.error("Error loading transactions:", error)
  //   //   }
  //   // }

  //   // loadTransactions()
  // }, [refreshKey])

  const handleEditGoal = (goal) => {
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      disabled:goal.disabled, 
      deadline: goal.deadline,
    })
    setIsEditing(true)
    setEditingGoalId(goal._id)
  }

  const handleSaveEdit = () => {
    handleUpdateSavingsGoal(editingGoalId, newGoal)
    resetForm()
  }

  const confirmDeleteGoal = (goalId) => {
    console.log("confirm"); 
    setGoalToDelete(goalId)
    setShowDeleteAlert(true)
  }

  const executeDeleteGoal = () => {
    console.log("execute"); 
    handleDeleteSavingsGoal(goalToDelete)
    setShowDeleteAlert(false)
    setGoalToDelete(null)
  }

  const resetForm = () => {
    setNewGoal({ name: "", targetAmount: "", currentAmount: "", deadline: "" })
    setIsEditing(false)
    setEditingGoalId(null)
  }

  const handleContributionAdded = () => {
    // Refresh transactions
    setRefreshKey((prev) => prev + 1)
  }



  return (
    <Card className="bg-white/10 backdrop-blur-none border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-white">Savings Goals</CardTitle>
        <CardDescription className="text-white/70">Track your progress towards financial goals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-name" className="text-white">
                Goal Name
              </Label>
              <Input
                id="goal-name"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="e.g., Vacation, Emergency Fund"
              />
            </div>
            <div>
              <Label htmlFor="goal-target" className="text-white">
                Target Amount
              </Label>
              <Input
                id="goal-target"
                type="text"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-current" className="text-white">
                Current Amount
              </Label>
              <Input
                id="goal-current"
                type="text"
                value={newGoal.currentAmount}
                onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="goal-deadline" className="text-white">
                Target Date (Optional)
              </Label>
              <Input
                id="goal-deadline"
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="flex space-x-2">
            <Button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Edit className="w-4 h-4 mr-2" />
              Update Goal
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="flex-1 border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleAddSavingsGoal}
            className="w-full bg-gradient-to-br from-[#1a1f2b] via-[#2c3347] to-[#1e293b] hover:bg-gradient-to-r hover:from-[#1c1c1c] hover:from-[30%] hover:to-blue-800 text-white"
          >
            <PiggyBank className="w-4 h-4 mr-2" />
            Add Savings Goal
          </Button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {!savingsGoals ||savingsGoals.length === 0 ? (
            <div className="md:col-span-2 text-center py-6 text-white/70">
              No savings goals yet. Add your first goal above.
            </div>
          ) : (
            savingsGoals.map((goal) => {
              const percentage = (goal.currentAmount / goal.targetAmount) * 100
              const remaining = goal.targetAmount - goal.currentAmount

              return (
                <Card
                  key={goal.id}
                  className={`${goal.disabled ? "bg-white/5 opacity-70" : "bg-white/5"} border-white/10`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <CardTitle className={`text-lg font-medium ${goal.disabled ? "text-white/60" : "text-white"}`}>
                          {goal.name}
                        </CardTitle>
                        {goal.disabled && (
                          <Badge variant="outline" className="ml-2 text-gray-400 border-gray-400">
                            Paused
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!goal.disabled && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-[#24b95ddd]">{percentage.toFixed(0)}%</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  ${Number(goal.currentAmount).toFixed(2)} of ${Number(goal.targetAmount).toFixed(2)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Goal Details Button */}
                        <SavingsGoalDetails
                          goal={goal}
                          transactions={transactions}
                          categories={categories}
                          onContributionAdded={handleContributionAdded}
                        />

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              className="h-8 w-8 text-white/70 hover:text-white bg-white/30 border border-[#ffffff90]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
                            <DropdownMenuItem
                              onClick={() => handleEditGoal(goal)}
                              className="hover:bg-gray-700 cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleSavingsGoalStatus(goal._id)}
                              className="hover:bg-gray-700 cursor-pointer"
                            >
                              {goal.disabled ? (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Resume
                                </>
                              ) : (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Pause
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDeleteGoal(goal._id)}
                              className="text-rose-500 hover:bg-gray-700 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {goal.deadline && (
                      <CardDescription className={`${goal.disabled ? "text-white/50" : "text-white/70"}`}>
                        Target date: {new Date(goal.deadline).toLocaleDateString()}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    {!goal.disabled && (
                      <>
                        <Progress value={percentage} className="h-2 bg-blue-950" indicatorClassName="bg-blue-500" />
                        <div className="flex justify-between mt-2 text-sm text-white">
                          <span className="text-white/70 flex items-center gap-1">
                            <IndianRupee className="h-3 w-3 inline-block" />
                            {remaining.toFixed(2)} remaining
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3 inline-block" />
                            {Number(goal.currentAmount).toFixed(2)} /
                            <IndianRupee className="h-3 w-3 inline-block" />
                            {Number(goal.targetAmount).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </CardContent>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this savings goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteGoal} className="bg-rose-600 hover:bg-rose-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
