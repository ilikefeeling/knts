"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      {/* Header - Minimal */}
      <header style={{ padding: "30px 20px 10px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "transparent", gap: "12px" }}>
        <img src="/nts-logo.png" alt="국세청" style={{ height: "48px", objectFit: "contain" }} />
        <div style={{ fontSize: "16px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px" }}>FIELD-MASTER</div>
      </header>

      {/* Main Content - Centered Card */}
      <main style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <button
          onClick={() => router.push("/login")}
          style={{
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            border: "none",
            borderRadius: "32px",
            padding: "40px",
            width: "100%",
            maxWidth: "360px",
            aspectRatio: "1 / 1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
            color: "white",
            gap: "24px"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 25px 50px rgba(59, 130, 246, 0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(59, 130, 246, 0.3)";
          }}
        >
          <div style={{ fontSize: "72px", lineHeight: "1" }}>📱</div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 12px 0", letterSpacing: "-1px" }}>
              실태확인원
            </h2>
            <p style={{ fontSize: "18px", opacity: 0.9, margin: 0, fontWeight: "500", backgroundColor: "rgba(255,255,255,0.2)", padding: "8px 20px", borderRadius: "999px" }}>
              업무 시작하기 &rarr;
            </p>
          </div>
        </button>
      </main>

      {/* Footer - Admin links */}
      <footer style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", background: "transparent" }}>
        <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "#cbd5e1" }}>
          <button 
            onClick={() => router.push("/admin/login")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
          >
            관리자 로그인
          </button>
          <span style={{ opacity: 0.3 }}>|</span>
          <button 
            onClick={handleDemoStart}
            disabled={isLoading}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
          >
            {isLoading ? "준비 중..." : "시스템 체험"}
          </button>
        </div>
        <div style={{ color: "#e2e8f0", fontSize: "12px" }}>
          © {new Date().getFullYear()} Field-Master.
        </div>
      </footer>
    </div>
  );
}
