"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./ui";
import { useAuth } from "@/lib/auth-context";

const links = ["Features", "Services", "Why us", "Testimonials", "FAQ"];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      router.push("/admin");
    } else {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#080b16]/75 backdrop-blur-xl">
      <div className="container-page flex h-18 items-center justify-between py-3">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((x) => (
            <a
              key={x}
              href={`#${x.toLowerCase().replace(" ", "-")}`}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              {x}
            </a>
          ))}
        </nav>
        <button onClick={handleGetStarted} className="btn-primary hidden md:inline-flex">
          {user ? "Dashboard" : "Get Started"}
        </button>
        <button aria-label="Toggle menu" onClick={() => setOpen(!open)} className="md:hidden">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="container-page border-t border-white/5 py-4 md:hidden">
          {links.map((x) => (
            <a
              onClick={() => setOpen(false)}
              key={x}
              href={`#${x.toLowerCase().replace(" ", "-")}`}
              className="block py-3 text-slate-300"
            >
              {x}
            </a>
          ))}
          <button
            onClick={(e) => {
              setOpen(false);
              handleGetStarted(e);
            }}
            className="btn-primary mt-2 w-full"
          >
            {user ? "Dashboard" : "Get Started"}
          </button>
        </div>
      )}
    </header>
  );
}
