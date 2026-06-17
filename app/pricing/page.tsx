"use client";

import { useEffect, useState } from "react";
import {
  FREE_MONTHLY_LIMIT,
  PRO_PRICE_KRW,
  getUsage,
  isProUser,
  setProUser,
} from "@/lib/usage";

export default function PricingPage() {
  const [usedCount, setUsedCount] = useState(0);
  const [proUser, setProUserState] = useState(false);

  useEffect(() => {
    setUsedCount(getUsage().count);
    setProUserState(isProUser());
  }, []);

  function toggleProDemo() {
    const next = !proUser;
    setProUser(next);
    setProUserState(next);
  }

  return (
    <div>
      <h1>요금제</h1>
      <p style={{ fontSize: 15, color: "var(--color-text-muted)" }}>
        엑셀 업로드, 원장 관리, 현장기록 입력, 결과 엑셀/문자발송은 모두{" "}
        <strong>무료로 제한 없이</strong> 사용할 수 있습니다. AI 자동분류
        기능만 아래와 같이 운영됩니다.
      </p>

      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
          무료 (Free)
        </div>
        <ul style={{ paddingLeft: "1.1rem", margin: 0, fontSize: 15, color: "var(--color-text-muted)" }}>
          <li>엑셀 업로드 / 원장 관리 / 문자 발송: 무제한</li>
          <li>AI 자동분류: 월 {FREE_MONTHLY_LIMIT}건</li>
          <li>한도 초과 시, 방문결과/특이사항을 직접 입력 (저장은 계속 가능)</li>
        </ul>
      </div>

      <div className="card" style={{ background: "var(--color-primary-bg)", border: "none" }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: "var(--color-primary)" }}>
          Pro
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          월 {PRO_PRICE_KRW.toLocaleString()}원
        </div>
        <ul style={{ paddingLeft: "1.1rem", margin: 0, fontSize: 15, color: "var(--color-text-muted)" }}>
          <li>AI 자동분류: 무제한</li>
          <li>(추후) 재방문 예약 알림</li>
          <li>(추후) 원장 클라우드 백업/기기간 동기화</li>
        </ul>
      </div>

      <h2>이번 달 사용 현황</h2>
      <div className="card card-muted">
        {proUser ? (
          <p style={{ margin: 0 }}>✨ Pro 이용 중 — AI 자동분류 무제한</p>
        ) : (
          <p style={{ margin: 0 }}>
            AI 자동분류 {usedCount}/{FREE_MONTHLY_LIMIT}건 사용
            {usedCount >= FREE_MONTHLY_LIMIT && (
              <span style={{ color: "#a33" }}> (한도 초과)</span>
            )}
          </p>
        )}
      </div>

      <div className="card card-muted">
        <p style={{ marginBottom: 8, fontSize: 14, color: "var(--color-text-muted)" }}>
          ⚠️ 현재 시스템 점검 중으로 결제 없이 바로 체험하실 수 있습니다.
        </p>

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: "16px", marginBottom: "1rem" }}
          onClick={toggleProDemo}
        >
          {proUser ? "Pro 해지하기" : "Pro 플랜 시작하기"}
        </button>
      </div>

      <a className="btn btn-ghost" href="/" style={{ justifyContent: "center", border: "1px solid var(--color-border)" }}>
        홈으로 돌아가기
      </a>
    </div>
  );
}
