'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AllTransactions() {
  const { user } = useUser()
  const [transactions, setTransactions] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?userId=${user.id}`, {
        method: 'GET',
      })
      
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleDeleteTransaction = async (id) => {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId:user.id }),
    })

    if (response.ok) {
      fetchTransactions()
    }
  }

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

  return (
    <div className='w-screen h-screen flex justify-center items-center bg-gradient-to-br from-purple-700 via-blue-800 to-teal-500'>
            <Card className="w-full max-w-4xl mx-auto mt-8 bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-white">All Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
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
        <ul className="space-y-2">
          {filteredTransactions.map((transaction) => (
            <li key={transaction.id} className="flex justify-between items-center bg-white/10 p-2 rounded">
              <span className="flex items-center text-white">
                {transaction.type === 'income' ? (
                  <Plus className="w-4 h-4 text-green-300 mr-2" />
                ) : (
                  <Minus className="w-4 h-4 text-red-300 mr-2" />
                )}
                {transaction.category}
              </span>
              <div className="flex items-center">
                <span className={transaction.type === 'income' ? 'text-green-300 mr-4' : 'text-red-300 mr-4'}>
                  ${transaction.amount.toFixed(2)}
                </span>
                <Button
                  onClick={() => handleDeleteTransaction(transaction.id)}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
    </div>

  )
}