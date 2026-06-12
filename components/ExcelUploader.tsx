"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { upsertFromExcel, type ExcelRow } from "@/lib/ledgerDB";
import { addLog } from "@/lib/auditLog";

type UploadState = "idle" | "preview" | "uploading" | "done";

type Props = {
  onComplete?: () => void; // 업로드 완료 후 홈 방문명단 새로고침용
};

export default function ExcelUploader({ onComplete }: Props) {
  const [state, setState] = useState<UploadState>("idle");
  const [rows, setRows] = useState<ExcelRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
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

        const name = String(r[1] || "").trim();
        const address = String(r[3] || "").trim();
        if (!name || !address) continue; // 성명·주소 없으면 건너뜀

        // 첫 행이 헤더("성명", "연번" 등)인 경우 건너뜀
        if (i === 0 && (name === "성명" || name === "이름" || String(r[0]).trim() === "연번" || String(r[0]).trim() === "번호")) continue;

        dataRows.push({
          name,
          contact: String(r[2] || "").trim(),
          address,
          debtAmount: String(r[4] || "").trim(),
          debtPeriod: String(r[5] || "").trim(),
          notes: String(r[6] || "").trim(),
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
      const res = await upsertFromExcel(rows, visitDate);

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

      setResult({ created: res.created, updated: res.updated });
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

  return (
    <div className="excel-uploader">
      {state === "idle" && (
        <div className="excel-upload-trigger">
          <label className="excel-upload-btn">
            📂 엑셀 명단 업로드
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              style={{ display: "none" }}
            />
          </label>
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
          <button className="btn-primary" onClick={reset}>확인</button>
        </div>
      )}
    </div>
  );
}
