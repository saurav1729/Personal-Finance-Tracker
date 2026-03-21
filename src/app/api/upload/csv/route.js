// app/api/upload/csv/route.js
// Handles CSV uploads from: MoneyMap format, PhonePe, GPay, HDFC NetBanking,
// ICICI iMobile, Paytm, Kotak, SBI, generic UPI exports

import { NextResponse } from "next/server"
import dbConnect from "@/app/lib/db"
import Transaction from "@/app/models/Transaction"
import Category from "@/app/models/Category"

// ─── Category inference from description/merchant ────────────────────────────
function inferCategory(description, merchant, type) {
  const d = (description + " " + merchant).toLowerCase()

  if (type === "income") {
    if (/salary|payroll|wages|ctc/.test(d)) return "Salary"
    if (/freelance|invoice|client|project/.test(d)) return "Freelance"
    if (/bonus|incentive|reward/.test(d)) return "Bonus"
    if (/interest|dividend|return/.test(d)) return "Investment"
    if (/refund|cashback/.test(d)) return "Refund"
    return "Income"
  }

  if (/swiggy|zomato|food|biryani|pizza|burger|restaurant|cafe|eat|meal|lunch|dinner|breakfast|dine/.test(d)) return "Food"
  if (/milk|doodh|groceries?|vegetable|fruit|d.mart|big.?bazaar|reliance smart|more supermarket|zepto|blinkit|instamart/.test(d)) return "Groceries"
  if (/uber|ola|rapido|cab|auto|metro|bus|train|petrol|fuel|hp|indian oil|bharat petroleum/.test(d)) return "Transport"
  if (/netflix|spotify|amazon prime|hotstar|disney|youtube|jio cinema|subscription/.test(d)) return "Subscription"
  if (/electricity|bescom|water|bill|broadband|wifi|airtel|jio|bsnl|vodafone|vi|recharge/.test(d)) return "Utilities"
  if (/rent|landlord|house|flat|pg|accommodation/.test(d)) return "Rent"
  if (/amazon|flipkart|myntra|shopping|clothes|fashion|meesho/.test(d)) return "Shopping"
  if (/hospital|clinic|pharmacy|medical|doctor|apollo|manipal|health|medicine|chemist|gym|cult|fitness/.test(d)) return "Health"
  if (/movie|cinema|pvr|inox|game|entertainment|concert|event/.test(d)) return "Entertainment"
  if (/coffee|starbucks|chai|tea|bakery|snack|cafe/.test(d)) return "Dining"
  if (/transfer|sent|paid to|upi|neft|imps|rtgs/.test(d)) return "Transfer"
  if (/emi|loan|credit card|hdfc|icici|axis|sbi|kotak|bank/.test(d)) return "Finance"
  if (/school|college|tuition|course|education|udemy|coursera/.test(d)) return "Education"

  return type === "expense" ? "Others" : "Income"
}

