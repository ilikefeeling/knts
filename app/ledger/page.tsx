"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllRecords,
  updateRecordFields,
  type LedgerRecord,
} from "@/lib/ledgerDB";
import {
  addLog,
  getLogsByRecord,
  actionLabel,
  formatTimestamp,
  type AuditLog,
} from "@/lib/auditLog";
import { CHANGE_REASON_CATEGORIES, VISIT_TIME_OPTIONS } from "@/lib/constants";
import SmsComposer from "@/components/SmsComposer";

type ModalType = "edit" | "history" | "sms" | null;

export default function LedgerPage() {
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      if (editNotes !== (activeRecord.notes || "")) {
        changes.notes = editNotes;
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

      {/* ── 검색 ── */}
      <div className="ledger-search">
        <input
          type="text"
          placeholder="성명, 주소, 연락처로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
      ) : (
        filtered.map((r) => (
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
              {r.contact && (
                <button className="btn-sm" onClick={() => openSms(r)}>📱 문자</button>
              )}
              <button className="btn-sm" onClick={() => openEdit(r)}>📝 수정</button>
              <button className="btn-sm" onClick={() => openHistory(r)}>📋 이력</button>
            </div>
          </div>
        ))
      )}

      {/* ── 수정 모달 ── */}
      {modal === "edit" && activeRecord && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📝 수정 — {activeRecord.name}</h3>

            <div className="edit-field">
              <label>변경 사유 <span className="required">*</span></label>
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
              <label>사유 상세 <span className="required">*</span></label>
              <textarea
                rows={2}
                value={editReasonDetail}
                onChange={(e) => setEditReasonDetail(e.target.value)}
                placeholder="변경 사유를 입력하세요 (필수)"
              />
            </div>

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

            <div className="edit-field">
              <label>비고</label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
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
    </div>
  );
}
