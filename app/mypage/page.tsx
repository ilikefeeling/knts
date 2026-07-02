"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();
      if (profile) {
        setUserPhone(profile.phone);
      }
    }
    loadUser();
  }, [router, supabase]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      alert("새 비밀번호를 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 4) {
      alert("비밀번호는 최소 4자리 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    // Supabase Auth 최소 6자리 요구사항 우회를 위한 패딩 로직 (로그인 시와 동일)
    const safePassword = newPassword.padEnd(6, '0');

    const { error } = await supabase.auth.updateUser({
      password: safePassword
    });

    setLoading(false);

    if (error) {
      alert("비밀번호 변경 실패: " + error.message);
    } else {
      alert("비밀번호가 성공적으로 변경되었습니다! 다음 로그인부터 새 비밀번호를 사용해주세요.");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "40px auto", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>비밀번호 수정</h1>
      </div>

      <div style={{ marginBottom: "24px", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>내 로그인 ID (전화번호)</div>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>{userPhone || "로딩 중..."}</div>
      </div>

      <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "#334155" }}>비밀번호 변경</h2>
      <form onSubmit={handleChangePassword}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#475569" }}>새 비밀번호 (최소 4자리)</label>
          <input 
            type="password" 
            placeholder="본인만 아는 비밀번호 입력" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "16px" }} 
          />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#475569" }}>새 비밀번호 확인</label>
          <input 
            type="password" 
            placeholder="비밀번호 다시 입력" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "16px" }} 
          />
        </div>
        <button 
          type="submit"
          className="btn-primary" 
          style={{ width: "100%", padding: "14px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "8px", background: "#3b82f6", color: "white", cursor: "pointer" }}
          disabled={loading}
        >
          {loading ? "변경 처리 중..." : "비밀번호 변경하기"}
        </button>
      </form>
    </div>
  );
}
