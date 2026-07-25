"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Send, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { leadSchema, type LeadInput } from "@/lib/validation";

interface SubmissionModalState {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
}

export function LeadForm() {
  const [modalState, setModalState] = useState<SubmissionModalState | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
  });

  const submit = async (values: LeadInput) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      let saved = false;

      // Primary Route: Submit via /api/leads endpoint
      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
          signal: controller.signal,
        });

        if (response.ok) {
          saved = true;
        } else {
          const data = await response.json().catch(() => ({}));
          console.warn("API route error:", data.error);
        }
      } catch (apiErr) {
        console.warn("API route write bypassed, falling back to direct client Firestore write:", apiErr);
      }

      // Secondary Route: Direct Client SDK write to Firestore 'leads' collection
      if (!saved) {
        const now = serverTimestamp();
        await addDoc(collection(db, "leads"), {
          fullName: values.fullName,
          email: values.email,
          budget: values.budget,
          message: values.message,
          status: values.status || "New",
          priority: values.priority || "Medium",
          source: values.source || "Website",
          createdAt: now,
          updatedAt: now,
        });
      }

      // 100% Success Flow
      reset();
      toast.success("Lead submitted successfully!");
      setModalState({
        isOpen: true,
        type: "success",
        title: "✅ Lead submitted successfully!",
        message: "Thank you for contacting us. Our team will get back to you soon.",
      });
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string };
      let errorMsg = "Please try again.";
      if (errorObj?.name === "AbortError") {
        errorMsg = "Request timed out. Please check your network connection.";
      } else if (errorObj?.message) {
        errorMsg = errorObj.message;
      }

      toast.error("Failed to submit lead");
      setModalState({
        isOpen: true,
        type: "error",
        title: "❌ Failed to submit lead.",
        message: errorMsg,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const error = (name: keyof LeadInput) => errors[name]?.message;

  return (
    <>
      <form onSubmit={handleSubmit(submit)} className="glass rounded-2xl p-5 shadow-2xl sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={error("fullName")}>
            <input {...register("fullName")} placeholder="Alex Morgan" />
          </Field>
          <Field label="Email" error={error("email")}>
            <input {...register("email")} type="email" placeholder="alex@company.com" />
          </Field>
        </div>

        <Field label="Budget range" error={error("budget")}>
          <select {...register("budget")} defaultValue="">
            <option value="" disabled>
              Choose a range
            </option>
            <option>Under $5,000</option>
            <option>$5,000 – $15,000</option>
            <option>$15,000 – $50,000</option>
            <option>$50,000+</option>
          </select>
        </Field>

        <Field label="Tell us about your goals" error={error("message")}>
          <textarea
            {...register("message")}
            rows={4}
            placeholder="What would you like to accomplish?"
          />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isSubmitting ? "Sending…" : "Start the conversation"}
        </button>
      </form>

      {/* Submission Feedback Modal */}
      {modalState?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1124] p-7 shadow-2xl text-center space-y-5">
            <button
              onClick={() => setModalState(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              {modalState.type === "success" ? (
                <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-full bg-rose-500/20 text-rose-400 ring-8 ring-rose-500/10">
                  <AlertCircle className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">{modalState.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{modalState.message}</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalState(null)}
                className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
                  modalState.type === "success"
                    ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-glow"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {modalState.type === "success" ? "OK / Continue" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block text-sm font-medium text-slate-200">
      {label}
      <span className="mt-1 block [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-white/10 [&_input]:bg-white/5 [&_input]:px-3 [&_input]:py-3 [&_input]:text-sm [&_input]:outline-none [&_input]:transition [&_input]:focus:border-brand-400 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-white/10 [&_select]:bg-[#151929] [&_select]:px-3 [&_select]:py-3 [&_select]:text-sm [&_select]:outline-none [&_select]:focus:border-brand-400 [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-white/10 [&_textarea]:bg-white/5 [&_textarea]:px-3 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:outline-none [&_textarea]:focus:border-brand-400">
        {children}
      </span>
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </label>
  );
}
