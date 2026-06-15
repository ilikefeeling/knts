"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
import {
  getAllRecords,
  updateRecordFields,
  deleteRecord,
  type LedgerRecord,
} from "@/lib/ledgerDB";
import {
  addLog,
  getLogsByRecord,
  actionLabel,
  formatTimestamp,
  type AuditLog,
} from "@/lib/auditLog";
import { CHANGE_REASON_CATEGORIES, VISIT_TIME_OPTIONS, RESULT_OPTIONS } from "@/lib/constants";
import SmsComposer from "@/components/SmsComposer";
import * as XLSX from "xlsx";

type ModalType = "edit" | "history" | "sms" | "photo" | null;

export default function LedgerPage() {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("전체");
  const [viewMode, setViewMode] = useState<"card" | "sheet">("card");

  // 모달 상태
  const [modal, setModal] = useState<ModalType>(null);
  const [activeRecord, setActiveRecord] = useState<LedgerRecord | null>(null);

  // 수정 모달 상태
  const [editReasonCat, setEditReasonCat] = useState(CHANGE_REASON_CATEGORIES[0]);
  const [editReasonDetail, setEditReasonDetail] = useState("");
  const [editNextDate, setEditNextDate] = useState("");
  const [editNextTime, setEditNextTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // 이력 모달 상태
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      const all = await getAllRecords();
      // 최근 업데이트순
      all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setRecords(all);
    } catch (err) {
      console.error("원장 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q) ||
      (r.debtAmount || "").includes(q) ||
      (r.contact || "").includes(q)
    );
  });

  // ── 통계 ──
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const todayCount = records.filter((r) => r.nextVisitDate === todayStr).length;
  const scheduledCount = records.filter((r) => r.nextVisitDate && r.nextVisitDate > todayStr).length;

  // 그룹화 로직 (방문결과별)
  const groupedRecords = (() => {
    const groups: Record<string, LedgerRecord[]> = {};
    filtered.forEach((r) => {
      let cat = r.lastVisitResult || "미방문";
      
      // 다음 예정일이 오늘 이후(오늘 포함)이면 방문예정 그룹으로 처리 (예약인 경우는 유지)
      if (r.nextVisitDate && r.nextVisitDate >= todayStr && cat !== "예약") {
        cat = "방문예정";
      }

      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });

    const getOrder = (cat: string) => {
      if (cat === "미방문") return -1;
      const idx = RESULT_OPTIONS.indexOf(cat as any);
      return idx !== -1 ? idx : 999;
    };

    let result = Object.keys(groups)
      .sort((a, b) => getOrder(a) - getOrder(b))
      .map((cat) => ({
        category: cat,
        items: groups[cat],
      }));
      
    if (filterCategory !== "전체") {
      result = result.filter(g => g.category === filterCategory);
    }
    
    return result;
  })();

  function handleDownloadExcel() {
    const data = filtered.map((r, idx) => ({
      연번: idx + 1,
      성명: r.name,
      방문결과: r.lastVisitResult || "",
      채무액: r.debtAmount || "",
      주소: r.address,
      연락처: r.contact || "",
      최근방문일: r.lastVisitDate || "",
      누적방문횟수: r.visitCount,
      다음예정일: r.nextVisitDate || "",
      다음예정시간: r.nextVisitTime || "",
      비고: r.notes || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "방문원장");
    XLSX.writeFile(workbook, `방문원장_${todayStr}.xlsx`);
  }

  // ── 수정 모달 열기 ──
  function openEdit(rec: LedgerRecord) {
    setActiveRecord(rec);
    setEditReasonCat(CHANGE_REASON_CATEGORIES[0]);
    setEditReasonDetail("");
    setEditNextDate(rec.nextVisitDate || "");
    setEditNextTime(rec.nextVisitTime || "");
    setEditNotes(rec.notes || "");
    setModal("edit");
  }

  // ── 수정 저장 ──
  async function handleEditSave() {
    if (!activeRecord) return;
    if (!editReasonDetail.trim()) {
      alert("변경 사유 상세를 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const changes: Partial<LedgerRecord> = {};
      if (editNextDate !== (activeRecord.nextVisitDate || "")) {
        changes.nextVisitDate = editNextDate || null;
      }
      if (editNextTime !== (activeRecord.nextVisitTime || "")) {
        changes.nextVisitTime = editNextTime || null;
      }

      const result = await updateRecordFields(activeRecord.id, changes);
      if (result) {
        await addLog({
          recordId: activeRecord.id,
          recordName: activeRecord.name,
          action: "RECORD_MODIFIED",
          before: result.before,
          after: result.after,
          reason: editReasonDetail,
          reasonCategory: editReasonCat,
        });
      }

      setModal(null);
      loadRecords();
    } catch (err) {
      console.error("수정 실패:", err);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ── 개별 삭제 ──
  async function handleDelete(rec: LedgerRecord) {
    if (!confirm(`정말로 '${rec.name}'님의 기록을 완전히 삭제하시겠습니까?\n(주의: 기존 방문 이력까지 모두 사라집니다)`)) {
      return;
    }
    try {
      await deleteRecord(rec.id);
      alert("삭제되었습니다.");
      loadRecords();
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  // ── 이력 모달 열기 ──
  async function openHistory(rec: LedgerRecord) {
    setActiveRecord(rec);
    setModal("history");
    setLogsLoading(true);
    try {
      const recLogs = await getLogsByRecord(rec.id);
      setLogs(recLogs);
    } catch (err) {
      console.error("이력 로드 실패:", err);
    } finally {
      setLogsLoading(false);
    }
  }

  // ── SMS 모달 열기 ──
  function openSms(rec: LedgerRecord) {
    setActiveRecord(rec);
    setModal("sms");
  }

  return (
    <div>
      {/* ── 헤더 ── */}
      <div className="ledger-header">
        <h1>📋 방문 종합 관리</h1>
      </div>

      {/* ── 통계 ── */}
      <div className="ledger-stats">
        <div className="ledger-stat">
          <div className="ledger-stat-num">{records.length}</div>
          <div className="ledger-stat-label">전체</div>
        </div>
        <div className="ledger-stat">
          <div className="ledger-stat-num">{todayCount}</div>
          <div className="ledger-stat-label">오늘 방문</div>
        </div>
        <div className="ledger-stat">
          <div className="ledger-stat-num">{scheduledCount}</div>
          <div className="ledger-stat-label">예정</div>
        </div>
      </div>

      {/* ── 검색 및 뷰 토글 ── */}
      <div className="ledger-controls">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ 
              flex: '0 0 auto', 
              padding: '0 5px', 
              borderRadius: 'var(--radius)', 
              border: '1px solid var(--color-border)', 
              backgroundColor: 'var(--color-bg)', 
              color: 'var(--color-text)', 
              height: '46px', 
              fontSize: '14px' 
            }}
          >
            <option value="전체">상태 전체</option>
            <option value="미방문">미방문</option>
            {RESULT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="ledger-search" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <input
              type="text"
              placeholder="성명, 주소, 연락처로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ height: '46px' }}
            />
          </div>
        </div>
        <div className="ledger-view-toggle">
          <button
            className={`btn-sm ${viewMode === "card" ? "active" : ""}`}
            onClick={() => setViewMode("card")}
          >
            💳 카드형
          </button>
          <button
            className={`btn-sm ${viewMode === "sheet" ? "active" : ""}`}
            onClick={() => setViewMode("sheet")}
          >
            📊 시트형
          </button>
          <button
            className="btn-sm"
            onClick={handleDownloadExcel}
            title="현재 목록을 엑셀로 다운로드"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", marginLeft: "4px" }}
          >
            💾 다운로드
          </button>
        </div>
      </div>

      {/* ── 목록 ── */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
          <p className="empty-state-text">원장 로드 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="empty-state-text">
            {search ? "검색 결과가 없습니다." : "원장이 비어 있습니다.\n홈에서 엑셀 명단을 업로드해주세요."}
          </p>
        </div>
      ) : viewMode === "card" ? (
        <div className="ledger-groups">
          {groupedRecords.map((group) => (
            <div key={group.category} className="ledger-group">
              <h3 className="ledger-group-title">
                {group.category} <span className="ledger-group-count">{group.items.length}</span>
              </h3>
              {group.items.map((r) => (
                <div key={r.id} className="ledger-card">
                  <div className="ledger-card-top">
                    <span className="ledger-card-name">{r.name}</span>
                    {r.lastVisitResult && (
                      <span className="badge-visit-count">{r.lastVisitResult}</span>
                    )}
                    {r.debtAmount && (
                      <span className="ledger-card-debt">{r.debtAmount}</span>
                    )}
                  </div>
                  <div className="ledger-card-info">
                    {r.address}
                    {r.contact && <> · {r.contact}</>}
                    <br />
                    {r.lastVisitDate ? (
                      <>최근 방문: {r.lastVisitDate} · {r.visitCount}회</>
                    ) : (
                      <>방문 이력 없음</>
                    )}
                    {r.nextVisitDate && (
                      <>
                        {" · "}다음 예정: {r.nextVisitDate}
                        {r.nextVisitTime && ` ${r.nextVisitTime}`}
                      </>
                    )}
                  </div>
                  <div className="ledger-card-actions">
                    {r.lastVisitPhotos && r.lastVisitPhotos.length > 0 && (
                      <button className="btn-sm" onClick={() => { setActiveRecord(r); setModal("photo"); }}>📸 사진</button>
                    )}
                    {r.contact && (
                      <button className="btn-sm" onClick={() => openSms(r)}>📱 문자</button>
                    )}
                    <button className="btn-sm" onClick={() => openEdit(r)}>📝 수정</button>
                    <button className="btn-sm" onClick={() => openHistory(r)}>📋 이력</button>
                    <button className="btn-sm" onClick={() => handleDelete(r)} style={{ color: '#e74c3c', borderColor: '#fadbd8' }}>🗑️ 삭제</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="ledger-sheet-wrap">
          <table className="ledger-sheet">
            <thead>
              <tr>
                <th>성명</th>
                <th>방문결과</th>
                <th>채무액</th>
                <th>주소</th>
                <th>연락처</th>
                <th>최근 방문</th>
                <th>다음 예정</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {groupedRecords.map((group) => (
                <Fragment key={group.category}>
                  <tr className="ledger-group-row">
                    <td colSpan={8}>
                      {group.category} <span className="ledger-group-count">{group.items.length}</span>
                    </td>
                  </tr>
                  {group.items.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-bold">{r.name}</td>
                      <td>{r.lastVisitResult || "-"}</td>
                      <td className="text-danger fw-bold">{r.debtAmount || "-"}</td>
                      <td className="truncate-text" title={r.address}>{r.address}</td>
                      <td>{r.contact || "-"}</td>
                      <td>{r.lastVisitDate ? `${r.lastVisitDate} (${r.visitCount}회)` : "-"}</td>
                      <td>{r.nextVisitDate ? `${r.nextVisitDate} ${r.nextVisitTime || ""}` : "-"}</td>
                      <td>
                        <div className="ledger-sheet-actions">
                          {r.lastVisitPhotos && r.lastVisitPhotos.length > 0 && (
                            <button className="btn-icon" title="사진" onClick={() => { setActiveRecord(r); setModal("photo"); }}>📸</button>
                          )}
                          {r.contact && (
                            <button className="btn-icon" title="문자" onClick={() => openSms(r)}>📱</button>
                          )}
                          <button className="btn-icon" title="수정" onClick={() => openEdit(r)}>📝</button>
                          <button className="btn-icon" title="이력" onClick={() => openHistory(r)}>📋</button>
                          <button className="btn-icon" title="삭제" onClick={() => handleDelete(r)} style={{ color: '#e74c3c' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 수정 모달 ── */}
      {modal === "edit" && activeRecord && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📝 수정 — {activeRecord.name}</h3>

            <div className="edit-field">
              <label>다음 방문 예정일</label>
              <input
                type="date"
                value={editNextDate}
                onChange={(e) => setEditNextDate(e.target.value)}
              />
            </div>

            <div className="edit-field">
              <label>다음 방문 예정 시간</label>
              <select
                value={editNextTime}
                onChange={(e) => setEditNextTime(e.target.value)}
              >
                <option value="">미정</option>
                {VISIT_TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <hr style={{ margin: "1.5rem 0 1rem", border: 0, borderTop: "1px solid var(--color-border)" }} />
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--color-text)" }}>이력 기록용 사유 (필수)</h4>

            <div className="edit-field">
              <label>변경 사유 분류</label>
              <select
                value={editReasonCat}
                onChange={(e) => setEditReasonCat(e.target.value as typeof editReasonCat)}
              >
                {CHANGE_REASON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="edit-field">
              <label>변경 사유 상세</label>
              <textarea
                rows={2}
                value={editReasonDetail}
                onChange={(e) => setEditReasonDetail(e.target.value)}
                placeholder="무엇을 왜 변경했는지 간단히 입력하세요 (예: 연락처 변경요청)"
              />
            </div>

            <div className="edit-actions">
              <button className="btn-cancel" onClick={() => setModal(null)}>취소</button>
              <button
                className="btn-primary"
                onClick={handleEditSave}
                disabled={saving || !editReasonDetail.trim()}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이력 모달 ── */}
      {modal === "history" && activeRecord && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📋 변경이력 — {activeRecord.name}</h3>

            {logsLoading ? (
              <div className="empty-state" style={{ padding: "1rem" }}>
                <div className="spinner" />
              </div>
            ) : logs.length === 0 ? (
              <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                이력이 없습니다.
              </p>
            ) : (
              <ul className="audit-timeline">
                {logs.map((log) => (
                  <li
                    key={log.logId}
                    className="audit-item"
                    data-action={log.action}
                  >
                    <div className="audit-time">{formatTimestamp(log.timestamp)}</div>
                    <div className="audit-action">{actionLabel(log.action)}</div>
                    {log.reason && (
                      <div className="audit-detail">
                        {log.reasonCategory && <>{log.reasonCategory}: </>}
                        {log.reason}
                      </div>
                    )}
                    {log.action === "RECORD_MODIFIED" && log.before && (
                      <div className="audit-change">
                        {Object.keys(log.after).map((key) => {
                          const bVal = (log.before as Record<string, unknown>)?.[key];
                          const aVal = (log.after as Record<string, unknown>)[key];
                          if (
                            key === "updatedAt" ||
                            key === "id" ||
                            key === "createdAt" ||
                            JSON.stringify(bVal) === JSON.stringify(aVal)
                          )
                            return null;
                          return (
                            <div key={key}>
                              {key}: {String(bVal ?? "(없음)")} → {String(aVal ?? "(없음)")}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {log.action === "SMS_SENT" && log.after && (
                      <div className="audit-change">
                        수신: {String((log.after as Record<string, unknown>).to || "")}<br />
                        내용: {String((log.after as Record<string, unknown>).body || "")}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: "1rem" }}>
              <button className="btn-primary" onClick={() => setModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS 모달 ── */}
      {modal === "sms" && activeRecord && (
        <SmsComposer
          record={activeRecord}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── 사진 모달 ── */}
      {modal === "photo" && activeRecord && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📸 현장 사진 — {activeRecord.name}</h3>
            <div className="ledger-photo-grid">
              {activeRecord.lastVisitPhotos?.map((src, idx) => (
                <div key={idx} style={{ marginBottom: 16, textAlign: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`현장 사진 ${idx + 1}`} style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid var(--color-border)" }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem", textAlign: "right" }}>
              <button className="btn-primary" onClick={() => setModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
