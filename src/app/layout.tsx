import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "مطعم التكية - نظام الحسابات",
  description: "نظام حسابات متكامل لإدارة مبيعات ومشتريات ومخزون مطعم التكية - أبو أمنة الشعبي، الخرطوم - الكلاكلة اللفة",
  keywords: ["مطعم", "تكية", "حسابات", "فواتير", "مبيعات", "مشتريات", "مخزون", "الخرطوم", "الكلاكلة"],
  authors: [{ name: "مطعم التكية" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon-192.png",
    shortcut: "/favicon-32.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مطعم التكية",
  },
  applicationName: "مطعم التكية",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#d97706",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="مطعم التكية" />
        <meta name="application-name" content="مطعم التكية" />
      </head>
      <body
        className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
