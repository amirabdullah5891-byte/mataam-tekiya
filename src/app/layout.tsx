import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "مطعم التكية - أبو أمنة الشعبي",
  description: "نظام حسابات متكامل لإدارة مبيعات ومشتريات ومخزون مطعم التكية - أبو أمنة الشعبي، الخرطوم - الكلاكلة اللفة",
  keywords: ["مطعم", "تكية", "حسابات", "فواتير", "مبيعات", "مشتريات", "مخزون", "الخرطوم", "الكلاكلة"],
  authors: [{ name: "مطعم التكية" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