// ─── Detect CSV format and normalize column names ────────────────────────────
function detectAndNormalize(headers) {
  const h = headers.map(s => s.toLowerCase().trim().replace(/["\s]/g, ""))

  // MoneyMap native format
  if (h.includes("amount") && h.includes("type")) {
    return {
      date: h.indexOf("date"),
      description: h.indexOf("description") !== -1 ? h.indexOf("description") : h.indexOf("merchant"),
      amount: h.indexOf("amount"),
      type: h.indexOf("type"),
      category: h.indexOf("category"),
      merchant: h.indexOf("merchant"),
      format: "native",
    }
  }

  // HDFC Bank statement format
  if (h.some(x => x.includes("withdrawal") || x.includes("depositamount") || x.includes("depositamt"))) {
    return {
      date: h.findIndex(x => x.includes("date") || x.includes("valuedate")),
      description: h.findIndex(x => x.includes("narration") || x.includes("description")),
      debit: h.findIndex(x => x.includes("withdrawal") || x.includes("debit")),
      credit: h.findIndex(x => x.includes("deposit") || x.includes("credit")),
      format: "hdfc",
    }
  }

  // ICICI Bank format
  if (h.some(x => x.includes("transaction remarks") || x.includes("debit(inr)"))) {
    return {
      date: h.findIndex(x => x.includes("date")),
      description: h.findIndex(x => x.includes("remarks") || x.includes("description") || x.includes("particulars")),
      debit: h.findIndex(x => x.includes("debit") || x.includes("dr")),
      credit: h.findIndex(x => x.includes("credit") || x.includes("cr")),
      format: "icici",
    }
  }

  // SBI format
  if (h.some(x => x.includes("txn date") || x.includes("debit") && x.includes("credit"))) {
    return {
      date: h.findIndex(x => x.includes("txndate") || x.includes("date")),
      description: h.findIndex(x => x.includes("description") || x.includes("particulars") || x.includes("remarks")),
      debit: h.findIndex(x => x.includes("debit") || x.includes("dr")),
      credit: h.findIndex(x => x.includes("credit") || x.includes("cr")),
      format: "sbi",
    }
  }

  // PhonePe / GPay / Paytm UPI export
  if (h.some(x => x.includes("transactiontype") || x.includes("transactionid") || x.includes("utr"))) {
    return {
      date: h.findIndex(x => x.includes("date") || x.includes("time")),
      description: h.findIndex(x => x.includes("merchantname") || x.includes("merchant") || x.includes("description") || x.includes("narration") || x.includes("name") || x.includes("to")),
      amount: h.findIndex(x => x.includes("amount") || x.includes("amount(inr)")),
      type: h.findIndex(x => x.includes("type") || x.includes("txntype") || x.includes("transactiontype")),
      format: "upi",
    }
  }

  // Generic / fallback — try to guess best columns
  return {
    date: h.findIndex(x => x.includes("date")),
    description: h.findIndex(x => x.includes("description") || x.includes("narration") || x.includes("particular") || x.includes("detail") || x.includes("merchant") || x.includes("name")),
    amount: h.findIndex(x => x.includes("amount")),
    debit: h.findIndex(x => x.includes("debit") || x.includes("dr") || x.includes("withdrawal")),
    credit: h.findIndex(x => x.includes("credit") || x.includes("cr") || x.includes("deposit")),
    type: h.findIndex(x => x.includes("type")),
    format: "generic",
  }
}

// ─── Parse amount string (handles ₹, commas, Indian number system) ────────────
function parseAmount(str) {
  if (!str) return 0
  // Handles quoted amounts like "1,299.00", ₹540, plain 420
  const cleaned = String(str).replace(/["'₹$\s,]/g, "")
  return parseFloat(cleaned) || 0
}

// ─── Parse date from various Indian bank formats ──────────────────────────────
function parseDate(str) {
  if (!str) return new Date()
  str = String(str).trim()

  // ISO: 2026-03-15 or 2026/03/15
  if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(str)) return new Date(str.replace(/\//g, "-"))

  // DD/MM/YYYY (HDFC, ICICI, SBI)
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`)

  // DD-Mon-YYYY (HDFC Net Banking): "15-Mar-2026"
  const dMonY = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/)
  if (dMonY) return new Date(`${dMonY[1]} ${dMonY[2]} ${dMonY[3]}`)

  // PhonePe / GPay format: "01 Mar 2026 09:15 AM"
  const ppFmt = str.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (ppFmt) {
    const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
    const m = months[ppFmt[2]]
    if (m !== undefined) return new Date(parseInt(ppFmt[3]), m, parseInt(ppFmt[1]))
  }

  // Fallback
  const d = new Date(str)
  return isNaN(d) ? new Date() : d
}

// ─── Determine transaction type from UPI/bank text ────────────────────────────
function determineType(typeStr, description, debitVal, creditVal) {
  if (creditVal > 0 && debitVal === 0) return "income"
  if (debitVal > 0 && creditVal === 0) return "expense"

  const t = (typeStr || "").toLowerCase()
  const d = (description || "").toLowerCase()

  if (/credit|cr|received|incoming|deposit|refund|salary|bonus/.test(t + " " + d)) return "income"
  if (/debit|dr|sent|paid|transfer|withdrawal|purchase/.test(t + " " + d)) return "expense"

  return "expense" // safe default
}

export async function POST(request) {
  try {
    await dbConnect()

    const formData = await request.formData()
    const file = formData.get("file")
    const userId = formData.get("userId")

    if (!file || !userId) {
      return NextResponse.json({ error: "file and userId are required" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file is empty or has no data rows" }, { status: 400 })
    }

    // Parse headers — handle quoted CSVs
    const parseRow = (line) => {
      const result = []
      let current = ""
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes }
        else if (ch === "," && !inQuotes) { result.push(current.trim()); current = "" }
        else { current += ch }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseRow(lines[0])
    const cols = detectAndNormalize(headers)

    const results = { imported: 0, skipped: 0, errors: [], rows: [] }
    const existingHashes = new Set(
      (await Transaction.find({ userId }, "hash")).map(t => t.hash)
    )

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const row = parseRow(line)
      if (row.length < 2) continue

      try {
        const rawDate = cols.date >= 0 ? row[cols.date] : ""
        const rawDesc = cols.description >= 0 ? row[cols.description] : ""
        const rawMerchant = cols.merchant >= 0 ? row[cols.merchant] : ""
        const rawCat = cols.category >= 0 ? row[cols.category] : ""

        let amount = 0
        let type = "expense"

        if (cols.format === "native") {
          amount = parseAmount(row[cols.amount])
          type = (row[cols.type] || "").toLowerCase().includes("income") ? "income" : "expense"
        } else if (cols.format === "upi") {
          amount = parseAmount(row[cols.amount])
          type = determineType(row[cols.type], rawDesc, 0, 0)
          // GPay/PhonePe: "Debit" = expense, "Credit" = income
          if (/debit/i.test(row[cols.type] || "")) type = "expense"
          if (/credit/i.test(row[cols.type] || "")) type = "income"
        } else {
          // Bank statement with separate debit/credit columns
          const debit = cols.debit >= 0 ? parseAmount(row[cols.debit]) : 0
          const credit = cols.credit >= 0 ? parseAmount(row[cols.credit]) : 0
          amount = credit > 0 ? credit : debit
          type = determineType("", rawDesc, debit, credit)
        }

        if (!amount || amount <= 0) { results.skipped++; continue }

        const date = parseDate(rawDate)
        const desc = rawDesc || rawMerchant || "Transaction"
        const merchant = rawMerchant || rawDesc || "Unknown"
        const category = rawCat || inferCategory(desc, merchant, type)

        // Deduplicate: hash = userId + date + amount + description
        const hash = `${userId}-${date.toISOString().split("T")[0]}-${amount}-${desc.slice(0, 20)}`
        if (existingHashes.has(hash)) { results.skipped++; continue }
        existingHashes.add(hash)

        // Upsert category
        let catDoc = await Category.findOne({ name: category, userId })
        if (!catDoc) catDoc = await Category.create({ name: category, type, userId })

        await Transaction.create({
          userId, amount, merchant, description: desc,
          category, categoryId: catDoc._id, type,
          createdAt: date,
          hash,
        })

        results.imported++
        results.rows.push({ date: date.toLocaleDateString("en-IN"), merchant, amount, type, category })

      } catch (rowErr) {
        results.errors.push(`Row ${i + 1}: ${rowErr.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.slice(0, 5),
      message: `Imported ${results.imported} transactions${results.skipped > 0 ? `, skipped ${results.skipped} duplicates` : ""}.`,
      preview: results.rows.slice(0, 5),
    })

  } catch (error) {
    console.error("[CSV Upload]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}