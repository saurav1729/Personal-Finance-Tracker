"use client"
import { useState, useRef, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Camera, CheckCircle, AlertCircle, Loader2, X,
  FileText, Zap, RotateCcw, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, IndianRupee, Sparkles,
} from "lucide-react"

// ─── Step bar ─────────────────────────────────────────────────────────────────
const STEPS = ["Upload", "OCR Scan", "AI Parse", "Review", "Done"]

function StepBar({ current }) {
  return (
    <div className="flex items-center w-full mb-5">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300"
              style={{
                background: i < current ? "#10b981" : i === current ? "#818cf8" : "rgba(255,255,255,0.06)",
                color: i < current ? "#fff" : i === current ? "#fff" : "rgba(113,113,122,0.4)",
                border: `2px solid ${i === current ? "#818cf8" : "transparent"}`,
                boxShadow: i === current ? "0 0 10px rgba(129,140,248,0.35)" : "none",
              }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 9, color: i <= current ? "#818cf8" : "rgba(113,113,122,0.4)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px mx-1 mb-4"
              style={{ background: i < current ? "#10b981" : "rgba(255,255,255,0.06)", transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Transaction preview card ─────────────────────────────────────────────────
function TxCard({ tx, onRemove, index }) {
  const isIncome = tx.type === "income"
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl group transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isIncome ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)" }}>
        {isIncome
          ? <TrendingUp style={{ width: 13, height: 13, color: "#10b981" }} />
          : <TrendingDown style={{ width: 13, height: 13, color: "#f43f5e" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#e4e4e7" }}>{tx.merchant}</span>
          <span style={{ fontSize: 9.5, color: "rgba(113,113,122,0.7)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 999, padding: "1px 6px" }}>
            {tx.category}
          </span>
          {tx.isNewCategory && (
            <span style={{ fontSize: 9, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 999, padding: "1px 6px" }}>
              new
            </span>
          )}
        </div>
        <span style={{ fontSize: 10.5, color: "rgba(113,113,122,0.45)" }}>{tx.date} · {tx.description}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-0.5 tabular-nums"
          style={{ fontSize: 14, fontWeight: 700, color: isIncome ? "#10b981" : "#f43f5e" }}>
          {isIncome ? "+" : "−"}<IndianRupee style={{ width: 12, height: 12 }} />{Number(tx.amount).toLocaleString("en-IN")}
        </span>
        <button onClick={() => onRemove(index)}
          className="opacity-0 group-hover:opacity-100 transition-all w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ color: "rgba(113,113,122,0.5)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f43f5e"; e.currentTarget.style.background = "rgba(244,63,94,0.1)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(113,113,122,0.5)"; e.currentTarget.style.background = "transparent" }}>
          <X style={{ width: 11, height: 11 }} />
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReceiptUploadTab({ onUploadSuccess }) {
  const { user } = useUser()
  const fileRef = useRef()

  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [ocrText, setOcrText] = useState("")
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrConf, setOcrConf] = useState(null)
  const [showRaw, setShowRaw] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [error, setError] = useState("")

  const reset = () => {
    setStep(0); setFile(null); setPreviewUrl(null)
    setOcrText(""); setOcrProgress(0); setOcrConf(null)
    setTransactions([]); setImportResult(null); setError(""); setShowRaw(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleFile = useCallback((f) => {
    if (!f) return
    if (!f.type.startsWith("image/")) { setError("Please upload a JPG, PNG, or WebP image."); return }
    setError(""); setFile(f); setPreviewUrl(URL.createObjectURL(f)); setStep(0)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  // ── Step 1: Tesseract OCR in browser ──────────────────────────────────────
  const runOCR = async () => {
    if (!file || !user) return
    setStep(1); setError(""); setOcrProgress(0)

    try {
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng", 1, {
        logger: m => {
          if (m.status === "recognizing text")
            setOcrProgress(Math.round(m.progress * 100))
        },
      })

      const { data } = await worker.recognize(file)
      await worker.terminate()

      const text = data.text?.trim() ?? ""
      const conf = Math.round(data.confidence ?? 0)

      console.log("[Tesseract] Confidence:", conf, "Text length:", text.length)
      console.log("[Tesseract] Raw text:\n", text)

      // ✅ Bug fix: lowered from conf < 10 to conf < 5
      // PhonePe screenshots with white-on-green headers still extract usable text
      // even at low confidence scores (30-50 range)
      if (!text || conf < 5) {
        setError("Could not read any text from this image. Try a higher resolution screenshot or ensure the screen is fully visible.")
        setStep(0)
        return
      }

      // ✅ Bug fix: removed length < 10 check — "₹140 Avani" is 10 chars and valid
      setOcrText(text)
      setOcrConf(conf)
      setOcrProgress(100)

      // Proceed to AI parsing
      await parseWithAI(text)

    } catch (err) {
      console.error("[Tesseract]", err)
      setError(`OCR scan failed: ${err.message}`)
      setStep(0)
    }
  }

  // ── Step 2: Send OCR text to Groq via backend ──────────────────────────────
  const parseWithAI = async (text) => {
    setStep(2)
    try {
      const res = await fetch("/api/upload/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: text, userId: user.id, dryRun: true }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "AI failed to parse the receipt.")
        setStep(1)
        return
      }

      if (data.allDuplicates) {
        setError("All transactions in this receipt already exist in your ledger.")
        setStep(1)
        return
      }

      if (!data.transactions?.length) {
        setError(
          `No transaction detected.\n\nOCR extracted ${text.length} characters (confidence: ${ocrConf ?? "?"}%).\n\nTips:\n• Make sure the amount (₹) is visible\n• Try a clearer/brighter screenshot\n• Ensure "Paid to" or "Transaction Successful" is in the image`
        )
        setStep(1)
        return
      }

      setTransactions(data.transactions)
      setStep(3)

    } catch (err) {
      setError(`Parse error: ${err.message}`)
      setStep(1)
    }
  }

  // ── Step 3: Confirm and save ───────────────────────────────────────────────
  const confirmImport = async () => {
    if (!transactions.length) return
    setImporting(true); setError("")
    try {
      const res = await fetch("/api/upload/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText, userId: user.id, dryRun: false, transactions }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Import failed."); return }
      setImportResult(data); setStep(4)
      if (onUploadSuccess) setTimeout(onUploadSuccess, 300)
    } catch (err) { setError(err.message) }
    finally { setImporting(false) }
  }

  const removeTransaction = idx => setTransactions(prev => prev.filter((_, i) => i !== idx))

  return (
    <div className="flex flex-col gap-4">
      <StepBar current={step} />

      {/* ── Step 0: Upload ── */}
      {step === 0 && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)} onDrop={onDrop}
            onClick={() => !file && fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-2xl cursor-pointer transition-all duration-200"
            style={{
              border: `2px dashed ${dragging ? "rgba(129,140,248,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: dragging ? "rgba(129,140,248,0.05)" : "rgba(255,255,255,0.02)",
            }}>
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="max-h-44 max-w-full rounded-xl object-contain"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                <button onClick={e => { e.stopPropagation(); reset() }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "#f43f5e", border: "2px solid #09090b" }}>
                  <X style={{ width: 10, height: 10, color: "#fff" }} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}>
                  <Camera style={{ width: 20, height: 20, color: "#818cf8" }} />
                </div>
                <div className="text-center">
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(228,228,231,0.8)", marginBottom: 3 }}>
                    Drop UPI screenshot or receipt
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(113,113,122,0.55)" }}>
                    PhonePe · GPay · Paytm · Physical receipts
                  </p>
                </div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            className="hidden" onChange={e => handleFile(e.target.files[0])} />

          {file && (
            <button onClick={runOCR}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", boxShadow: "0 0 20px rgba(99,102,241,0.2)" }}>
              <Zap style={{ width: 14, height: 14 }} />
              Scan with OCR + Groq AI
            </button>
          )}
          <p style={{ fontSize: 9.5, color: "rgba(113,113,122,0.35)", textAlign: "center" }}>
            Tesseract runs in your browser — image stays on your device
          </p>
        </>
      )}

      {/* ── Step 1: OCR scanning ── */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-4 py-5">
          <div className="relative w-14 h-14">
            <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle cx="28" cy="28" r="22" fill="none" stroke="#818cf8" strokeWidth="4"
                strokeDasharray={`${(ocrProgress / 100) * 138} 138`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.2s ease" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8" }}>{ocrProgress}%</span>
            </div>
          </div>
          <div className="text-center">
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(228,228,231,0.8)" }}>Reading text from image…</p>
            <p style={{ fontSize: 11, color: "rgba(113,113,122,0.5)", marginTop: 2 }}>
              Tesseract.js OCR — image never leaves your browser
            </p>
          </div>
          {previewUrl && (
            <img src={previewUrl} alt="Scanning" className="max-h-28 rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.08)", opacity: 0.5 }} />
          )}
        </div>
      )}

      {/* ── Step 2: AI parsing ── */}
      {step === 2 && (
        <div className="flex flex-col items-center gap-4 py-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Sparkles style={{ width: 20, height: 20, color: "#f59e0b", animation: "pulse 1.2s ease-in-out infinite" }} />
          </div>
          <div className="text-center">
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(228,228,231,0.8)" }}>Groq AI analysing receipt…</p>
            <p style={{ fontSize: 11, color: "rgba(113,113,122,0.5)", marginTop: 2 }}>
              Extracting merchant, amount, date, and category
            </p>
          </div>
          {ocrConf !== null && (
            <span style={{
              fontSize: 10, fontWeight: 600, borderRadius: 999, padding: "3px 10px",
              color: ocrConf > 60 ? "#10b981" : ocrConf > 30 ? "#fbbf24" : "#f87171",
              background: ocrConf > 60 ? "rgba(16,185,129,0.08)" : ocrConf > 30 ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)",
              border: `1px solid ${ocrConf > 60 ? "rgba(16,185,129,0.2)" : ocrConf > 30 ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)"}`,
            }}>
              OCR confidence: {ocrConf}%
            </span>
          )}
        </div>
      )}

      {/* ── Step 3: Review transactions ── */}
      {step === 3 && transactions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(228,228,231,0.8)" }}>
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} found
              </p>
              <p style={{ fontSize: 10.5, color: "rgba(113,113,122,0.5)" }}>Remove any incorrect ones, then import</p>
            </div>
            {ocrConf !== null && (
              <span style={{
                fontSize: 10, fontWeight: 600, borderRadius: 999, padding: "2px 8px",
                color: ocrConf > 60 ? "#10b981" : "#fbbf24",
                background: ocrConf > 60 ? "rgba(16,185,129,0.08)" : "rgba(251,191,36,0.08)",
                border: `1px solid ${ocrConf > 60 ? "rgba(16,185,129,0.2)" : "rgba(251,191,36,0.2)"}`,
              }}>OCR {ocrConf}%</span>
            )}
          </div>

          {/* Raw OCR toggle */}
          <button onClick={() => setShowRaw(v => !v)}
            className="flex items-center gap-1.5 text-left"
            style={{ fontSize: 10.5, color: "rgba(113,113,122,0.5)" }}>
            <FileText style={{ width: 10, height: 10 }} />
            {showRaw ? "Hide" : "Show"} raw OCR text
            {showRaw ? <ChevronUp style={{ width: 10, height: 10 }} /> : <ChevronDown style={{ width: 10, height: 10 }} />}
          </button>
          {showRaw && (
            <pre className="w-full p-3 rounded-xl overflow-auto max-h-28"
              style={{ fontSize: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(161,161,170,0.6)", fontFamily: "monospace", whiteSpace: "pre-wrap", scrollbarWidth: "none" }}>
              {ocrText}
            </pre>
          )}

          {/* Transaction cards */}
          <div className="space-y-2 max-h-52 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {transactions.map((tx, i) => (
              <TxCard key={i} tx={tx} index={i} onRemove={removeTransaction} />
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-1 pt-1"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 11, color: "rgba(113,113,122,0.5)" }}>Expense total</span>
            <span className="flex items-center gap-0.5"
              style={{ fontSize: 13, fontWeight: 700, color: "#f43f5e" }}>
              <IndianRupee style={{ width: 11, height: 11 }} />
              {transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0).toLocaleString("en-IN")}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={reset}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(161,161,170,0.7)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
              <RotateCcw style={{ width: 13, height: 13 }} />Retry
            </button>
            <button onClick={confirmImport} disabled={importing || !transactions.length}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
              style={{ background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", opacity: importing ? 0.7 : 1 }}>
              {importing
                ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                : <CheckCircle style={{ width: 13, height: 13 }} />}
              {importing ? "Importing…" : `Import ${transactions.length}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 4 && importResult && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <CheckCircle style={{ width: 16, height: 16, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#34d399", marginBottom: 3 }}>
                {importResult.imported} transaction{importResult.imported !== 1 ? "s" : ""} imported
              </p>
              {importResult.newCategories?.length > 0 && (
                <p style={{ fontSize: 11, color: "rgba(52,211,153,0.7)" }}>
                  New categories: {importResult.newCategories.join(", ")}
                </p>
              )}
              {importResult.skipped > 0 && (
                <p style={{ fontSize: 11, color: "rgba(251,191,36,0.7)", marginTop: 2 }}>
                  {importResult.skipped} duplicate{importResult.skipped !== 1 ? "s" : ""} skipped
                </p>
              )}
            </div>
          </div>
          {importResult.transactions?.map((tx, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7" }}>{tx.merchant}</span>
                <span style={{ fontSize: 10, color: "rgba(113,113,122,0.5)", marginLeft: 6 }}>{tx.category}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: tx.type === "income" ? "#10b981" : "#f43f5e" }}>
                {tx.type === "income" ? "+" : "−"}₹{Number(tx.amount).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
          <button onClick={reset}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(161,161,170,0.7)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
            Scan another
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl"
          style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
          <AlertCircle style={{ width: 14, height: 14, color: "#f43f5e", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 11.5, color: "#f87171", whiteSpace: "pre-wrap" }}>{error}</p>
            <button onClick={() => setError("")} style={{ fontSize: 10.5, color: "#818cf8", marginTop: 4 }}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  )
}