// app/api/upload/receipt/route.js
// Receives OCR text extracted in browser by Tesseract.js
// Uses Groq llama-3.3-70b to parse UPI screenshots + physical receipts
// Handles PhonePe, GPay, Paytm, BHIM, and generic receipts

import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import Transaction from "@/app/models/Transaction";
import Category from "@/app/models/Category";
import Budget from "@/app/models/Budget";

// ─── Groq LLM parsing ─────────────────────────────────────────────────────────
async function parseReceiptWithGroq(ocrText) {
  const today = new Date().toISOString().split("T")[0];

  const prompt = `You are an expert at extracting financial transactions from Indian UPI payment screenshots and physical receipts. The text below was extracted by OCR and may contain garbled characters, noise, and artifacts.

CRITICAL RULES FOR UPI SCREENSHOTS (PhonePe, GPay, Paytm, BHIM, etc.):
1. "Paid to [NAME]" or "Sent to [NAME]" = NAME is the RECIPIENT. Use as merchant. Type = "expense".
2. "Debited from [NAME]" or "Deducted from [NAME]" = NAME is YOUR account/name. IGNORE as merchant.
3. "Received from [NAME]" or "Money received" = Type = "income". NAME is the sender (use as merchant).
4. UPI IDs like "XXXXXX1338@pthdfc" or "user@upi" are NOT merchant names — ignore them.
5. "Transaction Successful" / "Payment Successful" = it IS an expense (money sent out).
6. Amount appears twice in UPI screenshots (once near recipient, once in debit section) → it is ONE transaction, not two.
7. Transaction IDs like "T2603201235..." and UTR numbers are reference numbers, not amounts.

CRITICAL RULES FOR PHYSICAL RECEIPTS:
1. Extract the TOTAL amount (bottom of receipt), not individual line items.
2. Store/restaurant name at the top = merchant.
3. If multiple items listed, create ONE transaction for the total.

DATE PARSING:
- "20 Mar 2026" → "2026-03-20"
- "12:35 pm on 20 Mar 2026" → date is "2026-03-20"
- If no date visible → use ${today}

CATEGORY SELECTION (choose best match):
Food, Groceries, Transport, Dining, Subscription, Shopping, Utilities, Health, Entertainment, Transfer, Salary, Freelance, Refund, Finance, Education, Others

Return ONLY a valid JSON array — no markdown, no explanation, no extra text.

Example for UPI transfer screenshot:
Input: "Transaction Successful 12:35 pm 20 Mar 2026 Paid to Avani Gupta ₹140 Debited from Saurav ₹140"
Output: [{"amount": 140, "merchant": "Avani Gupta", "category": "Transfer", "type": "expense", "date": "2026-03-20", "description": "UPI transfer to Avani Gupta"}]

Example for received money:
Input: "Money Received ₹500 from Rahul Sharma 15 Mar 2026"
Output: [{"amount": 500, "merchant": "Rahul Sharma", "category": "Transfer", "type": "income", "date": "2026-03-15", "description": "Received from Rahul Sharma"}]

Now extract from this OCR text:
---
${ocrText.slice(0, 4000)}
---

Return ONLY the JSON array:`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: "You are a precise financial data extractor. You return ONLY valid JSON arrays. Never add markdown, explanation, or commentary. If you cannot find any transaction, return an empty array [].",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = (data.choices?.[0]?.message?.content ?? "").trim();

  // Strip markdown fences
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // Try to extract JSON array anywhere in the response
    const match = clean.match(/\[[\s\S]*?\]/);
    if (match) {
      try { parsed = JSON.parse(match[0]); }
      catch { parsed = []; }
    } else {
      parsed = [];
    }
  }

  return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
}

