import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";
import NavBar from "@/components/NavBar";
import InAppBrowserGuard from "@/components/InAppBrowserGuard";
import AutoLogout from "@/components/AutoLogout";

export const metadata: Metadata = {
  title: "Field-Master | 현장조사 실태관리 솔루션",
  description: "스마트 현장조사 및 실태확인 업무지원 시스템",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Field-Master | 현장조사 실태관리 솔루션",
    description: "스마트 현장조사 및 실태확인 업무지원 시스템",
    url: "https://www.kmaster.xyz",
    siteName: "Field-Master",
    images: [
      {
        url: "/opengraph-image.png?v=4",
        width: 1200,
        height: 630,
        alt: "Field-Master OG Image",
      },
    ],
    locale: "ko_KR",
    type: "website",
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
