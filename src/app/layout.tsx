import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nausica della Valle | Ministero Apostolico",
  description: "Sito ufficiale del Ministero Apostolico di Nausica della Valle. Messaggi di fede, agenda eventi e risorse spirituali.",
  openGraph: {
    title: "Nausica della Valle | Ministero Apostolico",
    description: "Sito ufficiale del Ministero Apostolico di Nausica della Valle.",
    url: "https://nausicadellavalle.org",
    siteName: "Nausica della Valle",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nausica della Valle | Ministero Apostolico",
    description: "Sito ufficiale del Ministero Apostolico di Nausica della Valle.",
  },
};

import { Toaster } from "sonner";
import BrandingProvider from "@/components/BrandingProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* Restore cached brand colors before first paint to prevent flash of unstyled content.
            It must block rendering, which is exactly what no-sync-scripts warns against. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/branding-restore.js" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BrandingProvider />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
