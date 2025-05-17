"use client"

import { Plus, Minus, Trash2 } from "lucide-react"
import Link from "next/link"
import { Droppable, Draggable } from "react-beautiful-dnd"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { IndianRupee } from "lucide-react"


export default function TransactionsTab(props) {
    const {
        amount,
        setAmount,
        description,
        setDescription,
        categories,
        newCategory,
        setNewCategory,
        newCategoryType,
        setNewCategoryType,
        handleAddTransaction,
        handleAddCategory,
        filteredTransactions,
      } = props; 
      const [showAll, setShowAll] = useState(false);
      const visibleCategories = showAll ? categories : categories.slice(0, 4);
  return (
    <>
      <Card className="bg-white/10 backdrop-blur-none mt-[-12px]   border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Add Transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="Enter amount"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description (Optional)
              </Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="Enter description"
              />
            </div>
          </div>

          <div className="space-y-2">
      <Label className="text-white">Categories</Label>
      <Droppable droppableId="categories" direction="horizontal">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex flex-wrap gap-2"
          >
            {visibleCategories.map((category, index) => (
              <Draggable key={category.id} draggableId={category.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${
                      category.type === "income"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                        : "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
                    } text-white py-2 px-3 rounded-full cursor-pointer transition-all duration-200 flex items-center shadow-md`}
                    onClick={() => handleAddTransaction(category.name, category.type)}
                  >
                    {category.type === "income" ? (
                      <Plus className="w-4 h-4 mr-1" />
                    ) : (
                      <Minus className="w-4 h-4 mr-1" />
                    )}
                    {category.name}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {categories.length > 4 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-full transition-all duration-200 shadow-md"
              >
                {showAll ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="New category name"
              />
            </div>
            <div className="flex space-x-2">
              <Select value={newCategoryType} onValueChange={(value) => setNewCategoryType(value)} className="flex-1">
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700 text-white">
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-none  border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-auto overflow-y-auto pr-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-6 text-white/70">No transactions found for the selected period.</div>
            ) : (
              filteredTransactions.slice(0,3).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "income"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {transaction.type === "income" ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-white">{transaction.category}</div>
                      <div className="text-sm text-white/70">{transaction.description}</div>
                      <div className="text-xs text-white/50">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${transaction.type === "income" ? "text-emerald-300" : "text-rose-300"
                      } flex items-center gap-1`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    <IndianRupee className="inline-block h-4 w-4" />
                    {transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-white/10 pt-4">
          <Link href="/transactions" className="text-blue-300 hover:text-blue-400 flex items-center">
            View all transactions
            <ChevronDown className="w-4 h-4 ml-1" />
          </Link>
        </CardFooter>
      </Card>

      <Droppable droppableId="delete-zone">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="h-20 bg-white/10 border border-white/20 border-dashed rounded-lg flex items-center justify-center text-white/70 mt-4"
          >
            <Trash2 className="w-5 h-5 mr-2 text-rose-400" />
            Drop category here to delete
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </>
  )
}
