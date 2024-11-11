'use client'
import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [amount, setAmount] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newCategoryType, setNewCategoryType] = useState('expense')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [draggedCategory, setDraggedCategory] = useState(null)

  useEffect(() => {
    fetchTransactions()
    fetchCategories()
  }, [])

  const fetchTransactions = async () => {
    const response = await fetch('/api/transactions')
    const data = await response.json()
    setTransactions(data)
  }

  const fetchCategories = async () => {
    const response = await fetch('/api/categories')
    const data = await response.json()
    setCategories(data)
  }

  const handleAddTransaction = async (category, type) => {
    if (!amount) return

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, amount: parseFloat(amount), type }),
    })

    if (response.ok) {
      setAmount('')
      fetchTransactions()
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory) return

    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory, type: newCategoryType }),
    })

    if (response.ok) {
      setNewCategory('')
      fetchCategories()
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      fetchCategories()
    }
  }

  const handleDragStart = (category) => {
    setDraggedCategory(category)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    if (draggedCategory) {
      handleDeleteCategory(draggedCategory.id)
      setDraggedCategory(null)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const balance = transactions.reduce((sum, transaction) => 
    transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount, 0
  )

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedPeriod === 'all') return true
    const date = new Date(transaction.createdAt)
    const now = new Date()
    switch (selectedPeriod) {
      case 'day':
        return date.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        return date >= weekAgo
      case 'month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      default:
        return true
    }
  })

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const chartData = [
    { name: 'Income', amount: totalIncome },
    { name: 'Expense', amount: totalExpense },
  ]

  return (
    <Card className="w-full max-w-6xl bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-white">Finance Tracker</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white/20 border-white/30 placeholder-white/50 text-white"
              placeholder="Enter amount"
              required
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(category)}
                className={`${
                  category.type === 'income' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                } text-white p-2 rounded cursor-pointer`}
                onClick={() => handleAddTransaction(category.name, category.type)}
              >
                {category.name}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-white/20 border-white/30 placeholder-white/50 text-white"
              placeholder="New category"
            />
            <Select onValueChange={(value) => setNewCategoryType(value)}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddCategory} className="bg-blue-500 hover:bg-blue-600 text-white">
              Add Category
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-white">Recent Transactions</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {filteredTransactions.slice(0, 10).map((transaction) => (
                <li key={transaction.id} className="flex justify-between items-center bg-white/10 p-2 rounded">
                  <span className="flex items-center text-white">
                    {transaction.type === 'income' ? (
                      <Plus className="w-4 h-4 text-green-300 mr-2" />
                    ) : (
                      <Minus className="w-4 h-4 text-red-300 mr-2" />
                    )}
                    {transaction.category}
                  </span>
                  <span className={transaction.type === 'income' ? 'text-green-300' : 'text-red-300'}>
                    ${transaction.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4 border-t border-white/20 flex justify-between items-center">
            <span className="text-lg font-semibold text-white">Balance:</span>
            <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              ${balance.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Financial Overview</h3>
            <Select onValueChange={(value) => setSelectedPeriod(value)}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#ffffff" />
              <YAxis stroke="#ffffff" />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="h-20 bg-white/20 border-white/30 border-dashed rounded flex items-center justify-center text-white"
          >
            <Trash2 className="w-6 h-6 mr-2" />
            Drop here to delete category
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
