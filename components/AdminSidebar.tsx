"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TestGuideModal from "./TestGuideModal";
import SecurityDocModal from "./SecurityDocModal";
import AdminGuideModal from "./AdminGuideModal";

export default function AdminSidebar({ onTestGuideSuccess }: { onTestGuideSuccess?: () => void }) {
  const pathname = usePathname() || "";
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showSecurityDocModal, setShowSecurityDocModal] = useState(false);
  const [showAdminGuideModal, setShowAdminGuideModal] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href !== "/admin/security" && typeof window !== "undefined" && !sessionStorage.getItem("workspace_pin")) {
      e.preventDefault();
      alert("🔒 최초 마스터 PIN을 먼저 생성해야 다른 메뉴를 이용할 수 있습니다.\n가운데 화면의 안내에 따라 6자리 PIN 번호를 생성해 주세요.");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTestMode(sessionStorage.getItem("workspace_pin") === "test");
      
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("guide") === "true") {
        setShowGuideModal(true);
        setTimeout(() => {
          alert("🎉 환영합니다!\n\n가상 보조원을 만들고 명단을 자동 배정하는 전체 흐름을 쉽게 파악할 수 있도록,\n테스트 가이드 보기에서 [1번부터 6번까지 순서대로 클릭]하면서 체험을 진행해 주세요!");
        }, 100);
        // Remove param after reading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return (
    <div className="hide-on-print" style={{ zIndex: 50, width: "260px", background: "#0f172a", display: "flex", flexDirection: "column", padding: "24px", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
      <h2 style={{ color: "white", fontSize: "20px", fontWeight: "bold", marginBottom: "32px", marginTop: 0 }}>관리자 대시보드</h2>
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <Link 
          href="/admin"
          onClick={(e) => handleMenuClick(e, "/admin")}
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname === "/admin" ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname === "/admin" ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (pathname !== "/admin") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (pathname !== "/admin") e.currentTarget.style.background = "transparent" }}
        >
          대시보드 홈
        </Link>
        <Link 
          href="/admin/targets"
          onClick={(e) => handleMenuClick(e, "/admin/targets")}
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname === "/admin/targets" ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname === "/admin/targets" ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (pathname !== "/admin/targets") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (pathname !== "/admin/targets") e.currentTarget.style.background = "transparent" }}
        >
          체납자 통합 원장 (DB)
        </Link>
        <Link 
          href="/admin/campaigns?upload=true"
          onClick={(e) => handleMenuClick(e, "/admin/campaigns?upload=true")}
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "1px solid #3b82f6", display: "block", transition: "all 0.2s", textDecoration: "none",
            background: "rgba(59, 130, 246, 0.15)",
            color: "#60a5fa", fontWeight: "bold"
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(59, 130, 246, 0.25)" }}
          onMouseOut={(e) => { e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)" }}
        >
          📥 체납 엑셀 데이터 업로드
        </Link>
        <Link 
          href="/admin/workers"
          onClick={(e) => handleMenuClick(e, "/admin/workers")}
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname === "/admin/workers" ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname === "/admin/workers" ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (pathname !== "/admin/workers") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (pathname !== "/admin/workers") e.currentTarget.style.background = "transparent" }}
        >
          실태확인원 등록/관리
        </Link>
        <Link 
          href="/admin/campaigns"
          onClick={(e) => handleMenuClick(e, "/admin/campaigns")}
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname === "/admin/campaigns" ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname === "/admin/campaigns" ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (pathname !== "/admin/campaigns") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (pathname !== "/admin/campaigns") e.currentTarget.style.background = "transparent" }}
        >
          현장 방문 배정
        </Link>
        <Link 
          href="/admin/stats"
          onClick={(e) => handleMenuClick(e, "/admin/stats")}
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname.startsWith("/admin/stats") ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname.startsWith("/admin/stats") ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (!pathname.startsWith("/admin/stats")) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (!pathname.startsWith("/admin/stats")) e.currentTarget.style.background = "transparent" }}
        >
          실적 및 분석 통계
        </Link>
        <Link
          href="/admin/report"
          onClick={(e) => handleMenuClick(e, "/admin/report")}
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname === "/admin/report" ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname === "/admin/report" ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (pathname !== "/admin/report") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (pathname !== "/admin/report") e.currentTarget.style.background = "transparent" }}
        >
          방문 완료 보고서
        </Link>
        <Link
          href="/admin/security"
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname === "/admin/security" ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname === "/admin/security" ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (pathname !== "/admin/security") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (pathname !== "/admin/security") e.currentTarget.style.background = "transparent" }}
        >
          핀번호생성관리
        </Link>
        <Link
          href="/admin/notices"
          onClick={(e) => handleMenuClick(e, "/admin/notices")}
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname === "/admin/notices" ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname === "/admin/notices" ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (pathname !== "/admin/notices") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (pathname !== "/admin/notices") e.currentTarget.style.background = "transparent" }}
        >
          공지사항 관리
        </Link>
        <Link
          href="/admin/manual"
          style={{ 
            padding: "12px 16px", borderRadius: "8px", border: "none", display: "block", transition: "background 0.2s", textDecoration: "none",
            background: pathname === "/admin/manual" ? "rgba(255,255,255,0.1)" : "transparent",
            color: pathname === "/admin/manual" ? "white" : "#cbd5e1"
          }}
          onMouseOver={(e) => { if (pathname !== "/admin/manual") e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseOut={(e) => { if (pathname !== "/admin/manual") e.currentTarget.style.background = "transparent" }}
        >
          업무 매뉴얼
        </Link>
      </div>

      <a 
        href="/sample-100-rows.xlsx" 
        download="체납관리단_100건_테스트샘플.xlsx"
        style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #8b5cf6", background: "rgba(139, 92, 246, 0.1)", color: "#c4b5fd", textAlign: "center", cursor: "pointer", fontSize: "14px", fontWeight: "bold", marginBottom: "16px", textDecoration: "none", display: "block" }}
      >
        🧪 100건 샘플 엑셀 다운로드
      </a>

      <button 
        onClick={() => setShowGuideModal(true)} 
        style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #334155", background: "transparent", color: "#cbd5e1", textAlign: "center", cursor: "pointer", fontSize: "14px", marginBottom: "8px" }}
      >
        테스트 가이드 보기
      </button>
      <button 
        onClick={() => setShowAdminGuideModal(true)} 
        style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #10b981", background: "transparent", color: "#34d399", textAlign: "center", cursor: "pointer", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}
      >
        📖 관리자 매뉴얼 (가이드)
      </button>
      <button 
        onClick={() => setShowSecurityDocModal(true)} 
        style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #3b82f6", background: "transparent", color: "#60a5fa", textAlign: "center", cursor: "pointer", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}
      >
        🛡️ 보안 아키텍처 명세서
      </button>
      <button 
        onClick={async () => { 
          sessionStorage.removeItem("workspace_pin"); 
          await fetch("/api/auth/signout", { method: "POST" });
          window.location.href = "/"; 
        }} 
        style={{ padding: "12px 16px", borderRadius: "8px", border: "none", background: "#334155", color: "white", textAlign: "center", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
      >
        로그아웃
      </button>

      <TestGuideModal 
        isOpen={showGuideModal} 
        onClose={() => setShowGuideModal(false)} 
        onSuccess={() => {
          if (onTestGuideSuccess) onTestGuideSuccess();
          else window.location.reload();
        }} 
      />
      <SecurityDocModal 
        isOpen={showSecurityDocModal} 
        onClose={() => setShowSecurityDocModal(false)} 
      />
      <AdminGuideModal 
        isOpen={showAdminGuideModal} 
        onClose={() => setShowAdminGuideModal(false)} 
      />
    </div>
  );
}
