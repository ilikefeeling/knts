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
    
    // Supabase Auth 최소 6자리 요구사항 우회를 위해 동일한 패딩 로직 적용
    const safePassword = password.padEnd(6, '0');

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ 
      email: email, 
      password: safePassword 
    });

    if (error) {
      alert("로그인 실패: 이메일이나 비밀번호가 올바르지 않습니다.");
    } else {
      if (signInData.user) {
        await supabase.from("profiles").upsert({
          id: signInData.user.id,
          role: "ADMIN",
          status: "ACTIVE",
          phone: "000-0000-0000",
          name: "슈퍼관리자"
        });
        
        // 개발자 라이선스 자동 발급 (필요시)
        if (signInData.user.email === "ilikefeeling@gmail.com") {
          const sixMonthsLater = new Date();
          sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
          await supabase.from("admin_licenses").upsert({
            admin_id: signInData.user.id,
            total_slots: 10,
            valid_until: sixMonthsLater.toISOString()
          });
        }

        router.push("/admin"); // 관리자는 /admin 으로 이동
      }
    }
    setLoading(false);
  };

  const handleDevAdminLogin = async () => {
    const devPw = prompt("개발자용 로그인 비밀번호를 입력하세요.");
    if (!devPw) return;

    setLoading(true);
    const devEmail = "admin@knts.local";

    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPw
    });

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "#1e293b", borderRadius: "16px", padding: "36px 30px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)", border: "1px solid #334155", color: "#f8fafc" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-block", background: "#38bdf8", color: "#0f172a", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", marginBottom: "12px" }}>
            🔒 시스템 관리자 전용 (Admin)
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff", margin: "0 0 8px 0" }}>
            관리자 시스템 로그인
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
            기관 및 시스템 관리자 전용 계정으로 로그인하세요.
          </p>
        </div>
        
        <form onSubmit={handleLogin} style={{ textAlign: "left" }} autoComplete="off">
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px", color: "#cbd5e1" }}>
              관리자 이메일 (ID)
            </label>
            <input 
              type="email" 
              name="admin_email_field"
              autoComplete="new-password"
              placeholder="admin@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#ffffff", fontSize: "15px", boxSizing: "border-box" }} 
            />
          </div>
          <div style={{ marginBottom: "26px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px", color: "#cbd5e1" }}>
              비밀번호
            </label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="비밀번호 입력" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: "100%", padding: "12px 14px", paddingRight: "44px", borderRadius: "8px", border: "1px solid #475569", background: "#0f172a", color: "#ffffff", fontSize: "15px", boxSizing: "border-box" }} 
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
                  color: showPassword ? "#38bdf8" : "#64748b"
                }}
                title={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <button 
              type="button"
              onClick={handleSignUp}
              style={{ flex: 1, padding: "14px", fontSize: "15px", fontWeight: "bold", backgroundColor: "#334155", color: "#f8fafc", borderRadius: "8px", border: "1px solid #475569", cursor: "pointer", transition: "all 0.2s" }}
              disabled={loading}
            >
              {loading ? "처리 중..." : "회원가입"}
            </button>
            <button 
              type="submit"
              style={{ flex: 1, padding: "14px", fontSize: "15px", fontWeight: "bold", backgroundColor: "#0284c7", color: "#ffffff", borderRadius: "8px", border: "none", cursor: "pointer", transition: "all 0.2s" }}
              disabled={loading}
            >
              {loading ? "처리 중..." : "로그인"}
            </button>
          </div>
        </form>

        {process.env.NODE_ENV !== "production" && (
          <button 
            onClick={handleDevAdminLogin}
            style={{ width: "100%", padding: "12px", fontSize: "13px", fontWeight: "bold", backgroundColor: "#000000", color: "#38bdf8", borderRadius: "8px", border: "1px solid #334155", cursor: "pointer", marginBottom: "20px" }}
            disabled={loading}
          >
            💻 [개발자 전용] 원클릭 테스트 관리자 로그인
          </button>
        )}

        <div style={{ textAlign: "center", paddingTop: "16px", borderTop: "1px solid #334155" }}>
          <Link href="/" style={{ color: "#94a3b8", fontSize: "13px", textDecoration: "none" }}>
            ← 메인 서비스 랜딩으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
