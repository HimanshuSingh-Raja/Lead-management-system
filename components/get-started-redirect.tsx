"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/** Makes every existing "Get Started" CTA open sign-in or dashboard using Next.js routing. */
export function GetStartedRedirect() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const redirectToAuthOrDashboard = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>('a[href="#contact"], a[href="/login"]');
      if (link && link.textContent?.includes("Get Started")) {
        event.preventDefault();
        router.push(user ? "/admin" : "/login");
      }
    };

    document.addEventListener("click", redirectToAuthOrDashboard);
    return () => document.removeEventListener("click", redirectToAuthOrDashboard);
  }, [router, user]);

  return null;
}
