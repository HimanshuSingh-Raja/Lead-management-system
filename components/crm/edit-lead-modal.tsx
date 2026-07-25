"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { Lead, LeadPriority, LeadSource, LeadStatus } from "@/lib/types";

interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const statuses: LeadStatus[] = ["New", "Contacted", "Closed", "Lost"];
const priorities: LeadPriority[] = ["Low", "Medium", "High", "Urgent"];
const sources: LeadSource[] = ["Website", "Referral", "LinkedIn", "Cold Call", "Organic", "Other"];

export function EditLeadModal({ lead, isOpen, onClose, onSuccess }: EditLeadModalProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [priority, setPriority] = useState<LeadPriority>("Medium");
  const [source, setSource] = useState<LeadSource>("Website");
  const [assignedTo, setAssignedTo] = useState("");
  const [address, setAddress] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (lead) {
      setFullName(lead.fullName || "");
      setEmail(lead.email || "");
      setPhone(lead.phone || "");
      setCompany(lead.company || "");
      setBudget(lead.budget || "Under $5,000");
      setMessage(lead.message || "");
      setStatus(lead.status || "New");
      setPriority(lead.priority || "Medium");
      setSource(lead.source || "Website");
      setAssignedTo(lead.assignedTo || "");
      setAddress(lead.address || "");
      setFollowUpDate(lead.followUpDate || "");
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      const leadRef = doc(db, "leads", lead.id);
      
      const updatedNotes = lead.notes ? [...lead.notes] : [];
      if (newNote.trim()) {
        updatedNotes.push({
          id: Math.random().toString(36).substring(2, 9),
          content: newNote.trim(),
          author: user?.email || "Admin",
          createdAt: new Date().toISOString(),
        });
      }

      await updateDoc(leadRef, {
        fullName,
        email,
        phone,
        company,
        budget,
        message,
        status,
        priority,
        source,
        assignedTo,
        address,
        followUpDate: followUpDate || null,
        notes: updatedNotes,
        updatedAt: serverTimestamp(),
      });

      toast.success("Lead updated successfully!");
      setNewNote("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error updating lead:", err);
      toast.error("Failed to update lead details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d1124] p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Edit Lead Details</h3>
            <p className="text-xs text-slate-400">ID: {lead.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">Full Name</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#151929] px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#151929] px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              >
                {priorities.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#151929] px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              >
                {sources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300">Budget Range</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#151929] px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              >
                <option>Under $5,000</option>
                <option>$5,000 – $15,000</option>
                <option>$15,000 – $50,000</option>
                <option>$50,000+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Assigned User Email</label>
              <input
                type="email"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="sales@company.com"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Inquiry Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400"
            />
          </div>

          {/* Add Note Section */}
          <div className="border-t border-white/10 pt-4">
            <label className="block text-xs font-medium text-slate-300">Add Internal Note</label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Discussed proposal details on call..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white outline-none focus:border-brand-400"
            />
          </div>

          {/* Existing Notes List */}
          {lead.notes && lead.notes.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-medium text-slate-400">Previous Notes ({lead.notes.length})</span>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {lead.notes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-white/5 p-2.5 text-xs text-slate-300">
                    <p>{note.content}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      By {note.author} on {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary px-5 py-2.5 text-sm font-medium disabled:opacity-70"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
              {busy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
