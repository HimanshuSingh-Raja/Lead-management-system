"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#080b16] px-5 py-10 text-center">
      <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-rose-500/30 bg-[#0d1124] p-8 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">401 - Unauthorized Access</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          You do not have permission to view this protected resource. Please sign in with an authorized administrator account.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="btn-primary inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
