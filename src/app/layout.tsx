/**
 * @file Root Layout
 * @description The root layout wraps every page in the application.
 * It provides global styles, fonts, metadata, and app-wide providers.
 *
 * In Next.js App Router, layouts are persistent — they don't re-render
 * when navigating between pages that share the same layout.
 */

import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Appointly",
    template: "%s | Appointly",
  },
  description:
    "Book appointments with local service providers. Manage your business, services, and schedule all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
