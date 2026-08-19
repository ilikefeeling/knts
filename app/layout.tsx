import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";
import NavBar from "@/components/NavBar";
import InAppBrowserGuard from "@/components/InAppBrowserGuard";
import AutoLogout from "@/components/AutoLogout";

export const metadata: Metadata = {
  title: "국세청 현장 확인원",
  description: "국세청 현장조사 및 실태확인 시스템",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "국세청 현장 확인원",
    description: "국세청 현장조사 및 실태확인 시스템",
    url: "https://www.kmaster.xyz",
    siteName: "국세청 현장 확인원",
    images: [
      {
        url: "/opengraph-image.png?v=3",
        width: 1200,
        height: 630,
        alt: "국세청 실태확인원 OG Image",
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
