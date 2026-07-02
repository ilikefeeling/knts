"use client";
import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
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
    
    // 전화번호에서 숫자만 추출하여 dummyEmail 변환 (이메일 형식이면 그대로 사용)
    const isEmail = cleanPhone.includes("@");
    const dummyEmail = isEmail ? cleanPhone : `${cleanPhone.replace(/[^0-9]/g, '')}@knts.local`;

    // Supabase Auth 최소 6자리 요구사항 우회를 위해 가입 시 적용했던 동일한 패딩 로직 추가
    const safePassword = cleanPassword.padEnd(6, '0');

    const { error } = await supabase.auth.signInWithPassword({ 
      email: dummyEmail, 
      password: safePassword 
    });

    if (error) {
      alert("로그인 실패: 전화번호나 비밀번호가 올바르지 않습니다.\n관리자에게 계정 발급을 문의하세요");
    } else {
      router.push("/worker");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "80px auto", textAlign: "center", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <h1 style={{ marginBottom: "10px", fontSize: "24px", fontWeight: "bold" }}>
        실태확인원 로그인
      </h1>
      <p style={{ color: "gray", fontSize: "14px", marginBottom: "5px", lineHeight: "1.5" }}>
        본인의 전화번호를 입력해 주세요.
      </p>
      <div style={{ background: "#eef2ff", padding: "12px", borderRadius: "8px", marginBottom: "25px", textAlign: "left" }}>
        <p style={{ color: "var(--color-primary)", fontSize: "13px", margin: "0 0 6px 0", fontWeight: "bold", display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <span>💡</span> 최초 로그인 시 비밀번호는 실태확인원 본인 전화번호 뒷자리 4자리입니다.
        </p>
        <p style={{ color: "#4f46e5", fontSize: "12px", margin: 0, paddingLeft: "22px", lineHeight: "1.4" }}>
          로그인 후 <span style={{ fontWeight: "bold", textDecoration: "underline" }}>[내 정보] 또는 [설정]</span> 메뉴에서 본인만의 비밀번호로 변경하실 수 있습니다.
        </p>
      </div>
      
      <form onSubmit={handleLogin} style={{ textAlign: "left" }} autoComplete="off">
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>전화번호 (ID)</label>
          <input 
            type="tel" 
            name="worker-phone"
            autoComplete="new-password"
            placeholder="예: 010-1234-5678" 
            value={phone} 
            onChange={e => setPhone(formatPhoneNumber(e.target.value))} 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "16px" }} 
          />
        </div>
        <div style={{ marginBottom: "25px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>비밀번호</label>
          <div style={{ position: "relative" }}>
            <input 
              type={showPassword ? "text" : "password"} 
              name="worker-password"
              autoComplete="new-password"
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
        <button 
          type="submit"
          className="btn-primary" 
          style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div style={{ marginTop: "25px", padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
        <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#334155", fontWeight: "bold" }}>관리자이신가요?</p>
        <Link href="/login/admin" style={{ display: "block", width: "100%", padding: "12px", background: "white", color: "#475569", fontSize: "14px", fontWeight: "bold", textDecoration: "none", borderRadius: "6px", border: "1px solid #94a3b8", textAlign: "center" }}>
          관리자(이메일) 로그인으로 이동 →
        </Link>
      </div>
    </div>
  );
}
