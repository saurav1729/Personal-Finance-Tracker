"use client"

import { useState, useMemo } from "react"
import { Plus, Minus, Trash2, Search, Filter, TrendingUp, TrendingDown, ArrowUpDown, X, IndianRupee, Zap } from "lucide-react"
import { Droppable, Draggable } from "react-beautiful-dnd"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// ── Category pill with drag support ──────────────────────────────────────────
function CategoryPill({ category, index, onAdd }) {
  const isIncome = category.type === "income"
  return (
    <Draggable key={category._id || category.id} draggableId={category._id || category.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onAdd(category.name, category.type)}
          className={`group relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer select-none transition-all duration-200 text-[13px] font-medium border ${snapshot.isDragging ? "scale-105 shadow-2xl z-50" : ""
            } ${isIncome
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
            }`}
        >
          {isIncome
            ? <Plus className="w-3.5 h-3.5 shrink-0" />
            : <Minus className="w-3.5 h-3.5 shrink-0" />
          }
          <span>{category.name}</span>
        </div>
      )}
    </Draggable>
  )
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TransactionRow({ tx, index, onDelete }) {
  const isIncome = tx.type === "income"
  const date = new Date(tx.createdAt)
  const isToday = date.toDateString() === new Date().toDateString()

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06] transition-all duration-150"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Icon */}
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${isIncome
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}>
        {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-zinc-200 truncate">{tx.merchant || tx.category}</span>
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.06]">
            {tx.category}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {tx.description && tx.description !== tx.category && (
            <span className="text-[11px] text-zinc-600 truncate">{tx.description}</span>
          )}
          <span className="text-[11px] text-zinc-700">
            {isToday ? "Today" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            {" · "}{date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className={`shrink-0 flex items-center gap-0.5 text-[14px] font-bold tabular-nums ${isIncome ? "text-emerald-400" : "text-rose-400"
        }`}>
        <span>{isIncome ? "+" : "−"}</span>
        <IndianRupee className="w-3.5 h-3.5" />
        <span>{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(tx._id || tx.id)}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TransactionsTab(props) {
  const {
    amount, setAmount, description, setDescription,
    categories = [], newCategory, setNewCategory,
    newCategoryType, setNewCategoryType,
    handleAddTransaction, handleAddCategory,
    filteredTransactions = [],
  } = props

  const [showAll, setShowAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")
  const [activeTab, setActiveTab] = useState("transactions")  // "transactions" | "add" | "categories"

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = filteredTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    return { income, expense, net: income - expense, count: filteredTransactions.length }
  }, [filteredTransactions])

  // ── Filter + search + sort ────────────────────────────────────────────────
  const displayTxs = useMemo(() => {
    let list = [...filteredTransactions]
    if (filterType !== "all") list = list.filter(t => t.type === filterType)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(t =>
        (t.category || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.merchant || "").toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      )
    }
    if (sortOrder === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (sortOrder === "oldest") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    if (sortOrder === "highest") list.sort((a, b) => b.amount - a.amount)
    if (sortOrder === "lowest") list.sort((a, b) => a.amount - b.amount)
    return list
  }, [filteredTransactions, filterType, searchQuery, sortOrder])

  const visibleCategories = showAll ? categories : categories.slice(0, 8)
  const incomeCategories = categories.filter(c => c.type === "income")
  const expenseCategories = categories.filter(c => c.type === "expense")

  return (
    <div className="flex flex-col gap-4">

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Income", value: stats.income, color: "text-emerald-400", borderColor: "border-emerald-500/20", bg: "bg-emerald-500/[0.04]", icon: TrendingUp },
          { label: "Total Expenses", value: stats.expense, color: "text-rose-400", borderColor: "border-rose-500/20", bg: "bg-rose-500/[0.04]", icon: TrendingDown },
          { label: "Net Flow", value: Math.abs(stats.net), color: stats.net >= 0 ? "text-indigo-400" : "text-amber-400", borderColor: "border-indigo-500/20", bg: "bg-indigo-500/[0.04]", icon: Zap, prefix: stats.net >= 0 ? "+" : "−" },
          { label: "Transactions", value: null, color: "text-zinc-300", borderColor: "border-white/10", bg: "bg-white/[0.03]", icon: ArrowUpDown, count: stats.count },
        ].map(({ label, value, color, borderColor, bg, icon: Icon, prefix, count }) => (
          <div key={label} className={`${bg} rounded-2xl p-3.5 border ${borderColor}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3 h-3 ${color}`} />
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{label}</p>
            </div>
            <p className={`font-bold text-sm ${color} flex items-center gap-0.5`}>
              {count !== undefined ? (
                <>{count} <span className="text-zinc-600 font-normal text-[11px] ml-1">entries</span></>
              ) : (
                <>{prefix && <span>{prefix}</span>}<IndianRupee className="w-3 h-3" />{Number(value).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tab selector ── */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        {[["transactions", "Transactions"], ["add", "Add Transaction"], ["categories", "Categories"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-medium transition-all duration-200 ${activeTab === id ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
          >{label}</button>
        ))}
      </div>

      {/* ── Add Transaction Panel ── */}
      {activeTab === "add" && (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 space-y-4">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">New Transaction</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-400 mb-1.5 block">Amount (₹)</Label>
              <Input
                type="number" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-10 text-sm"
                placeholder="0.00"
                onKeyDown={e => e.key === "Enter" && e.preventDefault()}
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400 mb-1.5 block">Description (optional)</Label>
              <Input
                type="text" value={description}
                onChange={e => setDescription(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-10 text-sm"
                placeholder="What was this for?"
              />
            </div>
          </div>

          {/* Category pills for quick add */}
          <div>
            <Label className="text-xs text-zinc-400 mb-2 block">Select Category to Log</Label>
            <Droppable droppableId="categories" direction="horizontal">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap gap-2">
                  {visibleCategories.map((cat, idx) => (
                    <CategoryPill key={cat._id || cat.id} category={cat} index={idx} onAdd={handleAddTransaction} />
                  ))}
                  {provided.placeholder}
                  {categories.length > 8 && (
                    <button onClick={() => setShowAll(!showAll)}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-500 text-[12px] hover:text-zinc-300 hover:bg-white/[0.07] transition-all">
                      {showAll ? "Show less" : `+${categories.length - 8} more`}
                    </button>
                  )}
                </div>
              )}
            </Droppable>
            {!amount && (
              <p className="text-[11px] text-zinc-700 mt-2">Enter an amount above, then click a category to log instantly.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Categories Manager ── */}
      {activeTab === "categories" && (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-5 space-y-4">
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">Manage Categories</p>

          {/* Existing categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[["income", "Income Categories", incomeCategories, "emerald"], ["expense", "Expense Categories", expenseCategories, "rose"]].map(([type, title, cats, clr]) => (
              <div key={type}>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-2">{title} ({cats.length})</p>
                <Droppable droppableId={`${type}-list`} direction="horizontal">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap gap-1.5 min-h-[40px]">
                      {cats.map((cat, idx) => (
                        <Draggable key={cat._id || cat.id} draggableId={cat._id || cat.id} index={idx}>
                          {(prov) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border cursor-grab ${type === "income"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                  : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                                }`}>
                              {cat.name}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {cats.length === 0 && <p className="text-[11px] text-zinc-700">None yet</p>}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>

          {/* Add new category */}
          <div className="pt-2 border-t border-white/[0.05]">
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-2">Add New Category</p>
            <div className="flex gap-2">
              <Input
                value={newCategory} onChange={e => setNewCategory(e.target.value)}
                className="flex-1 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-9 text-sm"
                placeholder="Category name..."
                onKeyDown={e => e.key === "Enter" && handleAddCategory()}
              />
              <Select value={newCategoryType} onValueChange={setNewCategoryType}>
                <SelectTrigger className="w-28 bg-white/[0.04] border-white/10 text-white rounded-xl h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#13131f] border-white/10 text-white rounded-xl">
                  <SelectItem value="expense" className="focus:bg-white/10 rounded-lg">Expense</SelectItem>
                  <SelectItem value="income" className="focus:bg-white/10 rounded-lg">Income</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddCategory}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 rounded-xl h-9 text-sm px-4 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                Add
              </Button>
            </div>
          </div>

          {/* Delete zone */}
          <Droppable droppableId="delete-zone">
            {(provided, snap) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                className={`flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-dashed transition-all duration-200 ${snap.isDraggingOver
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                    : "border-white/[0.08] text-zinc-700"
                  }`}>
                <Trash2 className="w-4 h-4" />
                <span className="text-[12px] font-medium">Drop category here to delete</span>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}

      {/* ── Transactions List ── */}
      {activeTab === "transactions" && (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          {/* Search + filter bar */}
          <div className="flex items-center gap-2 p-3 border-b border-white/[0.05]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-9 pr-4 h-8 text-[13px] text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex gap-1">
              {[["all", "All"], ["income", "In"], ["expense", "Out"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilterType(v)}
                  className={`px-2.5 h-8 rounded-lg text-[11px] font-medium transition-all ${filterType === v ? "bg-white/10 text-zinc-200" : "text-zinc-600 hover:text-zinc-400"
                    }`}>{l}</button>
              ))}
            </div>

            {/* Sort */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-28 bg-white/[0.04] border-white/[0.07] text-zinc-400 rounded-xl h-8 text-[11px]">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#13131f] border-white/10 text-white rounded-xl">
                <SelectItem value="newest" className="focus:bg-white/10 rounded-lg text-sm">Newest</SelectItem>
                <SelectItem value="oldest" className="focus:bg-white/10 rounded-lg text-sm">Oldest</SelectItem>
                <SelectItem value="highest" className="focus:bg-white/10 rounded-lg text-sm">Highest</SelectItem>
                <SelectItem value="lowest" className="focus:bg-white/10 rounded-lg text-sm">Lowest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          {(searchQuery || filterType !== "all") && (
            <div className="px-4 py-2 border-b border-white/[0.04]">
              <p className="text-[11px] text-zinc-600">
                {displayTxs.length} result{displayTxs.length !== 1 ? "s" : ""}
                {searchQuery && <> for "<span className="text-zinc-400">{searchQuery}</span>"</>}
              </p>
            </div>
          )}

          {/* Transaction rows */}
          <div className="divide-y divide-white/[0.03]">
            {displayTxs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-7 h-7 text-zinc-700 mx-auto mb-3" />
                <p className="text-[13px] text-zinc-600">No transactions found.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-[12px] text-indigo-400 hover:text-indigo-300 mt-1">Clear search</button>
                )}
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}>
                {displayTxs.map((tx, i) => (
                  <TransactionRow key={tx._id || tx.id || i} tx={tx} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {displayTxs.length > 0 && (
            <div className="px-4 py-3 border-t border-white/[0.05] flex items-center justify-between">
              <p className="text-[11px] text-zinc-700">{displayTxs.length} transactions shown</p>
              <a href="/transactions" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                View full history →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}