"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WorkerLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true); // 입력 시 확인 가능하도록 기본값 true
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("test_mode") === "1") {
      sessionStorage.setItem("is_test_mode", "true");
    }
  }, []);

  const formatPhoneNumber = (value: string) => {
    if (!value) return "";
    const onlyNums = value.replace(/[^0-9]/g, "");
    if (onlyNums.length <= 3) return onlyNums;
    if (onlyNums.length <= 7) return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone?.trim() || "";
    const cleanPassword = password?.trim() || "";

    if (!cleanPhone || !cleanPassword) {
      alert("전화번호와 비밀번호를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    
    const isEmail = cleanPhone.includes("@");
    const dummyEmail = isEmail ? cleanPhone : `${cleanPhone.replace(/[^0-9]/g, '')}@knts.local`;
    const safePassword = cleanPassword.padEnd(6, '0');

    const { error } = await supabase.auth.signInWithPassword({ 
      email: dummyEmail, 
      password: safePassword 
    });

    if (error) {
      alert("로그인 실패: 전화번호나 비밀번호가 올바르지 않습니다.\n관리자에게 계정 발급을 문의하세요.");
    } else {
      router.push("/worker");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#f1f5f9", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "28px 24px", background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
        
        {/* 현장 실태확인원 전용 헤더 */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ display: "inline-block", background: "#2563eb", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", marginBottom: "10px" }}>
            📱 현장 실태확인원 전용
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#0f172a", margin: "0 0 6px 0" }}>
            실태확인원 로그인
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0, lineHeight: "1.4" }}>
            본인의 전화번호로 로그인하여 현장 업무를 진행하세요.
          </p>
        </div>

        {/* 안내 카드 */}
        <div style={{ background: "#eff6ff", padding: "14px", borderRadius: "10px", marginBottom: "22px", border: "1px solid #bfdbfe" }}>
          <p style={{ color: "#1e40af", fontSize: "13px", margin: "0 0 4px 0", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>💡</span> 최초 로그인 안내
          </p>
          <p style={{ color: "#1d4ed8", fontSize: "12px", margin: 0, lineHeight: "1.4" }}>
            최초 비밀번호는 본인 전화번호 <b>뒷자리 4자리</b>입니다.<br/>
            로그인 후 [내 정보] 메뉴에서 언제든 변경할 수 있습니다.
          </p>
        </div>
        
        <form onSubmit={handleLogin} style={{ textAlign: "left" }} autoComplete="off">
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "13px", color: "#334155" }}>전화번호 (ID)</label>
            <input 
              type="tel" 
              name="worker-phone"
              autoComplete="new-password"
              placeholder="010-1234-5678" 
              value={phone} 
              onChange={e => setPhone(formatPhoneNumber(e.target.value))} 
              style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "16px", boxSizing: "border-box" }} 
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "13px", color: "#334155" }}>비밀번호</label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="worker-password"
                autoComplete="new-password"
                placeholder="비밀번호 입력" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: "100%", padding: "12px 14px", paddingRight: "44px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "16px", boxSizing: "border-box" }} 
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
                  color: showPassword ? "#2563eb" : "#94a3b8"
                }}
                title={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <button 
            type="submit"
            style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: "bold", backgroundColor: "#2563eb", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}
            disabled={loading}
          >
            {loading ? "로그인 중..." : "확인원 로그인"}
          </button>
        </form>


        <div style={{ marginTop: "20px", textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
          <Link href="/" style={{ color: "#64748b", fontSize: "13px", textDecoration: "none" }}>
            ← 서비스 소개 페이지로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
