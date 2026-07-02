"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignupConversionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      alert("비밀번호는 최소 6자리 이상 입력해주세요.");
      return;
    }
    
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      alert("회원가입 실패: " + error.message);
    } else {
      if (signUpData.user) {
        await supabase.from("profiles").upsert({
          id: signUpData.user.id,
          role: "ADMIN",
          status: "ACTIVE",
          phone: "000-0000-0000",
          name: "신규 관리자"
        });
        
        // 1개월 무료 평가판 (10명)
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        await supabase.from("admin_licenses").upsert({
          admin_id: signUpData.user.id,
          total_slots: 10,
          valid_until: oneMonthLater.toISOString()
        });

        alert("가입이 완료되었습니다! 관리자 대시보드로 이동합니다.");
        await supabase.auth.signInWithPassword({ email, password });
        router.push("/admin");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "60px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#0f172a", marginBottom: "16px", letterSpacing: "-1px" }}>
            성공적인 현장조사 관리의 시작
          </h1>
          <p style={{ fontSize: "18px", color: "#475569", lineHeight: "1.6" }}>
            1초 체험으로 확인하신 편리함, 이제 <strong>무료로 직접 도입</strong>해 보세요.<br/>
            E2EE 보안 기술이 적용된 완벽한 작업 관리 환경을 제공합니다.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          
          {/* 1. 셀프 서비스 가입 (무료) */}
          <div style={{ background: "white", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", marginBottom: "20px" }}>
              바로 시작하기
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", marginBottom: "10px" }}>
              무료 계정 생성 (Admin)
            </h2>
            <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "14px", lineHeight: "1.5" }}>
              가입 즉시 1개월 무료 평가판(10명 할당 가능)이 제공됩니다.<br/>
              신용카드 등록 없이 바로 시작하세요.
            </p>

            <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "14px" }}>이메일 주소 (ID)</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", transition: "all 0.2s" }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "14px" }}>비밀번호 (6자리 이상)</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", transition: "all 0.2s" }}
                  required
                  minLength={6}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ width: "100%", padding: "16px", background: "#3b82f6", color: "white", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", border: "none", cursor: "pointer", marginTop: "10px", opacity: loading ? 0.7 : 1, transition: "background 0.2s" }}
              >
                {loading ? "계정 생성 중..." : "지금 바로 시작하기"}
              </button>
            </form>
          </div>

          {/* 2. 도입 상담 / 엔터프라이즈 */}
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 40px rgba(15,23,42,0.15)", color: "white", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", marginBottom: "20px", alignSelf: "flex-start" }}>
              엔터프라이즈 / 대규모 도입
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "15px", color: "white" }}>
              도입 상담 문의
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: "30px", fontSize: "15px", lineHeight: "1.6" }}>
              지자체, 대규모 인력 관리, 커스텀 기능 개발이 필요하신가요?<br/>
              전문 컨설턴트가 기관의 요구사항에 맞는 최적의 솔루션을 제안해 드립니다.
            </p>
            
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px 0", gap: "12px", display: "flex", flexDirection: "column" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f8fafc", fontSize: "14px" }}>
                <span style={{ color: "#10b981" }}>✓</span> 전용 독립 서버 및 DB 구축 (On-Premise)
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f8fafc", fontSize: "14px" }}>
                <span style={{ color: "#10b981" }}>✓</span> 내부 행정망 연동 및 맞춤형 통계
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f8fafc", fontSize: "14px" }}>
                <span style={{ color: "#10b981" }}>✓</span> 인원 무제한 & 전담 기술 지원
              </li>
            </ul>

            <div style={{ marginTop: "auto" }}>
              <a 
                href="mailto:contact@knts.co.kr"
                style={{ display: "block", width: "100%", padding: "16px", background: "rgba(255,255,255,0.1)", color: "white", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", textAlign: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)", transition: "background 0.2s" }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              >
                contact@knts.co.kr 로 문의하기
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
