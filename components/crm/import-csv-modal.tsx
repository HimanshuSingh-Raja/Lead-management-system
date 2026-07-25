"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { csvRowSchema } from "@/lib/validation";

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportCsvModal({ isOpen, onClose, onSuccess }: ImportCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [importReport, setImportReport] = useState<{
    total: number;
    successCount: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportReport(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    setImportReport(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length <= 1) {
        toast.error("CSV file is empty or missing headers");
        setBusy(false);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const rows = lines.slice(1);

      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const values = rows[i].split(",").map((v) => v.trim().replace(/"/g, ""));
        if (values.length < 2) continue;

        const rowData: Record<string, string> = {};
        headers.forEach((h, index) => {
          if (values[index] !== undefined) {
            if (h === "name" || h === "fullname" || h === "full name") rowData.fullName = values[index];
            else if (h === "email") rowData.email = values[index];
            else if (h === "budget") rowData.budget = values[index];
            else if (h === "message") rowData.message = values[index];
            else if (h === "company") rowData.company = values[index];
            else if (h === "phone") rowData.phone = values[index];
            else if (h === "status") rowData.status = values[index];
            else if (h === "priority") rowData.priority = values[index];
            else if (h === "source") rowData.source = values[index];
          }
        });

        if (!rowData.fullName) rowData.fullName = values[0] || "Imported Lead";
        if (!rowData.email) rowData.email = values[1] || "";
        if (!rowData.message) rowData.message = "Imported lead via CSV";
        if (!rowData.budget) rowData.budget = "Under $5,000";

        const parseResult = csvRowSchema.safeParse(rowData);

        if (parseResult.success) {
          try {
            await addDoc(collection(db, "leads"), {
              ...parseResult.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            successCount++;
          } catch {
            errors.push(`Row ${i + 2}: Firestore insertion error`);
          }
        } else {
          const firstErr = parseResult.error.errors[0]?.message || "Validation failed";
          errors.push(`Row ${i + 2} (${rowData.email || "No email"}): ${firstErr}`);
        }
      }

      setImportReport({
        total: rows.length,
        successCount,
        errors,
      });

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} leads!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error("No valid leads could be imported");
      }
    } catch (err) {
      console.error("CSV import error:", err);
      toast.error("Failed to parse CSV file");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1124] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Import Leads via CSV</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-xs text-slate-400">
            Upload a CSV file containing columns: <code className="text-brand-300">Name, Email, Budget, Message, Company, Phone, Status</code>.
          </p>

          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 p-6 cursor-pointer hover:border-brand-400/50 transition">
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-sm font-medium text-slate-200">
              {file ? file.name : "Choose CSV File or drag & drop"}
            </span>
            <span className="text-xs text-slate-500 mt-1">Supports .csv format</span>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>

          {importReport && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle className="h-4 w-4" /> Successfully imported {importReport.successCount} of {importReport.total} rows.
              </div>
              {importReport.errors.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-white/10 text-rose-300">
                  <span className="font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Skipped Rows ({importReport.errors.length}):
                  </span>
                  <ul className="max-h-24 overflow-y-auto list-disc pl-4 space-y-0.5">
                    {importReport.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10"
            >
              Close
            </button>
            <button
              disabled={!file || busy}
              onClick={handleImport}
              className="btn-primary px-5 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
              {busy ? "Processing..." : "Start Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
