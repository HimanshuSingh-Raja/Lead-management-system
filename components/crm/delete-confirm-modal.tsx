"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import type { Lead } from "@/lib/types";

interface DeleteConfirmModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteConfirmModal({ lead, isOpen, onClose, onSuccess }: DeleteConfirmModalProps) {
  const [busy, setBusy] = useState(false);

  if (!isOpen || !lead) return null;

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, "leads", lead.id));
      toast.success(`Lead "${lead.fullName}" deleted successfully`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete lead document.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0d1124] p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Delete Lead</h3>
            <p className="text-xs text-rose-300">This action cannot be undone.</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-300">
          Are you sure you want to permanently delete the lead record for{" "}
          <strong className="text-white">{lead.fullName}</strong> ({lead.email})?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" /> : null}
            {busy ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
