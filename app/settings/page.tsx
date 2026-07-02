"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("비밀번호는 최소 6자리 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      alert("비밀번호 변경 실패: " + error.message);
    } else {
      alert("비밀번호가 성공적으로 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("workspace_pin");
    
    // 테스트 모드였던 경우, 관리자 대시보드(부모 창)에 테스트 종료 알림 전송
    if (sessionStorage.getItem("is_test_mode") === "true") {
      sessionStorage.removeItem("is_test_mode");
      if (window.opener) {
        window.opener.postMessage("TEST_LOGOUT", "*");
        // 창 닫기 시도 (팝업으로 열렸을 경우)
        window.close();
      }
    }
    
    window.location.href = "/";
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "24px", color: "var(--color-text)" }}>
        설정 / 마이페이지
      </h2>

      <div style={{ background: "var(--color-bg)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "var(--color-text)" }}>비밀번호 변경</h3>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
          본인만 아는 새로운 비밀번호로 변경할 수 있습니다. (최소 6자리)
        </p>
        <form onSubmit={handleUpdatePassword}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "var(--color-text)" }}>새 비밀번호</label>
            <input 
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "15px", background: "var(--color-bg)", color: "var(--color-text)" }}
              placeholder="새 비밀번호 입력"
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "var(--color-text)" }}>새 비밀번호 확인</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "15px", background: "var(--color-bg)", color: "var(--color-text)" }}
              placeholder="새 비밀번호 다시 입력"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px", fontSize: "16px" }}
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>

      <div style={{ background: "var(--color-bg)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "var(--color-text)" }}>계정 관리</h3>
        <button 
          onClick={handleLogout}
          style={{ width: "100%", padding: "14px", fontSize: "16px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