// ─── Pre-process OCR text for better UPI detection ────────────────────────────
function preprocessOcrText(raw) {
  return raw
    // Fix common OCR artifacts on ₹ symbol
    .replace(/[%&§$€£¥~`|]/g, "₹")
    // Fix "R140" or "Rs140" → "₹140"
    .replace(/\bRs\.?\s*(\d)/g, "₹$1")
    .replace(/\bINR\s*(\d)/g, "₹$1")
    // Remove excessive whitespace
    .replace(/[ \t]{3,}/g, "  ")
    .trim();
}

// ─── Normalize a parsed transaction ──────────────────────────────────────────
function normalise(tx, userId) {
  const rawAmount = String(tx.amount ?? "").replace(/[₹Rs,\s]/g, "");
  const amount = parseFloat(rawAmount);
  if (!amount || isNaN(amount) || amount <= 0) return null;

  const type = String(tx.type || "expense").toLowerCase().trim() === "income" ? "income" : "expense";
  const merchant = String(tx.merchant || "Unknown").replace(/XXXXXX\d+@\w+/g, "").trim().slice(0, 80) || "Unknown";
  const category = String(tx.category || "Others").trim().slice(0, 50);
  const date = tx.date && /^\d{4}-\d{2}-\d{2}$/.test(String(tx.date))
    ? String(tx.date)
    : new Date().toISOString().split("T")[0];
  const description = String(tx.description || `${merchant} via receipt scan`).trim().slice(0, 120);
  const hash = `${userId}-${date}-${amount}-${merchant.toLowerCase().replace(/\s+/g, "").slice(0, 15)}`;

  return { amount, type, merchant, category, date, description, hash };
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { ocrText, userId, dryRun = true, transactions: confirmedTxs } = body;

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    // ── CONFIRMED IMPORT ───────────────────────────────────────────────────────
    if (!dryRun && confirmedTxs?.length > 0) {
      const results = { imported: 0, skipped: 0, transactions: [], newCategories: [], errors: [] };

      const existingHashes = new Set(
        (await Transaction.find({ userId }, "hash")).map(t => t.hash)
      );

      for (const tx of confirmedTxs) {
        const norm = normalise(tx, userId);
        if (!norm) { results.skipped++; continue; }
        if (existingHashes.has(norm.hash)) { results.skipped++; continue; }
        existingHashes.add(norm.hash);

        try {
          let catDoc = await Category.findOne({ name: { $regex: new RegExp(`^${norm.category}$`, "i") }, userId });
          if (!catDoc) {
            catDoc = await Category.create({ name: norm.category, type: norm.type, userId });
            results.newCategories.push(norm.category);
          }

          if (norm.type === "expense") {
            const budgets = await Budget.find({ userId, category: catDoc.name.trim() });
            await Promise.all(budgets.map(async b => {
              b.spent = (Number(b.spent || 0) + norm.amount).toString();
              await b.save();
            }));
          }

          const created = await Transaction.create({
            userId, amount: norm.amount, merchant: norm.merchant,
            description: norm.description, category: catDoc.name,
            categoryId: catDoc._id, type: norm.type,
            createdAt: new Date(norm.date), hash: norm.hash,
          });

          results.transactions.push({
            _id: created._id, merchant: norm.merchant, amount: norm.amount,
            category: catDoc.name, type: norm.type, date: norm.date,
          });
          results.imported++;
        } catch (err) {
          if (err.code === 11000) { results.skipped++; continue; }
          results.errors.push(`${norm.merchant}: ${err.message}`);
        }
      }

      return NextResponse.json({ success: true, ...results });
    }

    // ── DRY RUN (preview) ──────────────────────────────────────────────────────
    if (!ocrText?.trim()) {
      return NextResponse.json({ error: "ocrText is required" }, { status: 400 });
    }

    // Minimum length lowered to 8 chars — "₹140 UPI" is valid
    if (ocrText.trim().length < 8) {
      return NextResponse.json({ error: "OCR text too short to parse." }, { status: 400 });
    }

    const processedText = preprocessOcrText(ocrText);

    let parsed;
    try {
      parsed = await parseReceiptWithGroq(processedText);
    } catch (err) {
      console.error("[Receipt] Groq error:", err.message);
      return NextResponse.json({ error: `AI parsing failed: ${err.message}` }, { status: 500 });
    }

    if (!parsed.length) {
      return NextResponse.json({
        transactions: [],
        message: "No transaction could be detected. Make sure the screenshot clearly shows an amount and recipient.",
      });
    }

    const existingCats = new Set(
      (await Category.find({ userId }, "name")).map(c => c.name.toLowerCase())
    );
    const existingHashes = new Set(
      (await Transaction.find({ userId }, "hash")).map(t => t.hash)
    );

    const transactions = [];
    for (const tx of parsed) {
      const norm = normalise(tx, userId);
      if (!norm) continue;
      transactions.push({
        ...norm,
        isNewCategory: !existingCats.has(norm.category.toLowerCase()),
        isDuplicate: existingHashes.has(norm.hash),
      });
    }

    const fresh = transactions.filter(t => !t.isDuplicate);

    if (!fresh.length && transactions.length > 0) {
      return NextResponse.json({
        transactions: [], allDuplicates: true,
        message: "All detected transactions already exist in your ledger."
      });
    }

    return NextResponse.json({
      success: true, transactions: fresh,
      duplicatesSkipped: transactions.length - fresh.length,
    });

  } catch (error) {
    console.error("[Receipt Upload]", error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}