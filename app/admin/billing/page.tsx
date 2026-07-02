"use client";

import React, { useState, useEffect } from "react";
import { getLicenseStatus, processPayment } from "@/lib/adminDb";
import { useRouter } from "next/navigation";

export default function BillingDashboard() {
  const router = useRouter();
  const [license, setLicense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState(1);
  const [months, setMonths] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const PRICE_PER_SLOT = 10000;
  const totalAmount = slots * months * PRICE_PER_SLOT;

  useEffect(() => {
    loadLicense();
  }, []);

  async function loadLicense() {
    try {
      setLoading(true);
      const status = await getLicenseStatus();
      setLicense(status);
    } catch (err: any) {
      alert("라이선스 정보를 불러오지 못했습니다: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!confirm(`총 결제금액: ${totalAmount.toLocaleString()}원\n\n토스페이먼츠(가상) 결제를 진행하시겠습니까?`)) return;
    
    try {
      setIsProcessing(true);
      // 가상 결제 프로세싱 (PG창 팝업을 대체)
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      await processPayment(slots, months, totalAmount);
      alert("✅ 결제가 성공적으로 완료되었습니다!");
      
      // 상태 새로고침
      await loadLicense();
    } catch (err: any) {
      alert("결제 처리 중 오류 발생: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>로딩 중...</div>;

  const usagePercent = license.totalSlots > 0 ? (license.usedSlots / license.totalSlots) * 100 : 0;
  const daysRemaining = Math.max(0, Math.ceil((new Date(license.validUntil).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>💳 라이선스 및 과금 관리</h1>
        <button onClick={() => router.push("/admin")} className="btn-secondary">← 원장 관리로 돌아가기</button>
      </div>

      {/* 라이선스 대시보드 */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "var(--color-text)" }}>현재 라이선스 현황</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div style={{ padding: "16px", background: "var(--color-bg)", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", color: "var(--color-text-light)", marginBottom: "8px" }}>실태확인원 슬롯 사용량</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              <span style={{ color: license.usedSlots >= license.totalSlots ? "red" : "var(--color-primary)" }}>
                {license.usedSlots}
              </span> 
              <span style={{ fontSize: "18px", color: "var(--color-text-light)" }}> / {license.totalSlots}명</span>
            </div>
            {/* 프로그레스 바 */}
            <div style={{ width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", marginTop: "12px", overflow: "hidden" }}>
              <div style={{ 
                width: `${Math.min(100, usagePercent)}%`, 
                height: "100%", 
                background: usagePercent >= 100 ? "red" : "var(--color-primary)",
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>

          <div style={{ padding: "16px", background: "var(--color-bg)", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", color: "var(--color-text-light)", marginBottom: "8px" }}>라이선스 남은 기간</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: license.isValid ? "var(--color-text)" : "red" }}>
              {license.isValid ? `D-${daysRemaining}` : "만료됨"}
            </div>
            <div style={{ fontSize: "14px", color: "var(--color-text-light)", marginTop: "12px" }}>
              만료일: {new Date(license.validUntil).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* 결제 시뮬레이터 */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "var(--color-text)" }}>이용권 구매 (토스페이먼츠 연동 예시)</h2>
        <p style={{ color: "var(--color-text-light)", marginBottom: "20px", fontSize: "14px" }}>
          현장 실태확인원 1인당 월 10,000원의 선불권이 결제됩니다. 결제 즉시 슬롯과 기간이 연장됩니다.
        </p>

        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>추가할 슬롯(인원) 수</label>
            <select 
              value={slots} 
              onChange={(e) => setSlots(Number(e.target.value))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}
            >
              {[1, 5, 10, 20, 50, 100].map(n => <option key={n} value={n}>{n}명</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>이용 기간(개월)</label>
            <select 
              value={months} 
              onChange={(e) => setMonths(Number(e.target.value))}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}
            >
              {[1, 3, 6, 12].map(n => <option key={n} value={n}>{n}개월</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", marginBottom: "20px", textAlign: "right" }}>
          <div style={{ fontSize: "14px", color: "var(--color-text-light)", marginBottom: "4px" }}>총 결제 예상 금액</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--color-primary)" }}>
            {totalAmount.toLocaleString()}원
          </div>
        </div>

        <button 
          onClick={handlePayment} 
          disabled={isProcessing}
          style={{ 
            width: "100%", padding: "16px", borderRadius: "8px", 
            background: isProcessing ? "#ccc" : "#3182f6", // 토스 블루
            color: "#fff", fontSize: "16px", fontWeight: "bold", border: "none", cursor: isProcessing ? "not-allowed" : "pointer" 
          }}
        >
          {isProcessing ? "결제창 호출 중..." : "결제하기 (테스트)"}
        </button>
      </div>
    </div>
  );
}
