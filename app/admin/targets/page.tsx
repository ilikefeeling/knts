"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getMasterLedgers, setMasterLedgerIntensive, MasterLedger } from "@/lib/adminDb";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import ExcelUploader from "@/components/ExcelUploader";

export default function TargetsPage() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<MasterLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showUploadWizard, setShowUploadWizard] = useState(false);

  useEffect(() => {
    const savedPin = sessionStorage.getItem("workspace_pin");
    if (!savedPin) {
      router.push("/admin");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMasterLedgers();
      setLedgers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredLedgers = useMemo(() => {
    if (!search) return ledgers;
    const lowerSearch = search.toLowerCase();
    return ledgers.filter(l => 
      l.name?.toLowerCase().includes(lowerSearch) ||
      l.phone?.includes(lowerSearch) ||
      l.address?.toLowerCase().includes(lowerSearch)
    );
  }, [ledgers, search]);

  const handleIntensive = async () => {
    if (selectedIds.length === 0) return alert("집중관리 대상으로 지정할 체납자를 선택하세요.");
    if (!confirm(`선택한 ${selectedIds.length}명의 원장 데이터를 집중관리(우선배정) 대상으로 지정하시겠습니까?\n이들은 악성 체납자로 분류되어 향후 방문 배정 시 납부 독촉을 위한 집중 배정 대상이 됩니다.`)) return;
    
    setLoading(true);
    const success = await setMasterLedgerIntensive(selectedIds);
    if (success) {
      alert("집중관리 대상으로 지정되었습니다.");
      setSelectedIds([]);
      loadData();
    } else {
      alert("처리 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Pretendard', sans-serif" }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "28px", margin: "0 0 8px 0" }}>체납자 원장</h1>
            <p style={{ color: "#94a3b8", margin: 0 }}>전체 체납자 풀(Pool)을 검색하고 체납액 감축을 위해 악성 체납자를 '집중관리대상'으로 지정합니다.</p>
          </div>
        </div>
        <div style={{ background: "#1e293b", borderRadius: "16px", padding: "24px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "12px", flex: 1, maxWidth: "400px" }}>
              <input 
                type="text" 
                placeholder="이름, 연락처, 주소 검색" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "white", fontSize: "16px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={handleIntensive}
                style={{ padding: "10px 16px", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}
              >
                🚨 선택 집중관리 지정
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #334155" }}>
                  <th style={{ padding: "12px", textAlign: "left", width: "40px" }}>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(filteredLedgers.map(l => l.id));
                        else setSelectedIds([]);
                      }}
                      checked={selectedIds.length > 0 && selectedIds.length === filteredLedgers.length}
                    />
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>관리번호</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>성명/법인명</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>연락처</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>주소</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>총체납액</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>관리상태</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>등록일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>로딩 중...</td>
                  </tr>
                ) : filteredLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>등록된 체납자 원장이 없습니다. 상단 [📥 엑셀 명단 대량 등록] 버튼으로 체납자 엑셀을 등록하세요.</td>
                  </tr>
                ) : (
                  filteredLedgers.map(ledger => (
                    <tr key={ledger.id} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "12px" }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(ledger.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, ledger.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== ledger.id));
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{ledger.management_num || "-"}</td>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>{ledger.name}</td>
                      <td style={{ padding: "12px", color: "#cbd5e1" }}>{ledger.phone || "-"}</td>
                      <td style={{ padding: "12px", color: "#cbd5e1", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ledger.address} {ledger.detail_address}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#f87171", fontWeight: "bold" }}>
                        {Number(ledger.arrears_amount || 0).toLocaleString()}원
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {ledger.is_intensive ? (
                          <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>🚨 집중관리대상</span>
                        ) : (
                          <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", background: "rgba(16, 185, 129, 0.2)", color: "#10b981" }}>일반</span>
                        )}
                      </td>
                      <td style={{ padding: "12px", color: "#94a3b8" }}>{new Date(ledger.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 엑셀 업로드 모달 */}
      {showUploadWizard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1e293b", padding: "32px", borderRadius: "16px", maxWidth: "600px", width: "100%", border: "1px solid #334155" }}>
            <h2 style={{ color: "white", margin: "0 0 16px 0" }}>체납자 원장 엑셀 명단 대량 등록</h2>
            <p style={{ color: "#cbd5e1", marginBottom: "24px" }}>
              실제 체납자 엑셀 파일(.xlsx)을 업로드하면 <strong>자동 중복 검사(Deduplication) 및 암호화</strong>를 통해 체납자 원장 DB에 등록됩니다.
            </p>
            <ExcelUploader 
              onComplete={() => {
                setShowUploadWizard(false);
                loadData();
              }} 
            />
            <button 
              onClick={() => setShowUploadWizard(false)} 
              style={{ marginTop: "16px", padding: "10px 16px", width: "100%", borderRadius: "8px", background: "transparent", color: "#cbd5e1", border: "1px solid #334155", cursor: "pointer" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
