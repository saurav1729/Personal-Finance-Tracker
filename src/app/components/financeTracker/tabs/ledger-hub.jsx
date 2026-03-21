"use client"

import TransactionsTab from "./transaction-tab"
import CsvUploadTab from "./csv-upload"
import ReceiptUploadTab from "./receipt-upload"
import { UploadCloud, FileText, Sparkles, Brain } from "lucide-react"

export default function LedgerHub(props) {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">

      {/* Agent hint banner */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/15">
        <Brain className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-[12px] text-zinc-400">
          The <span className="text-emerald-400 font-medium">Ledger Manager</span> agent can log transactions for you automatically — just say
          {" "}<span className="text-zinc-300 font-medium">"I spent ₹500 on groceries"</span> in the Intelligence Agent tab.
        </p>
      </div>

      {/* ── Data Ingestion ── */}
      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
        <div className="absolute inset-0 bg-blue-500/5 blur-xl group-hover:blur-2xl transition-all duration-500 opacity-40 rounded-3xl pointer-events-none" />
        <div className="relative bg-gradient-to-br from-[#0a0a0f]/90 to-[#12121e]/90 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] border border-white/[0.05]">

          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <UploadCloud className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Data Ingestion</p>
                <p className="text-[11px] text-zinc-600">Upload CSV bank statements or scan receipts</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-600">
              <Sparkles className="w-3 h-3 text-zinc-700" />
              AI-powered parsing
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CsvUploadTab onUploadSuccess={props.fetchTransactions} />
            <ReceiptUploadTab onUploadSuccess={props.fetchTransactions} />
          </div>
        </div>
      </div>

      {/* ── Transactions Ledger ── */}
      <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent">
        <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover:blur-2xl transition-all duration-500 opacity-40 rounded-3xl pointer-events-none" />
        <div className="relative bg-gradient-to-br from-[#0a0a0f]/90 to-[#12121e]/90 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] border border-white/[0.05]">

          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Transaction Ledger</p>
                <p className="text-[11px] text-zinc-600">Add, search, and manage all your transactions</p>
              </div>
            </div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest">
              {props.filteredTransactions?.length || 0} entries
            </div>
          </div>

          <div className="p-5">
            <TransactionsTab {...props} />
          </div>
        </div>
      </div>

    </div>
  )
}