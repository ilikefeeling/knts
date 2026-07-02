"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { createCampaign, createMockTarget, getCampaigns, getWorkers, autoAssignTargets, getTaskLedgers } from "@/lib/adminDb";
import { encryptText } from "@/lib/crypto";

export default function TestGuideModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void }) {
  const router = useRouter();

  if (!isOpen) return null;

  async function handleAddMock() {
    try {
      const pin = sessionStorage.getItem("workspace_pin");
      if (!pin) {
        alert("최초 마스터 PIN 번호가 아직 생성되지 않았습니다.\n\n먼저 [핀번호생성관리] 메뉴에서 6자리 PIN 번호를 생성한 뒤에 진행해 주세요.");
        return;
      }

      let campaigns = await getCampaigns();
      let campaignId = campaigns.length > 0 ? campaigns[0].id : null;
      if (!campaignId) {
        const res = await createCampaign("테스트용 캠페인", "가상 테스트 대상자 명단");
        if (!res.success || !res.campaignId) throw new Error("캠페인 생성 실패");
        campaignId = res.campaignId;
      }

      const existingTasks = await getTaskLedgers(campaignId);
      if (existingTasks && existingTasks.length >= 5) {
        alert("이미 가상 대상자 명단이 추가되어 있습니다. 캠페인 관리 화면에서 확인해 주세요.");
        if (window.location.pathname !== "/admin/campaigns") {
          router.push("/admin/campaigns");
        } else {
          router.refresh();
        }
        return;
      }

      const mocks = [
        { name: "홍길동", address: "서울 강남구 테헤란로 123", detail: "101호" },
        { name: "김철수", address: "서울 서초구 서초대로 456", detail: "202호" },
        { name: "이영희", address: "서울 송파구 올림픽로 789", detail: "303호" },
        { name: "박지민", address: "경기 성남시 분당구 판교역로 12", detail: "404호" },
        { name: "최수연", address: "인천 연수구 컨벤시아대로 34", detail: "505호" }
      ];

      for (const m of mocks) {
        const encName = await encryptText(m.name, pin);
        const encAddr = await encryptText(m.address, pin);
        const encDetail = await encryptText(m.detail, pin);
        const res = await createMockTarget(campaignId, encName, encAddr, encDetail);
        if (!res.success) {
          throw new Error(res.message || "대상자 추가에 실패했습니다.");
        }
      }

      if (window.location.pathname !== "/admin/campaigns") {
        router.push("/admin/campaigns");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert("오류: " + err.message);
    }
  }

  async function handleAutoAssignMock() {
    try {
      let campaigns = await getCampaigns();
      if (campaigns.length === 0) {
        alert("2단계(가상 대상자 추가)를 먼저 진행해주세요.");
        return;
      }
      
      let workers = await getWorkers();
      if (workers.length === 0) {
        alert("1단계(보조원 계정 발급)를 먼저 진행해주세요.");
        return;
      }

      const res = await autoAssignTargets(campaigns[0].id, [workers[0].id]);
      if (!res.success) {
        throw new Error(res.message || "보조원 배정에 실패했습니다.");
      }

      if (window.location.pathname !== "/admin/campaigns") {
        router.push("/admin/campaigns");
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert("오류: " + err.message);
    }
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
      <div style={{ background: "#fff", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
        <h2 style={{ color: "#0f172a", fontSize: "24px", marginBottom: "12px", textAlign: "center" }}>E2EE 프로토타입 테스트 안내</h2>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: "32px", fontSize: "16px", lineHeight: "1.6", fontWeight: "500" }}>
          1번부터 5번까지 순서대로 클릭하면서 체험을 진행해 주세요!
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
          
          {/* Step 1 */}
          <div 
            onClick={() => { onClose(); router.push("/admin/workers"); }}
            style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
          >
            <div style={{ background: "#0f172a", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", flexShrink: 0 }}>1</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "16px" }}>보조원 관리 페이지로 이동 (여기를 클릭하세요)</h4>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>이동 후 우측 상단의 <b>[새 보조원 추가]</b> 버튼을 눌러 계정을 직접 만들어보세요. (초기 접속용 PIN번호가 발급됩니다.)</p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div 
            onClick={() => { onClose(); handleAddMock(); }}
            style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
          >
            <div style={{ background: "#0f172a", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", flexShrink: 0 }}>2</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "16px" }}>가상 대상자 명단 추가 (여기를 클릭하세요)</h4>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>암호화된 가상 대상자 명단을 데이터베이스에 자동 생성합니다.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div 
            onClick={() => { onClose(); handleAutoAssignMock(); }}
            style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
          >
            <div style={{ background: "#0f172a", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", flexShrink: 0 }}>3</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "16px" }}>보조원 스마트 배정 (여기를 클릭하세요)</h4>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>캠페인 및 배정 관리 메뉴에서 미배정된 대상자를 보조원에게 일괄 배정합니다.</p>
            </div>
          </div>

          <div 
            onClick={() => { alert("💡 [집중관리대상 지정 팁]\n\n좌측의 '캠페인 대상자 원장' 메뉴에서 특정 악성 체납자를 선택한 뒤 '🚨 집중관리 지정' 버튼을 누르세요. 무기한 특별 관리대상으로 마킹되어 우선 배정 시 유용합니다."); }}
            style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: "#fef2f2", padding: "16px", borderRadius: "12px", border: "1px solid #fecaca", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fee2e2"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.background = "#fef2f2"; }}
          >
            <div style={{ background: "#ef4444", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", flexShrink: 0 }}>4</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "#b91c1c", fontSize: "16px" }}>집중관리(악성 체납자) 지정 방법 (팁 보기)</h4>
              <p style={{ margin: 0, color: "#dc2626", fontSize: "14px", lineHeight: "1.5" }}>대상자 원장에서 악성 대상을 집중관리대상으로 플래그(Flag) 처리하는 방법을 알아봅니다.</p>
            </div>
          </div>

          {/* Step 5 - Moved to alert after worker registration */}
          
          {/* Step 6 */}
          <div 
            onClick={() => { onClose(); router.push("/admin/report"); }}
            style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.background = "#eff6ff"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}
          >
            <div style={{ background: "#0f172a", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", flexShrink: 0 }}>5</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "16px" }}>결과 및 보고서 확인</h4>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>현장 입력이 완료되면 대시보드에서 실시간 진척도를 확인하고 <strong>보고서 출력</strong>을 진행합니다.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: "#3b82f6", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.5)" }}
        >
          확인했습니다. 대시보드로 이동합니다.
        </button>
      </div>
    </div>
  );
}
