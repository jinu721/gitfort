import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GitHub Control Center",
  description: "Personal GitHub Control Center - Advanced monitoring, analytics, and security scanning for your GitHub repositories",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}