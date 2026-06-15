"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { upsertFromExcel, deleteListForDate, type ExcelRow } from "@/lib/ledgerDB";
import { addLog } from "@/lib/auditLog";

type UploadState = "idle" | "preview" | "uploading" | "done";

type Props = {
  onComplete?: () => void; // 업로드 완료 후 홈 방문명단 새로고침용
  hasVisits?: boolean; // 현재 방문 명단이 있는지 여부
};

export default function ExcelUploader({ onComplete, hasVisits }: Props) {
  const [state, setState] = useState<UploadState>("idle");
  const [rows, setRows] = useState<ExcelRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ created: number; updated: number; deleted?: number } | null>(null);
  const [isOverwrite, setIsOverwrite] = useState(true);
  const [visitDate, setVisitDate] = useState(() => {
    let d = new Date();
    // 만약 클라이언트에서 아직 모듈 로드 전이거나 SSR 에러 방지를 위해 간단히 처리
    try {
      const { isBusinessDay } = require("korean-holidays");
      while (!isBusinessDay(d)) {
        d.setDate(d.getDate() + 1);
      }
    } catch (e) {
      // fallback
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const fileRef = useRef<HTMLInputElement>(null);

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

      // 첫 행이 헤더인지 확인 → 데이터 행만 추출
      const dataRows: ExcelRow[] = [];
      for (let i = 0; i < json.length; i++) {
        const r = json[i] as unknown as unknown[];
        if (!r || r.length < 3) continue;

        const name = String(r[1] || "").trim(); // 성 명
        const address = String(r[4] || "").trim(); // 주 소
        if (!name || !address) continue; // 성명·주소 없으면 건너뜀

        // 첫 행이 헤더("성명", "연번" 등)인 경우 건너뜀
        if (i === 0 && (name.includes("성명") || name.includes("성 명") || name.includes("이름") || String(r[0]).replace(/\s/g, "").includes("연번"))) continue;

        dataRows.push({
          name,
          contact: String(r[5] || "").trim(), // 연락처
          address,
          debtAmount: String(r[3] || "").trim(), // 채무액
          debtPeriod: "", // 체납기간은 원장에 없음
          notes: String(r[10] || "").trim(), // 비고
        });
      }
      setRows(dataRows);
      setState("preview");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    setState("uploading");
    try {
      const res = await upsertFromExcel(rows, visitDate, isOverwrite);

      // 각 건에 대해 Audit Log 생성
      for (const { record, isNew } of res.records) {
        await addLog({
          recordId: record.id,
          recordName: record.name,
          action: isNew ? "RECORD_CREATED" : "RECORD_UPDATED_EXCEL",
          before: null,
          after: { name: record.name, address: record.address, debtAmount: record.debtAmount },
          reason: isNew ? "엑셀 업로드로 등록" : "엑셀 업로드로 갱신",
          reasonCategory: null,
        });
      }

      setResult({ created: res.created, updated: res.updated, deleted: res.deleted });
      setState("done");
      onComplete?.();
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

  const handleDeleteWrongUpload = async () => {
    if (!confirm("오늘 업로드된 명단을 삭제하시겠습니까?\n(과거 방문 이력이 있는 분들은 오늘 방문 일정만 취소됩니다.)")) return;
    
    setState("uploading");
    try {
      const res = await deleteListForDate(visitDate);
      alert(`명단 삭제가 완료되었습니다.\n(완전 삭제: ${res.deleted}건, 방문 일정 취소: ${res.canceled}건)`);
      reset();
      onComplete?.();
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
      setState("idle");
    }
  };

  return (
    <div className="excel-uploader">
      {state === "idle" && (
        <div className="excel-upload-trigger" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!hasVisits && (
            <label 
              className="excel-upload-btn" 
              style={{ width: '100%' }}
              onClick={() => setIsOverwrite(false)}
            >
              ➕ 엑셀 명단 추가하기
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                style={{ display: "none" }}
              />
            </label>
          )}
          
          {hasVisits && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="excel-upload-btn" 
                style={{ width: '100%', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', padding: '12px', borderRadius: '6px', fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}
                onClick={handleDeleteWrongUpload}
              >
                🗑️ 잘못 올린 파일 삭제
              </button>
            </div>
          )}
        </div>
      )}

      {state === "preview" && (
        <div className="excel-preview">
          <div className="excel-preview-header">
            <span>📄 {fileName}</span>
            <span className="excel-count">{rows.length}건</span>
          </div>

          <div className="excel-date-row">
            <label>방문 예정일:</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>



          <div className="excel-table-wrap">
            <table className="excel-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>성명</th>
                  <th>연락처</th>
                  <th>주소</th>
                  <th>체납액</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.contact}</td>
                    <td className="td-address">{r.address}</td>
                    <td>{r.debtAmount}</td>
                  </tr>
                ))}
                {rows.length > 10 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#888" }}>
                      ... 외 {rows.length - 10}건
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="excel-actions">
            <button className="btn-cancel" onClick={reset}>취소</button>
            <button className="btn-primary" onClick={handleUpload}>
              원장에 반영하기 →
            </button>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div className="excel-loading">
          <div className="spinner" />
          <p>원장에 반영 중...</p>
        </div>
      )}

      {state === "done" && result && (
        <div className="excel-result">
          <div className="excel-result-icon">✅</div>
          <p>
            신규 <strong>{result.created}</strong>건 추가, 기존{" "}
            <strong>{result.updated}</strong>건 업데이트
          </p>
          {result.deleted !== undefined && result.deleted > 0 && (
            <p style={{ marginTop: '4px', fontSize: '0.9rem', color: '#dc2626' }}>
              🗑️ 잘못된 명단 <strong>{result.deleted}</strong>건 삭제/정리 완료
            </p>
          )}
          <button className="btn-primary" onClick={reset}>확인</button>
        </div>
      )}
    </div>
  );
}
