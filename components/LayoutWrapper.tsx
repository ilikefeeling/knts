"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/admin");
  const isLoginPath = pathname?.startsWith("/login");

  const isHomePath = pathname === "/";

  if (isAdminPath || isLoginPath || isHomePath) {
    // 관리자 페이지, 로그인 페이지, 랜딩 페이지는 네비바(상단 바) 없이 전체 너비 사용
    return (
      <div className={isAdminPath ? "admin-wrapper" : ""} style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
        {children}
      </div>
    );
  }

  // 모바일 뷰(현장요원 앱) 페이지들은 기존 컨테이너 유지
  return (
    <div className="app-container">
      {/* 개발/사용자 혼선 방지용 [보조원] 뱃지 */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "#10b981", color: "white", padding: "8px 12px", borderRadius: "99px", fontWeight: "bold", fontSize: "14px", zIndex: 9999, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", pointerEvents: "none" }}>
        [보] 보조원
      </div>
      <NavBar />
      {children}
    </div>
  );
}
