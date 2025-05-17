export const mockTransactions = [
    {
      id: "t1",
      category: "Salary",
      amount: 3500,
      description: "Monthly salary",
      type: "income",
      createdAt: new Date(2023, 4, 1).toISOString(),
    },
    {
      id: "t2",
      category: "Rent",
      amount: 1200,
      description: "May rent",
      type: "expense",
      createdAt: new Date(2023, 4, 2).toISOString(),
    },
    {
      id: "t3",
      category: "Groceries",
      amount: 250,
      description: "Weekly shopping",
      type: "expense",
      createdAt: new Date(2023, 4, 5).toISOString(),
    },
    {
      id: "t4",
      category: "Dining",
      amount: 85,
      description: "Restaurant dinner",
      type: "expense",
      createdAt: new Date(2023, 4, 8).toISOString(),
    },
    {
      id: "t5",
      category: "Freelance",
      amount: 800,
      description: "Website project",
      type: "income",
      createdAt: new Date(2023, 4, 10).toISOString(),
    },
    {
      id: "t6",
      category: "Utilities",
      amount: 150,
      description: "Electricity bill",
      type: "expense",
      createdAt: new Date(2023, 4, 15).toISOString(),
    },
    {
      id: "t7",
      category: "Transportation",
      amount: 120,
      description: "Gas",
      type: "expense",
      createdAt: new Date(2023, 4, 18).toISOString(),
    },
    {
      id: "t8",
      category: "Entertainment",
      amount: 50,
      description: "Movie tickets",
      type: "expense",
      createdAt: new Date(2023, 4, 20).toISOString(),
    },
  ]
  
  export const mockCategories = [
    { id: "c1", name: "Salary", type: "income" },
    { id: "c2", name: "Freelance", type: "income" },
    { id: "c3", name: "Rent", type: "expense" },
    { id: "c4", name: "Groceries", type: "expense" },
    { id: "c5", name: "Dining", type: "expense" },
    { id: "c6", name: "Utilities", type: "expense" },
    { id: "c7", name: "Transportation", type: "expense" },
    { id: "c8", name: "Entertainment", type: "expense" },
  ]
  
  export const mockBudgets = [
    { id: "b1", category: "Groceries", amount: 400, spent: 250, period: "month" },
    { id: "b2", category: "Dining", amount: 200, spent: 85, period: "month" },
    { id: "b3", category: "Entertainment", amount: 100, spent: 50, period: "month" },
  ]
  
  export const mockSavingsGoals = [
    {
      id: "g1",
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 5000,
      deadline: "2023-12-31",
      createdAt: new Date(2023, 0, 1).toISOString(),
    },
    {
      id: "g2",
      name: "Vacation",
      targetAmount: 3000,
      currentAmount: 1200,
      deadline: "2023-08-31",
      createdAt: new Date(2023, 2, 15).toISOString(),
    },
  ]
  
  export const mockInsights = [
    {
      id: "i1",
      title: "Spending Trend",
      description: "Your spending on Dining has decreased by 15% compared to last month. Great job!",
    },
    { id: "i2", title: "Budget Alert", description: "You've used 80% of your Entertainment budget this month." },
    {
      id: "i3",
      title: "Savings Tip",
      description: "Consider setting up automatic transfers to your savings goals to stay on track.",
    },
  ]
  