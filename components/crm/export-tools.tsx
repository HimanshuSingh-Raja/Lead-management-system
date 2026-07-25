"use client";

import { Download, FileJson, Printer } from "lucide-react";
import { toast } from "sonner";
import type { Lead } from "@/lib/types";

interface ExportToolsProps {
  leads: Lead[];
}

export function ExportTools({ leads }: ExportToolsProps) {
  const exportCSV = () => {
    if (!leads.length) {
      toast.error("No leads available to export");
      return;
    }

    const headers = ["ID", "Full Name", "Email", "Phone", "Company", "Budget", "Status", "Priority", "Source", "Message", "Created At"];
    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone || ""}"`,
      `"${(l.company || "").replace(/"/g, '""')}"`,
      `"${l.budget}"`,
      `"${l.status}"`,
      `"${l.priority || "Medium"}"`,
      `"${l.source || "Website"}"`,
      `"${(l.message || "").replace(/"/g, '""')}"`,
      `"${l.createdAt ? (l.createdAt as { toDate?: () => Date }).toDate ? (l.createdAt as { toDate: () => Date }).toDate().toLocaleString() : new Date().toLocaleString() : ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leaddesk_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded");
  };

  const exportJSON = () => {
    if (!leads.length) {
      toast.error("No leads available to export");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `leaddesk_leads_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("JSON data export downloaded");
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
        title="Export to CSV file"
      >
        <Download className="h-3.5 w-3.5 text-emerald-400" /> Export CSV
      </button>
      <button
        onClick={exportJSON}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
        title="Export to JSON format"
      >
        <FileJson className="h-3.5 w-3.5 text-amber-400" /> Export JSON
      </button>
      <button
        onClick={printReport}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
        title="Print pipeline report"
      >
        <Printer className="h-3.5 w-3.5 text-sky-400" /> Print Report
      </button>
    </div>
  );
}
