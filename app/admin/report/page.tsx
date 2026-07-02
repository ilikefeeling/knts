"use client";

import React, { useEffect, useState } from "react";
import { getVisitRecords } from "@/lib/adminDb";
import { decryptText } from "@/lib/crypto";
import * as XLSX from 'xlsx';
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link";

export default function ReportPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [isDecrypted, setIsDecrypted] = useState(false);

  useEffect(() => {
    // 세션 스토리지에서 PIN을 가져옴
    const savedPin = sessionStorage.getItem("workspace_pin");
    if (savedPin) {
      setPin(savedPin);
    } else {
      window.location.href = "/admin"; // 핀 번호 없으면 대시보드로
    }

    getVisitRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleDecrypt = async () => {
    if (!pin) {
      alert("Workspace PIN을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const decrypted = await Promise.all(records.map(async (r) => {
        return {
          ...r,
          unvisited_reason: await decryptText(r.unvisited_reason, pin),
          worker_memo: await decryptText(r.worker_memo, pin),
          ledger: {
            ...r.ledger,
            name: await decryptText(r.ledger.name, pin),
            address: await decryptText(r.ledger.address, pin),
          }
        };
      }));
      setRecords(decrypted);
      setIsDecrypted(true);
    } catch (e) {
      alert("복호화 실패. PIN을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    const dataToExport = records.map((r, i) => ({
      "No.": records.length - i,
      "체납자명": r.ledger?.name,
      "연락처": r.ledger?.phone,
      "주소": `${r.ledger?.address} ${r.ledger?.detail_address}`,
      "조사결과": r.status === 'COMPLETED' ? "완료" : `미방문(${r.unvisited_reason})`,
      "조사일자": r.scheduled_date,
      "담당실태확인원": r.worker?.name,
      "메모": r.worker_memo
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "현장방문결과");
    XLSX.writeFile(workbook, `현장방문조사_결과보고서_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading && !records.length) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }} className="print-reset">
      <AdminSidebar onTestGuideSuccess={() => window.location.reload()} />

      {/* ── 메인 콘텐츠 ── */}
      <div className="print-main-content" style={{ flex: 1, padding: "32px 40px", overflowY: "auto", position: "relative" }}>
        
        {!isDecrypted ? (
          <div style={{ padding: "40px", maxWidth: "400px", margin: "100px auto", textAlign: "center", background: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
            <h2 style={{ color: "#0f172a", marginBottom: "8px", fontSize: "24px", fontWeight: "bold" }}>보고서 출력 모듈 (복호화)</h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px", lineHeight: "1.5" }}>
              관공서 제출용 보고서를 생성하려면 Workspace PIN을 입력하여 데이터를 복호화해야 합니다.
            </p>
            <input
              type="password"
              placeholder="Workspace PIN 입력"
              style={{ width: "100%", padding: "12px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center", letterSpacing: "4px" }}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <button
              onClick={handleDecrypt}
              disabled={loading}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#2563eb", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginBottom: "16px" }}
            >
              {loading ? "복호화 중..." : "데이터 복호화 및 보고서 생성"}
            </button>

              <button
                onClick={() => window.location.href = '/admin'}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}
              >
                취소
              </button>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            {/* 툴바 (인쇄 시 숨김) */}
            <div className="hide-on-print" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
              <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>관공서 제출용 현장 조사 보고서</h1>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={handleExcelExport}
                  style={{ padding: "8px 16px", background: "#16a34a", color: "white", borderRadius: "6px", border: "none", fontSize: "14px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <svg style={{width: "16px", height: "16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  엑셀 다운로드
                </button>
                <button 
                  onClick={handlePrint}
                  style={{ padding: "8px 16px", background: "#2563eb", color: "white", borderRadius: "6px", border: "none", fontSize: "14px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <svg style={{width: "16px", height: "16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  사진대지 인쇄 (PDF 저장)
                </button>
              </div>
            </div>

            {/* 인쇄 영역 */}
            <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }} className="print-content">
              
              {/* 표지 / 요약 */}
              <div className="print-break-after" style={{ marginBottom: "48px", textAlign: "center" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "16px", color: "#0f172a", marginTop: 0 }}>현장 방문 조사 보고서</h1>
                <p style={{ color: "#64748b", marginBottom: "32px" }}>출력일시: {new Date().toLocaleString('ko-KR')}</p>
                
                <table style={{ width: "100%", maxWidth: "600px", margin: "0 auto", borderCollapse: "collapse", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  <tbody>
                    <tr>
                      <th style={{ border: "1px solid #cbd5e1", padding: "12px", background: "#f8fafc", width: "33%", color: "#334155" }}>총 조사 건수</th>
                      <td style={{ border: "1px solid #cbd5e1", padding: "12px", color: "#0f172a" }}>{records.length} 건</td>
                    </tr>
                    <tr>
                      <th style={{ border: "1px solid #cbd5e1", padding: "12px", background: "#f8fafc", color: "#334155" }}>조사 완료</th>
                      <td style={{ border: "1px solid #cbd5e1", padding: "12px", color: "#0f172a" }}>{records.filter(r => r.status === 'COMPLETED').length} 건</td>
                    </tr>
                    <tr>
                      <th style={{ border: "1px solid #cbd5e1", padding: "12px", background: "#f8fafc", color: "#334155" }}>미방문/실패</th>
                      <td style={{ border: "1px solid #cbd5e1", padding: "12px", color: "#0f172a" }}>{records.filter(r => r.status === 'UNVISITED').length} 건</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 상세 사진대지 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
                {records.map((r, i) => (
                  <div key={r.id} className="print-break-inside-avoid print-no-border" style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }} className="print-border-black">
                      <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>No. {records.length - i} - {r.ledger?.name || "알 수 없음"}</h2>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>조사일자: {r.scheduled_date}</span>
                    </div>
                    
                    <div style={{ display: "flex", gap: "24px", flexDirection: "row" }} className="print-flex-row">
                      <div style={{ flex: 1 }}>
                        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <th style={{ padding: "12px 0", textAlign: "left", color: "#475569", width: "100px" }}>조사 결과</th>
                              <td style={{ padding: "12px 0", fontWeight: "bold" }}>
                                {r.status === 'COMPLETED' ? 
                                  <span style={{ color: "#16a34a" }}>방문 완료</span> : 
                                  <span style={{ color: "#dc2626" }}>미방문 ({r.unvisited_reason})</span>
                                }
                              </td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <th style={{ padding: "12px 0", textAlign: "left", color: "#475569" }}>주소</th>
                              <td style={{ padding: "12px 0", color: "#0f172a" }}>{r.ledger?.address} {r.ledger?.detail_address}</td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <th style={{ padding: "12px 0", textAlign: "left", color: "#475569" }}>담당 실태확인원</th>
                              <td style={{ padding: "12px 0", color: "#0f172a" }}>{r.worker?.name} ({r.worker?.phone})</td>
                            </tr>
                            <tr>
                              <th style={{ padding: "12px 0", textAlign: "left", color: "#475569", verticalAlign: "top" }}>조사 메모</th>
                              <td style={{ padding: "12px 0", whiteSpace: "pre-wrap", color: "#0f172a" }}>{r.worker_memo || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ flex: 1, border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "4px", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }} className="print-border-gray">
                        {r.photos && r.photos.length > 0 ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
                            {r.photos.slice(0, 4).map((p: string, idx: number) => (
                              <img key={idx} src={p} alt={`현장사진 ${idx+1}`} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "14px" }}>첨부된 현장 사진이 없습니다.</span>
                        )}
                        {r.photos?.length > 4 && (
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "12px", textAlign: "center" }}>
                            * 사진이 4장을 초과하여 일부만 표시됩니다.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
