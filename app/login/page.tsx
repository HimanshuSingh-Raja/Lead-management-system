"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
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

function generateRandomCaptcha(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Typing CAPTCHA State
  const [captchaCode, setCaptchaCode] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(generateRandomCaptcha());
    setUserCaptchaInput("");
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

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

    // Verify Typing CAPTCHA Code
    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage("Incorrect CAPTCHA code. Please type the exact 6 characters shown.");
      refreshCaptcha();
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

      if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found") {
        msg = "Invalid email or password. Please try again.";
      } else if (errorCode === "auth/too-many-requests") {
        msg = "Access temporarily disabled due to too many failed attempts. Try again later.";
      } else if (errorObj?.message) {
        msg = errorObj.message;
      }

      setErrorMessage(msg);
      toast.error(msg);
      refreshCaptcha();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080b16] text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      <div className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[140px]" />

        <header className="container-page flex items-center justify-between py-6">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to website
          </Link>
        </header>

        <section className="container-page grid min-h-[calc(100vh-100px)] items-center py-10 lg:grid-cols-[1fr_460px] lg:gap-16">
          {/* Left Column Info */}
          <div className="hidden lg:block space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-medium text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> Secure Admin Workspace
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white lg:text-5xl">
              Welcome back to your <br />
              <span className="bg-gradient-to-r from-brand-400 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                LeadDesk Portal
              </span>
            </h1>
            <p className="max-w-md text-base text-slate-400 leading-relaxed">
              Log in to manage inbound inquiries, update lead pipeline stages, and track overall business growth.
            </p>

            <ul className="space-y-3 pt-2">
              {benefits.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="grid h-5 w-5 place-items-center rounded-full bg-brand-500/20 text-brand-300">
                    <Check className="h-3 w-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column Form */}
          <div className="glass mx-auto w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-400/20">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Sign in to Admin</h2>
                <p className="text-xs text-slate-400">Enter your credentials & CAPTCHA to continue</p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300 leading-relaxed">
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
                  placeholder="admin@leaddesk.com"
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

              {/* Interactive Typing CAPTCHA Verification */}
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Security CAPTCHA
                  </label>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 transition"
                    title="Generate new CAPTCHA code"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>

                {/* Stylized CAPTCHA Code Box */}
                <div className="relative flex items-center justify-center rounded-xl border border-brand-400/30 bg-[#060814] py-3.5 px-4 select-none overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:8px_8px] opacity-20" />
                  <span className="font-mono text-2xl font-bold tracking-[0.35em] text-brand-300 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">
                    {captchaCode}
                  </span>
                </div>

                <input
                  required
                  type="text"
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value)}
                  placeholder="Type the 6-character code above"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-brand-400 focus:bg-white/[.07]"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Signing you in…" : "Sign in securely"}
              </button>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-slate-500">
              Protected with secure Firebase authentication & typing CAPTCHA.
            </p>
            <p className="mt-3 text-center text-xs text-slate-500">
              Built for{" "}
              <a
                className="transition hover:text-slate-300 underline underline-offset-4"
                href="https://digitalheroesco.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Digital Heroes Training Task
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
