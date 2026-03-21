"use client"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { UploadCloud, CheckCircle, AlertCircle } from "lucide-react"

export default function CsvUploadTab({ onUploadSuccess }) {
  const { user } = useUser()
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState(null)
  
  const handleUpload = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id);
    
    try {
      const res = await fetch("/api/upload/csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        setResult({ type: "success", data });
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setResult({ type: "error", message: data.error || data.message || "Upload failed" });
      }
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-xl bg-white/5 shadow-lg relative overflow-hidden group">
      <div className="absolute inset-0 bg-teal-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
      
      <UploadCloud className="w-12 h-12 text-teal-400 mb-4 z-10" />
      <h3 className="text-xl font-bold text-white mb-2 z-10">Import Bank Statement</h3>
      <p className="text-white/60 mb-6 text-center max-w-md z-10">
        Upload your bank statement in CSV format. Our system will automatically categorize and securely hash your transactions to prevent duplicates.
      </p>
      
      <input 
        type="file" 
        accept=".csv,.xlsx" 
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full max-w-sm text-sm text-slate-300 z-10
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-medium
          file:bg-teal-500/20 file:text-teal-300
          hover:file:bg-teal-500/30 mb-6 cursor-pointer outline-none"
      />
      
      <button 
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="z-10 px-8 py-2.5 bg-gradient-to-r from-teal-400 to-teal-600 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/25 hover:-translate-y-0.5"
      >
        {isUploading ? "Processing securely..." : "Start Import"}
      </button>

      {result && result.type === "success" && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-3 w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-green-400 font-medium text-sm">Upload Successful!</p>
            {result.data.duplicate ? (
              <p className="text-white/70 text-xs mt-1">This exact file was already processed previously. No new transactions were added.</p>
            ) : (
              <p className="text-white/70 text-xs mt-1">Imported {result.data.processed} transactions. Skipped {result.data.duplicates} exact duplicates.</p>
            )}
          </div>
        </div>
      )}
      
      {result && result.type === "error" && (
        <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3 w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{result.message}</p>
        </div>
      )}
    </div>
  )
}
