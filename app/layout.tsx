import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Field-Master (knts)",
  description: "국세외수입 체납관리단 실태확인원 업무 관리 도구",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <RegisterSW />
        <div className="app-container">
          <NavBar />
          {children}
        </div>
      </body>
    </html>
  );
}

