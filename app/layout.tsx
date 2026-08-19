import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";
import NavBar from "@/components/NavBar";
import InAppBrowserGuard from "@/components/InAppBrowserGuard";
import AutoLogout from "@/components/AutoLogout";

export const metadata: Metadata = {
  title: "FM(Field-Master)",
  description: "B2G / 공공기관 현장조사 전용 솔루션",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

import LayoutWrapper from "@/components/LayoutWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>
        <InAppBrowserGuard />
        <RegisterSW />
        <AutoLogout />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
