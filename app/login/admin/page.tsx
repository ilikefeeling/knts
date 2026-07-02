"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    
    // Supabase Auth 최소 6자리 요구사항 우회를 위해 가입 시 적용했던 동일한 패딩 로직 추가
    const safePassword = password.padEnd(6, '0');

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ 
      email: email, 
      password: safePassword 
    });

    if (error) {
      alert("로그인 실패: 이메일이나 비밀번호가 올바르지 않습니다.");
    } else {
      // 개발자 편의 기능: 이메일로 로그인 성공 시 자동으로 ADMIN 권한 부여 및 10명 결제 완료 처리
      if (signInData.user) {
        await supabase.from("profiles").upsert({
          id: signInData.user.id,
          role: "ADMIN",
          status: "ACTIVE",
          phone: "000-0000-0000",
          name: "슈퍼관리자(개발자)"
        });
        
        // 개발자 라이선스 자동 발급 (개발자 계정이거나 임시 부여용)
        if (signInData.user.email === "ilikefeeling@gmail.com") {
          const sixMonthsLater = new Date();
          sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
          await supabase.from("admin_licenses").upsert({
            admin_id: signInData.user.id,
            total_slots: 10,
            valid_until: sixMonthsLater.toISOString()
          });
        }

        router.push("/admin"); // 관리자는 바로 admin 페이지로 이동
      }
    }
    setLoading(false);
  };

  const handleDevAdminLogin = async () => {
    setLoading(true);
    const devEmail = "admin@knts.local";
    const devPw = "admin1234";

    // 1. 로그인 시도
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPw
    });

    // 2. 계정이 없으면 가입 및 관리자 권한 부여
    if (signInError && signInError.message.includes("Invalid login")) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: devEmail,
        password: devPw
      });
      if (signUpError) {
        alert("개발자 계정 생성 실패: " + signUpError.message);
        setLoading(false);
        return;
      }
      if (signUpData.user) {
        await supabase.from("profiles").upsert({
          id: signUpData.user.id,
          role: "ADMIN",
          status: "ACTIVE",
          phone: "000-0000-0000",
          name: "개발자(관리자)"
        });
      }
      // 가입 후 다시 로그인
      await supabase.auth.signInWithPassword({ email: devEmail, password: devPw });
    }

    router.push("/admin");
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    const safePassword = password.padEnd(6, '0');

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email,
      password: safePassword
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
        
        // 원활한 테스트를 위해 기본 라이선스 부여
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        await supabase.from("admin_licenses").upsert({
          admin_id: signUpData.user.id,
          total_slots: 10,
          valid_until: sixMonthsLater.toISOString()
        });

        alert("회원가입이 완료되었습니다! 관리자 페이지로 이동합니다.");
        await supabase.auth.signInWithPassword({ email, password: safePassword });
        router.push("/admin");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "80px auto", textAlign: "center", background: "#f8fafc", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "2px solid #cbd5e1" }}>
      <div style={{ display: "inline-block", background: "#334155", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>시스템 관리자 전용</div>
      <h1 style={{ marginBottom: "10px", fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>
        관리자 로그인 및 가입
      </h1>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "25px", lineHeight: "1.5" }}>
        이곳은 관리자 전용입니다. 이메일과 비밀번호를 입력하세요.
      </p>
      
      <form onSubmit={handleLogin} style={{ textAlign: "left" }} autoComplete="off">
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>이메일 주소 (ID)</label>
          <input 
            type="email" 
            name="admin_email_field"
            autoComplete="new-password"
            placeholder="예: admin@nts.go.kr" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "16px" }} 
          />
        </div>
        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>비밀번호</label>
          <div style={{ position: "relative" }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="비밀번호 입력" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: "100%", padding: "12px", paddingRight: "40px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "16px" }} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                color: showPassword ? "var(--color-primary)" : "#aaa"
              }}
              title={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <button 
            type="button"
            onClick={handleSignUp}
            style={{ flex: 1, padding: "14px", fontSize: "16px", fontWeight: "bold", backgroundColor: "#f1f5f9", color: "#334155", borderRadius: "8px", border: "1px solid #cbd5e1", cursor: "pointer" }}
            disabled={loading}
          >
            {loading ? "처리 중..." : "회원가입"}
          </button>
          <button 
            type="submit"
            className="btn-primary" 
            style={{ flex: 1, padding: "14px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", border: "none", cursor: "pointer" }}
            disabled={loading}
          >
            {loading ? "처리 중..." : "로그인"}
          </button>
        </div>
      </form>

      <button 
        onClick={handleDevAdminLogin}
        style={{ width: "100%", padding: "14px", fontSize: "14px", fontWeight: "bold", backgroundColor: "#333", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", marginBottom: "15px" }}
        disabled={loading}
      >
        [개발자용] 관리자(Admin) 계정 자동 로그인
      </button>

      <div style={{ marginTop: "20px", padding: "15px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
        <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#166534", fontWeight: "bold" }}>혹시 현장 실태확인원이신가요?</p>
        <Link href="/login" style={{ display: "block", width: "100%", padding: "12px", background: "white", color: "#15803d", fontSize: "14px", fontWeight: "bold", textDecoration: "none", borderRadius: "6px", border: "1px solid #22c55e", textAlign: "center" }}>
          실태확인원(전화번호) 로그인으로 이동 →
        </Link>
      </div>
    </div>
  );
}
