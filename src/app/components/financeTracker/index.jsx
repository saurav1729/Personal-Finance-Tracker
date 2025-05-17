"use client"

import { useState, useEffect } from "react"
import { DragDropContext } from "react-beautiful-dnd"
import { useUser } from "@clerk/nextjs"
import { Tabs, TabsContent } from "@/components/ui/tabs"

import DashboardCards from "./dashboard-card"
import TabNavigation from "./tab-navigation"
import OverviewTab from "./tabs/overview-tabs"
import TransactionsTab from "./tabs/transaction-tab"
import BudgetsTab from "./tabs/budget-tabs"
import SavingsGoalsTab from "./tabs/saving-goal-tabs"

import { mockTransactions, mockCategories, mockBudgets, mockSavingsGoals, mockInsights } from "./util/mockData"
import { Newspaper } from "lucide-react"

export default function FinanceTracker() {
  const { user } = useUser()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newCategoryType, setNewCategoryType] = useState("expense")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [activeTab, setActiveTab] = useState("overview")
  const [budgets, setBudgets] = useState([])
  const [newBudget, setNewBudget] = useState({ category: "", amount: "", period: "month" })
  const [savingsGoals, setSavingsGoals] = useState([])
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", currentAmount: 0, deadline: "" })
  const [insights, setInsights] = useState([])

  useEffect(() => {
    if (user) {
      console.log("all api called"); 
      fetchTransactions()
      fetchCategories()
      fetchBudgets()
      fetchSavingsGoals()
      generateInsights()
    } else {
      setTransactions(mockTransactions)
      setCategories(mockCategories)
      setBudgets(mockBudgets)
      setSavingsGoals(mockSavingsGoals)
      setInsights(mockInsights)
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?userId=${user?.id}`, {
        method: "GET",
      })
     
      if (!response.ok) throw new Error("Failed to fetch transactions")
      const data = await response.json()
      setTransactions(data)
      console.log("succesing in fetching transaction")
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setTransactions(mockTransactions)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?userId=${user?.id}`)
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data)
      console.log("succesing in fetching categories")
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories(mockCategories)
    }
  }

  const fetchBudgets = async () => {
    if(!user?.id)return; 
    try {
      const res = await fetch(`/api/budget?userId=${user?.id}`);
      const data = await res.json();
      setBudgets(data);
      console.log("succesing in fetching categories")
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
      setBudgets(mockBudgets); // optional fallback in UI
    }
  };
  

  const fetchSavingsGoals = async () => {
    if(!user.id)return; 
    try{
      const res = await fetch(`/api/goals?userId=${user?.id}`);
      const data = await res.json(); 
      setSavingsGoals(data); 
    }catch(err){
      console.error("failed to fetch budget:", err); 
      setSavingsGoals(mockSavingsGoals)
    }
  }

  const generateInsights = () => {
    // In a real app, this might be generated on the server
    setInsights(mockInsights)
  }

  const handleAddTransaction = async (category, type) => {
    if (!amount) return

    try {
      const newTransaction = {
        id: `temp-${Date.now()}`,
        category,
        amount: Number.parseFloat(amount),
        description: description || category,
        type,
        userId: user?.id,
        createdAt: new Date().toISOString(),
      }

      setTransactions([newTransaction, ...transactions])

      if (user) {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTransaction),
        })

        if (!response.ok) throw new Error("Failed to add transaction")
        fetchTransactions()
        fetchBudgets()
      }

      setAmount("")
      setDescription("")
    } catch (error) {
      console.error("Error adding transaction:", error)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory) return

    try {
      const newCategoryObj = {
        id: `cat-${Date.now()}`,
        name: newCategory,
        type: newCategoryType,
        userId: user?.id,
      }

      setCategories([...categories, newCategoryObj])

      if (user) {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCategoryObj),
        })

        if (!response.ok) throw new Error("Failed to add category")
        fetchCategories()
      }

      setNewCategory("")
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    try {
      setCategories(categories.filter((cat) => cat.id !== categoryId))

      if (user) {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: "DELETE",
          body: JSON.stringify({ userId: user.id }),
        })

        if (!response.ok) throw new Error("Failed to delete category")
        fetchCategories()
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.amount || !user) return;
  
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId:user.id,
          category: newBudget.category,
          amount: parseFloat(newBudget.amount),
        }),
      });
  
      if (!res.ok) throw new Error('Failed to add budget');
  
      const savedBudget = await res.json();
      setBudgets([...budgets, { ...savedBudget, spent: 0 }]);
      fetchBudgets(user.id)
      setNewBudget({ category: '', amount: '', period: 'month' });
    } catch (error) {
      console.error('Add Budget Error:', error);
    }
  };

  const  handleDeleteBudget=async (budgetId)=>{
    if(!budgetId||!user)return ; 

    try {
      const res = await fetch(`/api/budget/${budgetId}`, {
        method: "DELETE",
        body: JSON.stringify({ userId: user.id }),
      })
      if (!res.ok) throw new Error('Failed to Delete budget');
      fetchBudgets();
      // setNewBudget({ category: '', amount: '', period: 'month' });
    } catch (error) {
      console.error('Add Budget Error:', error);
    }
  }

  const handleUpdateBudget = async (editingBudgetId) => {
    if (!newBudget.category || !newBudget.amount || !user) return;
  
    try {
      const res = await fetch(`/api/budget/${editingBudgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          updatedBudget: newBudget,
        }),
      });
  
      if (!res.ok) throw new Error('Failed to update budget');
  
      const { message, updatedBudgets } = await res.json();
      console.log(updatedBudgets); 
      console.log(message); // Optional: log success message
      setBudgets(updatedBudgets); // Replace full budgets list
      setNewBudget({ category: '', amount: '', period: 'month' }); // Reset form
    } catch (error) {
      console.error('Update Budget Error:', error);
    }
  };

  const handleToggleBudgetStatus = async (budgetId) => {
    if (!budgetId || !user) return;
  
    try {
      const res = await fetch(`/api/budget/${budgetId}/toggle-status`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
  
      if (!res.ok) throw new Error('Failed to toggle budget status');
  
      const {updatedBudget} = await res.json(); 

      setBudgets(
        budgets.map((budget) => {
          // Only update the status of the budget with the matching ID
          if (budget._id === budgetId) {
            const newStatus = updatedBudget.status; 

            return {
              ...budget,
              status: newStatus,
            }
          }
          // Return other budgets unchanged
          return budget
        })
      ); 

      console.log('Toggled budget:', data);
      
    } catch (err) {
      console.log('Toggle status error', err);
    }
  };

  const handleResetBudget =async(budgetId)=>{
    if(!budgetId ||!user)return ; 
    console.log("budgetId", budgetId); 

    try{
       const res = await fetch(`/api/budget/${budgetId}/reset-budget`, {
        method:'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
       }); 

       if(!res.ok)throw new Error('uable to reset the budget'); 
       const {updatedBudget} = res.json();

       console.log(updatedBudget); 

       setBudgets(budgets.map((budget)=>{
        if(budget._id === budgetId){
          const newSpent = updatedBudget?.spent||'0.0'; 
          return {
            ...budget, 
             spent:newSpent
          }
        }
        return budget;
       })); 



    }catch(err){

    }
  }




  const handleUpdateSavingsGoal = async (goalId, updatedGoal) => {
    if (
      !goalId ||
      !user ||
      !updatedGoal.name ||
      updatedGoal.targetAmount === undefined ||
      updatedGoal.currentAmount === undefined ||
      !updatedGoal.deadline
    ) return;
  
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          updatedGoal: updatedGoal,
        }),
      });
  
      if (!res.ok) throw new Error("Failed to update savings goal");
  
      const { message, updated } = await res.json();
      console.log(message); // Optional: log success message
  
      setSavingsGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal._id === goalId ? { ...goal, ...updated } : goal
        )
      );
  
      setNewGoal({
        name: "",
        targetAmount: "",
        currentAmount: "",
        deadline: "",
      });
    } catch (error) {
      console.error("Update Savings Goal Error:", error);
    }
  };
  



  const handleToggleSavingsGoalStatus = async (goalId) => {
    if (!goalId || !user) return

    try {
      const res = await fetch(`/api/goals/${goalId}/toggle-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!res.ok) throw new Error("Failed to toggle savings goal status")

      const { updatedGoal } = await res.json()

      setSavingsGoals(
        savingsGoals.map((goal) => {
          if (goal._id === goalId) {
            const newStatus  = updatedGoal?.status; 
            return {
              ...goal,
              disabled: newStatus,
            }
          }
          return goal
        }),
      )
      fetchSavingsGoals();

      console.log("Toggled savings goal:", updatedGoal)
    } catch (err) {
      console.log("Toggle savings goal status error", err)
    }
  }
  
  
  const handleDeleteSavingsGoal = async (goalId) => {
    console.log("handle delete")
    if (!goalId || !user) return
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
        body: JSON.stringify({ userId: user.id }),
      })
      if (!res.ok) throw new Error("Failed to delete savings goal")

      setSavingsGoals(savingsGoals.filter((goal) => goal.id !== goalId))
      fetchSavingsGoals()
    } catch (error) {
      console.error("Delete Savings Goal Error:", error)
    }
  }
  

  const handleAddSavingsGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) return;
  
    const goalData = {
      userId:user?.id, // make sure userId is available in this scope
      name: newGoal.name,
      targetAmount: Number.parseFloat(newGoal.targetAmount),
      currentAmount: Number.parseFloat(newGoal.currentAmount) || 0,
      deadline: newGoal.deadline || null,
    };
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });
  
      if (!response.ok) {
        throw new Error("Failed to add savings goal");
      }
      const savedGoal = await response.json();
      setSavingsGoals([...savingsGoals, savedGoal]);
      fetchSavingsGoals(user.id)
      setNewGoal({ name: "", targetAmount: "", disabled:false , currentAmount: 0, deadline: "" });
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  
  const onDragEnd = (result) => {
    if (!result.destination) return
    if (result.destination.droppableId === "delete-zone") {
      handleDeleteCategory(result.draggableId)
    }
  }

  const handleExportData = () => {
    const exportData = {
      transactions: transactions.map(t => ({
        'Description': t.description || '',
        'Amount': t.amount,
        'Type': t.type === 'income' ? 'Income' : 'Expense',
        'Category': t.category,
        'Date': new Date(t.createdAt).toLocaleDateString(),
      })),
      budgets: budgets.map(b => ({
        'Category': b.category,
        'Budget Amount': b.amount,
        'Spent': b.spent,
        'Remaining': b.amount - b.spent,
        'Status': b.status === 'active' ? 'Active' : 'Disabled'
      })),
      savingsGoals: savingsGoals.map(g => ({
        'Goal Name': g.name,
        'Target Amount': g.targetAmount,
        'Current Amount': g.currentAmount,
        'Progress (%)': ((g.currentAmount / g.targetAmount) * 100).toFixed(1) + '%',
        'Remaining': g.targetAmount - g.currentAmount,
        'Deadline': g.deadline ? new Date(g.deadline).toLocaleDateString() : 'No deadline',
        'Status': g.disabled ? 'Paused' : 'Active'
      }))
    }
  
    if (typeof window !== "undefined") {
      import("xlsx").then((XLSX) => {
        const workbook = XLSX.utils.book_new()
  
        // Add a custom CSS stylesheet for better appearance
        workbook.Workbook = { 
          Views: [{ RTL: false }],
          Sheets: [] 
        }
  
        Object.entries(exportData).forEach(([sheetName, data]) => {
          if (data.length === 0) return
  
          // Create worksheet
          const worksheet = XLSX.utils.json_to_sheet(data)
  
          // Set column widths
          let keys = []
          const columnWidths = []
          const maxWidth = 50
  
          if (data.length > 0) {
            keys = Object.keys(data[0])
            keys.forEach(k => {
              let width = k.length + 2
              data.slice(0, 100).forEach(row => {
                const cellValue = String(row[k] || '')
                width = Math.max(width, cellValue.length + 2)
              })
              columnWidths.push({ wch: Math.min(width, maxWidth) })
            })
  
            worksheet['!cols'] = columnWidths
          }
  
          // Add custom properties for Excel to interpret
          // These won't affect the actual styling in JS but will be used by Excel
          if (worksheet['!ref']) {
            // Add conditional formatting and table styling via XML
            // This is a workaround since we can't directly style cells with xlsx
            if (!worksheet['!autofilter']) {
              const range = XLSX.utils.decode_range(worksheet['!ref'])
              worksheet['!autofilter'] = {
                ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } })
              }
            }
          }
  
          // Set sheet name
          const titleKey = {
            'transactions': 'Transaction History',
            'budgets': 'Budget Summary',
            'savingsGoals': 'Savings Goals'
          }
  
          // Add the sheet to workbook
          XLSX.utils.book_append_sheet(workbook, worksheet, titleKey[sheetName] || sheetName)
          
          // Add table formatting
          const wsName = workbook.SheetNames[workbook.SheetNames.length - 1]
          const sheet = workbook.Sheets[wsName]
          
          // Add table format (this will be interpreted by Excel)
          if (sheet['!ref']) {
            const range = XLSX.utils.decode_range(sheet['!ref'])
            sheet['!table'] = {
              ref: sheet['!ref'],
              name: `Table_${wsName.replace(/\s+/g, '_')}`,
              style: 'TableStyleMedium2' // This is a built-in Excel table style
            }
          }
        })
  
        // Write file
        const fileName = `moneymap-export-${new Date().toISOString().slice(0, 10)}.xlsx`
        XLSX.writeFile(workbook, fileName)
      })
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
        const weekAgo = new Date()
        weekAgo.setDate(now.getDate() - 7)
        return date >= weekAgo
      case "month":
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      case "year":
        return date.getFullYear() === now.getFullYear()
      default:
        return true
    }
  })

  const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="w-full">

      {activeTab !== "transactions" && (
      <DashboardCards
        balance={balance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        savingsRate={savingsRate}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        handleExportData={handleExportData}
        insights={insights}
      />
    )}
       

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
              filteredTransactions={filteredTransactions}
            />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 ">
            <TransactionsTab
              amount={amount}
              setAmount={setAmount}
              description={description}
              setDescription={setDescription}
              categories={categories}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
              newCategoryType={newCategoryType}
              setNewCategoryType={setNewCategoryType}
              handleAddTransaction={handleAddTransaction}
              handleAddCategory={handleAddCategory}
              filteredTransactions={filteredTransactions}
            />
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <BudgetsTab
              categories={categories}
              budgets={budgets}
              newBudget={newBudget}
              setNewBudget={setNewBudget}
              handleAddBudget={handleAddBudget}
              handleUpdateBudget={handleUpdateBudget}
              handleDeleteBudget={handleDeleteBudget}
              handleToggleBudgetStatus={handleToggleBudgetStatus}
              handleResetBudget = {handleResetBudget}
            />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
          <SavingsGoalsTab
            savingsGoals={savingsGoals}
            newGoal={newGoal}
            setNewGoal={setNewGoal}
            categories = {categories}
            handleAddSavingsGoal={handleAddSavingsGoal}
            handleUpdateSavingsGoal={handleUpdateSavingsGoal}
            handleDeleteSavingsGoal={handleDeleteSavingsGoal}
            handleToggleSavingsGoalStatus={handleToggleSavingsGoalStatus}
          />
     
          </TabsContent>

          <TabNavigation activeTab={activeTab} />
        </Tabs>
      </div>
    </DragDropContext>
  )
}
