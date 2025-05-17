"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"

export default function SavingsGoalContribution({ goal, categories, onContributionAdded }) {
  const [open, setOpen] = useState(false)
  const [contribution, setContribution] = useState({
    amount: "",
    type: "income", // Default to income (adding to savings)
    category: "",
    description: `Contribution to ${goal.name}`,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!contribution.amount || !contribution.category) {
      return
    }

    // Create a transaction linked to this savings goal
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: contribution.description,
          amount: Number(contribution.amount),
          type: contribution.type,
          category: contribution.category,
          relatedGoal: goal._id,
          createdAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error("Failed to add contribution")

      // Close dialog and reset form
      setOpen(false)
      setContribution({
        amount: "",
        type: "income",
        category: "",
        description: `Contribution to ${goal.name}`,
      })

      // Notify parent component
      if (onContributionAdded) {
        onContributionAdded()
      }
    } catch (error) {
      console.error("Error adding contribution:", error)
    }
  }

  // Filter categories based on transaction type
  const filteredCategories = categories.filter((cat) =>
    contribution.type === "expense" ? cat.type === "expense" : cat.type === "income",
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Contribute to {goal.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={contribution.amount}
              onChange={(e) => setContribution({ ...contribution, amount: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={contribution.type}
              onValueChange={(value) => setContribution({ ...contribution, type: value })}
            >
              <SelectTrigger id="type" className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="income">Add to Savings (Income)</SelectItem>
                <SelectItem value="expense">Withdraw from Savings (Expense)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={contribution.category}
              onValueChange={(value) => setContribution({ ...contribution, category: value })}
            >
              <SelectTrigger id="category" className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={contribution.description}
              onChange={(e) => setContribution({ ...contribution, description: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
