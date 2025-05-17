"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { MoreHorizontal, Edit, Trash2, EyeOff, Eye } from "lucide-react"
import { IndianRupee } from "lucide-react"
import { ResetIcon } from "@radix-ui/react-icons"

export default function BudgetsTab(props) {
  const {
    categories,
    budgets,
    newBudget,
    setNewBudget,
    handleAddBudget,
    handleUpdateBudget,
    handleDeleteBudget,
    handleToggleBudgetStatus,
    handleResetBudget, 
  } = props

  const [isEditing, setIsEditing] = useState(false)
  const [editingBudgetId, setEditingBudgetId] = useState(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState(null)

  const handleEditBudget = (budget) => {
    setNewBudget({
      category: budget.category,
      amount: budget.amount,
    })
    setIsEditing(true)
    setEditingBudgetId(budget._id)
  }

  const handleSaveEdit = () => {
    handleUpdateBudget(editingBudgetId)
    resetForm()
  }

  const confirmDeleteBudget = (budgetId) => {
    console.log("confirm delete budget is called ", budgetId)
    setBudgetToDelete(budgetId)
    setShowDeleteAlert(true)
  }

  const executeDeleteBudget = () => {
    console.log("excecute")
    handleDeleteBudget(budgetToDelete)
    console.log("deleted")
    setShowDeleteAlert(false)
    setBudgetToDelete(null)
  }

  const resetForm = () => {
    setNewBudget({ category: "", amount: "" })
    setIsEditing(false)
    setEditingBudgetId(null)
  }

  return (
    <Card className="bg-white/10 backdrop-blur-none border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-white">Budget Tracking</CardTitle>
        <CardDescription className="text-white/70">Set spending limits for different categories</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="budget-category" className="text-white">
              Category
            </Label>
            <Select
              value={newBudget.category}
              onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
            >
              <SelectTrigger id="budget-category" className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => cat.type === "expense")
                  .map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="budget-amount" className="text-white">
              Budget Amount
            </Label>
            <Input
              id="budget-amount"
              type="number"
              value={newBudget.amount}
              onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
              className="bg-white/20 border-white/30 placeholder-white/60 text-white"
              placeholder="0.00"
            />
          </div>
          {isEditing ? (
            <div className="flex space-x-2">
              <Button onClick={handleSaveEdit} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                Update
              </Button>
              <Button onClick={resetForm} variant="outline" className="border-white/30 text-white bg-white/10">
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAddBudget}
              className=" bg-gradient-to-r from-gray-700 to-slate-800 hover:bg-gradient-to-r hover:from-[#1c1d1c] hover:from-12% hover:to-blue-900  text-white"
            >
              Add Budget
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {!budgets || budgets.length === 0 ? (
            <div className="text-center py-6 text-white/70">No budgets set. Add your first budget above.</div>
          ) : (
            budgets.map((budget) => {
              console.log(budget)

              const percentage = (budget.spent / budget.amount) * 100
              const status = percentage >= 100 ? "exceeded" : percentage >= 80 ? "warning" : "good"

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-white flex items-center">
                      {budget.status == "disabled" && (
                        <Badge variant="outline" className="mr-2 text-gray-400 border-gray-400">
                          Disabled
                        </Badge>
                      )}
                      <span className={budget.status == "disabled" ? "text-white/50" : "text-white"}>
                        {budget.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {budget.status !== "disabled" && (
                        <Badge
                          className={`${
                            status === "exceeded"
                              ? "bg-rose-500"
                              : status === "warning"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                        >
                          {status === "exceeded" ? "Exceeded" : status === "warning" ? "Warning" : "On Track"}
                        </Badge>
                      )}
                      <span
                        className={
                          budget.status == "disabled"
                            ? "text-white/50 relative z-10 flex items-center justify-center"
                            : "text-white relative z-10 flex items-center justify-center"
                        }
                      >
                        <IndianRupee className="w-4 h-4 text-orange-400" /> {Number(budget.spent).toFixed(2)} /{" "}
                        <IndianRupee className="w-4 h-4 text-orange-400 " />
                        {Number(budget.amount).toFixed(2)}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            // variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/70 hover:text-white bg-white/10"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
                          <DropdownMenuItem
                            onClick={() => handleEditBudget(budget)}
                            className="hover:bg-gray-700 cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResetBudget(budget._id)}
                            className="hover:bg-gray-700 cursor-pointer"
                          >
                            <ResetIcon className="mr-2 h-4 w-4" />
                            Reset
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleBudgetStatus(budget._id)}
                            className="hover:bg-gray-700 cursor-pointer"
                          >
                            {budget.status == "disabled" ? (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Enable
                              </>
                            ) : (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Disable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => confirmDeleteBudget(budget._id)}
                            className="text-rose-500 hover:bg-gray-700 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {budget.status !== "disabled" && (
                    <Progress
                      value={percentage > 100 ? 100 : percentage}
                      className={`h-2 ${
                        status === "exceeded" ? "bg-rose-950" : status === "warning" ? "bg-amber-950" : "bg-emerald-950"
                      }`}
                      indicatorClassName={`${
                        status === "exceeded" ? "bg-rose-500" : status === "warning" ? "bg-amber-500" : "bg-emerald-200"
                      }`}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteBudget} className="bg-rose-600 hover:bg-rose-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
