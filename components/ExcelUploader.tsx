"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { upsertLedgerFromExcel, type AdminExcelRow } from "@/lib/adminDb";
import { addLog } from "@/lib/auditLog";

type UploadState = "idle" | "preview" | "uploading" | "done";

type Props = {
  campaignId?: string; // 캠페인(업무 폴더) ID
  onComplete?: () => void;
  hasVisits?: boolean;
};

export default function ExcelUploader({ campaignId, onComplete, hasVisits }: Props) {
  const [state, setState] = useState<UploadState>("idle");
  const [rows, setRows] = useState<AdminExcelRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ masterCount: number; taskCount: number; } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadSampleExcel = () => {
    // 16개 확정 컬럼
    const headers = [
      "고유관리번호(필수)", "체납자구분(개인/법인)", "체납자명(필수)", "주민/법인번호",
      "연락처", "관할구역", "주민등록상 주소", "실거주지 주소(필수)",
      "부과기관", "체납세목", "총체납액", "최초납기일",
      "체납건수", "재산압류내역", "독촉장발송여부", "분납진행여부", "비고(메모)"
    ];
    const sampleData = [
      ["M2026-0001", "개인", "홍길동", "800101-1******", "010-1234-5678", "마포구 서교동", "서울 마포구 서교동 123", "서울 마포구 서교동 123 101호", "마포구청 교통과", "주정차위반과태료", "150000", "2025-01-15", "3", "예금압류", "발송", "해당없음", "현장 방문 시 주의요망"],
      ["M2026-0002", "법인", "주식회사 가나다", "110111-*******", "02-123-4567", "강남구 역삼동", "서울 강남구 테헤란로 1", "서울 강남구 테헤란로 1 빌딩 2층", "강남구청 환경과", "환경개선부담금", "300000", "2025-02-10", "1", "부동산압류", "미발송", "분납중", ""]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "체납자원장_샘플");
    XLSX.writeFile(wb, "체납관리단_실태확인원_데이터양식(샘플).xlsx");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1 });

      const dataRows: AdminExcelRow[] = [];
      for (let i = 1; i < json.length; i++) { // 첫 행은 헤더이므로 스킵
        const r = json[i] as any;
        if (!r || r.length < 3) continue;

        const mgmtNum = String(r[0] || "").trim();
        const name = String(r[2] || "").trim();
        const actualAddress = String(r[7] || "").trim();
        
        if (!mgmtNum || !name) continue; // 필수값 없으면 스킵

        dataRows.push({
          management_num: mgmtNum,
          taxpayer_type: String(r[1] || "").trim(),
          name: name,
          id_number: String(r[3] || "").trim(),
          phone: String(r[4] || "").trim(),
          jurisdiction: String(r[5] || "").trim(),
          address: String(r[6] || "").trim(),
          detail_address: actualAddress,
          department: String(r[8] || "").trim(),
          tax_item: String(r[9] || "").trim(),
          arrears_amount: String(r[10] || "").trim(),
          occurred_date: String(r[11] || "").trim(),
          arrears_count: String(r[12] || "").trim(),
          seizure_details: String(r[13] || "").trim(),
          notice_sent: String(r[14] || "").trim(),
          installment_status: String(r[15] || "").trim(),
          memo: String(r[16] || "").trim(),
        });
      }
      setRows(dataRows);
      setState("preview");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!campaignId) return alert("선택된 방문 배정 그룹이 없습니다.");
    
    setState("uploading");
    try {
      const res = await upsertLedgerFromExcel(campaignId, rows);

      if (res.success) {
        setResult({ masterCount: res.masterCount, taskCount: res.taskCount });
        setState("done");
        
        // Audit 로그 남기기
        await addLog({
          recordId: campaignId,
          recordName: fileName,
          action: "EXCEL_UPLOAD" as any,
          before: null,
          after: { rows: rows.length, master: res.masterCount, task: res.taskCount },
          reason: "방문 배정 그룹에 엑셀 데이터 업로드",
          reasonCategory: null,
        });

        onComplete?.();
      } else {
        alert("업로드 중 오류가 발생했습니다: " + res.message);
        setState("preview");
      }
    } catch (err) {
      console.error("업로드 실패:", err);
      alert("업로드 중 오류가 발생했습니다.");
      setState("preview");
    }
  };

  const reset = () => {
    setState("idle");
    setRows([]);
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="excel-uploader">
      {state === "idle" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              className="excel-upload-btn" 
              style={{ flex: 1, background: "#1e293b", color: "#38bdf8", border: "1px solid #38bdf8", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
              onClick={downloadSampleExcel}
            >
              📥 양식 다운로드 (16개 항목)
            </button>

            <label 
              className="excel-upload-btn" 
              style={{ flex: 1, background: "#3b82f6", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", textAlign: "center" }}
            >
              📤 엑셀 파일 업로드
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>
      )}

      {state === "preview" && (
        <div className="excel-preview">
          <div className="excel-preview-header" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "white", fontWeight: "bold" }}>📄 {fileName}</span>
            <span style={{ background: "#3b82f6", color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "14px" }}>유효 데이터: {rows.length}건</span>
          </div>

          <div style={{ overflowX: "auto", border: "1px solid #334155", borderRadius: "8px", marginBottom: "16px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#cbd5e1", fontSize: "14px", whiteSpace: "nowrap" }}>
              <thead style={{ background: "#0f172a" }}>
                <tr>
                  <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>관리번호</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>구분</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>체납자명</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>부과기관</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>총체납액</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>실거주지</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "8px", textAlign: "center" }}>{r.management_num}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>{r.taxpayer_type}</td>
                    <td style={{ padding: "8px", fontWeight: "bold", color: "white" }}>{r.name}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>{r.department}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "#f87171" }}>{r.arrears_amount}</td>
                    <td style={{ padding: "8px", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>{r.detail_address}</td>
                  </tr>
                ))}
                {rows.length > 10 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "12px", color: "#94a3b8" }}>
                      ... 외 {rows.length - 10}건
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={reset} style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "transparent", color: "#cbd5e1", border: "1px solid #334155", cursor: "pointer" }}>취소</button>
            <button onClick={handleUpload} style={{ flex: 2, padding: "12px", borderRadius: "8px", background: "#3b82f6", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}>
              DB 병합 및 배정 생성하기 →
            </button>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div style={{ textAlign: "center", padding: "32px", color: "#38bdf8" }}>
          <div className="spinner" style={{ marginBottom: "16px" }} />
          <p>원장에 병합하며 배정 명단을 생성 중입니다...</p>
        </div>
      )}

      {state === "done" && result && (
        <div style={{ textAlign: "center", padding: "24px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", border: "1px solid #10b981" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>✅</div>
          <h3 style={{ color: "white", margin: "0 0 12px 0" }}>업로드 성공!</h3>
          <p style={{ color: "#cbd5e1", margin: "0 0 4px 0" }}>처리된 원장(Master): <strong>{result.masterCount}</strong>건</p>
          <p style={{ color: "#cbd5e1", margin: "0 0 16px 0" }}>할당된 체납건(Task): <strong>{result.taskCount}</strong>건</p>
          <button onClick={reset} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#10b981", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}>확인</button>
        </div>
      )}
    </div>
  );
}
