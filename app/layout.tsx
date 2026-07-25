import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { GetStartedRedirect } from "@/components/get-started-redirect";

export const metadata: Metadata = { title: "LeadDesk Mini | Turn interest into revenue", description: "A focused lead management platform." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <GetStartedRedirect />
          <Toaster theme="dark" richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
