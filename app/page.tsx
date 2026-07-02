"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoStart = async () => {
    setIsLoading(true);
    try {
      // API call to set demo session
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (res.ok) {
        // Set fixed PIN for demo to match setup-demo.js
        sessionStorage.setItem("workspace_pin", "159357");
        router.push("/admin?guide=true");
      } else {
        alert("체험 계정 준비에 실패했습니다. 잠시 후 다시 시도해주세요.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc", fontFamily: "'Pretendard', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", letterSpacing: "-1px" }}>Field-Master</div>
        <div>
          <button 
            onClick={() => router.push("/login/admin")}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", color: "#334155", fontWeight: "bold", cursor: "pointer", marginRight: "12px" }}
          >
            정식 로그인
          </button>
          <button 
            onClick={handleDemoStart}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "white", fontWeight: "bold", cursor: "pointer" }}
            disabled={isLoading}
          >
            {isLoading ? "준비 중..." : "1초 무료 체험"}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ display: "inline-block", padding: "6px 16px", background: "#eff6ff", color: "#1d4ed8", borderRadius: "999px", fontSize: "14px", fontWeight: "bold", marginBottom: "24px", border: "1px solid #bfdbfe" }}>
          🚀 B2G / 공공기관 현장조사 전용 솔루션
        </div>
        <h1 style={{ fontSize: "56px", fontWeight: "900", color: "#0f172a", letterSpacing: "-2px", lineHeight: "1.2", marginBottom: "24px" }}>
          현장 방문부터 보고서 자동화까지,<br />
          <span style={{ color: "#3b82f6" }}>행정 업무의 패러다임</span>을 바꿉니다.
        </h1>
        <p style={{ fontSize: "20px", color: "#475569", lineHeight: "1.6", marginBottom: "48px", maxWidth: "800px" }}>
          국세·지방세 체납 조사, 복지 사각지대 발굴 등 현장 업무 시 <strong>클로바노트 녹음</strong>만 하세요.<br />
          AI가 알아서 요약하고, 관리자 대시보드에 실시간 보고서가 작성됩니다.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "60px" }}>
          <button 
            onClick={handleDemoStart}
            style={{ 
              padding: "20px 40px", 
              borderRadius: "12px", 
              border: "none", 
              background: "linear-gradient(135deg, #2563eb, #3b82f6)", 
              color: "white", 
              fontSize: "20px", 
              fontWeight: "bold", 
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(59, 130, 246, 0.4)",
              transition: "transform 0.2s"
            }}
            disabled={isLoading}
          >
            {isLoading ? "가상의 데이터 생성 중..." : "🔥 관리자용 시스템 1초 체험하기 (가입 X)"}
          </button>
        </div>

        {/* Feature Highlights */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", maxWidth: "1000px", width: "100%" }}>
          <div style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", textAlign: "left" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>📊</div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>한눈에 보는 대시보드</h3>
            <p style={{ color: "#64748b", lineHeight: "1.5" }}>수십 명의 실태확인원 동선과 할당된 체납자 데이터를 한 화면에서 통제하고 관리하세요.</p>
          </div>
          <div style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", textAlign: "left" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🤖</div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>클로바노트 AI 연동</h3>
            <p style={{ color: "#64748b", lineHeight: "1.5" }}>현장에서 녹음만 하면 끝! 긴 상담 내용이 핵심만 요약되어 보고서로 자동 변환됩니다.</p>
          </div>
          <div style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", textAlign: "left" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔒</div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>군사급 종단간 암호화</h3>
            <p style={{ color: "#64748b", lineHeight: "1.5" }}>모든 민감 데이터는 서버에 저장되기 전 암호화되어 관리자 외에는 절대 열람할 수 없습니다.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "40px", textAlign: "center", borderTop: "1px solid #e2e8f0", color: "#94a3b8", fontSize: "14px" }}>
        © {new Date().getFullYear()} Field-Master. All rights reserved. B2G 솔루션
      </footer>
    </div>
  );
}
