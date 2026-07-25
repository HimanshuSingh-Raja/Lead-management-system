"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/ui";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

const benefits = [
  "Keep every opportunity in one place",
  "See exactly where every lead stands",
  "Make fast, confident follow-ups",
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/admin");
    }
  }, [user, authLoading, router]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setBusy(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const idToken = await userCred.user.getIdToken();
      
      // Set HTTP-only session cookie for server middleware route protection
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      toast.success("Successfully logged in!");
      router.replace("/admin");
    } catch (err: unknown) {
      let msg = "We couldn’t sign you in. Check your email and password.";
      const errorObj = err as { code?: string; message?: string };
      const errorCode = errorObj?.code || "";

      if (
        errorCode === "auth/invalid-credential" ||
        errorCode === "auth/wrong-password" ||
        errorCode === "auth/user-not-found"
      ) {
        msg = "Invalid email or password. Please check your credentials.";
      } else if (errorCode === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (errorCode === "auth/too-many-requests") {
        msg = "Too many failed login attempts. Please try again later.";
      } else if (errorCode === "auth/user-disabled") {
        msg = "This user account has been disabled.";
      } else if (errorObj?.message) {
        msg = errorObj.message;
      }

      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080b16]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
          <p className="text-sm font-medium">Checking authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b16] px-5 py-5 sm:p-8">
      <div className="absolute left-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-brand-500/20 blur-[120px]" />
      <div className="absolute bottom-[-18rem] right-[-14rem] h-[38rem] w-[38rem] rounded-full bg-fuchsia-500/15 blur-[140px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl lg:grid-cols-[.95fr_1.05fr] sm:min-h-[calc(100vh-4rem)]">
        <section className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-transparent to-fuchsia-500/15" />
          <div className="relative z-10 w-fit">
            <Logo />
          </div>

          <div className="relative z-10 my-auto max-w-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> Your pipeline, in focus
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white">
              More clarity for every next move.
            </h1>
            <p className="mt-4 leading-7 text-slate-300">
              Return to the workspace that keeps your conversations moving forward.
            </p>
            <ul className="mt-9 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-400/15 text-brand-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} LeadDesk Mini</p>
        </section>

        <section className="flex min-h-full flex-col p-6 sm:p-10 lg:p-14">
          <div className="flex items-center justify-between lg:hidden">
            <div>
              <Logo />
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 lg:py-0">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/20">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <p className="mt-7 text-sm font-medium text-brand-300">WELCOME BACK</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Sign in to LeadDesk</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enter your credentials to manage your lead pipeline.
            </p>

            {errorMessage && (
              <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            <form onSubmit={login} className="mt-6 space-y-5">
              <label className="block text-sm font-medium text-slate-200">
                Email address
                <input
                  required
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:bg-white/[.07] focus:ring-4 focus:ring-brand-500/10"
                />
              </label>
              <label className="block text-sm font-medium text-slate-200">
                Password
                <span className="relative mt-2 block">
                  <input
                    required
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:bg-white/[.07] focus:ring-4 focus:ring-brand-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 transition hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </span>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {busy ? "Signing you in…" : "Sign in securely"}
              </button>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-slate-500">
              Protected with secure Firebase authentication. Contact your team administrator if you need access.
            </p>
            <p className="mt-3 text-center text-xs text-slate-500">
              Built for <a className="transition hover:text-slate-300 underline underline-offset-4" href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">Digital Heroes Training Task</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
