"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InstallPrompt from "@/components/InstallPrompt";
import ExcelUploader from "@/components/ExcelUploader";
import SmsComposer from "@/components/SmsComposer";
import { getTodayVisitList, type LedgerRecord } from "@/lib/ledgerDB";

export default function Home() {
  const router = useRouter();
  const [visits, setVisits] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<LedgerRecord | null>(null);
  const [testText, setTestText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [smsTarget, setSmsTarget] = useState<LedgerRecord | null>(null);

  const loadVisits = useCallback(async () => {
    try {
      const list = await getTodayVisitList();
      setVisits(list);
    } catch (err) {
      console.error("방문명단 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  async function handleTestSubmit() {
    if (!testText.trim() || !modalTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/share-receiver?id=${data.id}`);
      }
    } catch {
      alert("전송 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function openModal(target: LedgerRecord) {
    setModalTarget(target);
    setTestText("");
  }

  return (
    <div>
      <h1>Field-Master (knts)</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: 15 }}>
        국세외수입 체납관리단 실태확인원을 위한 방문 작업 관리 도구
      </p>

      <InstallPrompt />

      {/* ── 엑셀 업로드 ── */}
      <ExcelUploader onComplete={loadVisits} />

      {/* ── 바로가기 ── */}
      <div className="home-links">
        <Link href="/ledger" className="home-link-btn">
          📋 방문 관리
        </Link>
        <Link href="/ios-guide" className="home-link-btn">
          🍎 iOS 안내
        </Link>
      </div>

      {/* ── 오늘의 방문 명단 ── */}
      <div className="section-title">
        <h2>오늘의 방문 명단</h2>
        {visits.length > 0 && (
          <span className="section-count">{visits.length}건</span>
        )}
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
          <p className="empty-state-text">불러오는 중...</p>
        </div>
      ) : visits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-text">
            오늘 예정된 방문이 없습니다.<br />
            엑셀 명단을 업로드하거나,<br />
            방문 관리에서 방문 예정일을 설정해주세요.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 0.5rem" }}>
            📍 예약 건 우선 · 시간순 정렬 &nbsp;|&nbsp; 카드를 눌러 테스트 전송
          </p>
          {visits.map((v, idx) => (
            <div key={v.id} className="visit-card-row">
              <button
                className={"visit-card" + (v.nextVisitTime ? " reserved" : "")}
                style={{ flex: 1 }}
                onClick={() => openModal(v)}
              >
                <div className="visit-card-header">
                  <span className="visit-order">{idx + 1}</span>
                  <span className="visit-name">{v.name}</span>
                  <div className="visit-badges">
                    {v.nextVisitTime && (
                      <span className="badge-reserved">
                        🕐 예약 {v.nextVisitTime}
                      </span>
                    )}
                    <span className="badge-visit-count">
                      {v.visitCount === 0 ? "최초" : `${v.visitCount + 1}회차`}
                    </span>
                  </div>
                </div>
                <div className="visit-addr">{v.address}</div>
              </button>
              {v.contact && (
                <button
                  className="visit-sms-btn"
                  title="문자 발송"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSmsTarget(v);
                  }}
                >
                  📱
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── 사용 방법 ── */}
      <h2>사용 방법</h2>
      <div className="card card-muted">
        <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 15 }}>
          <li style={{ marginBottom: 8 }}>
            상담 후, 클로바노트(또는 음성 변환 앱)에서 녹음 내용을 텍스트로
            변환합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            변환된 텍스트 화면에서 <strong>공유</strong> 버튼을 눌러{" "}
            <strong>Field-Master</strong>를 선택합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            화면에 나오는 안내에 따라 방문 대상자를 선택하면, AI가 방문결과와
            특이사항을 자동으로 정리해줍니다.
          </li>
          <li>내용을 확인하고 저장하면 끝입니다.</li>
        </ol>
      </div>

      {/* ── 테스트 시뮬레이션 모달 ── */}
      {modalTarget && (
        <div className="modal-overlay" onClick={() => setModalTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🧪 테스트: {modalTarget.name}</h2>
            <p>
              클로바노트에서 공유받은 상담 녹취록을 시뮬레이션합니다.
              아래에 녹취록 텍스트를 입력하고 전송하세요.
            </p>
            <textarea
              rows={7}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="상담 녹취 텍스트를 입력하세요..."
              style={{ marginBottom: 0 }}
            />
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setModalTarget(null)}
                style={{ border: "1px solid var(--color-border)" }}
              >
                닫기
              </button>
              <button
                className={
                  "btn btn-primary" +
                  (submitting || !testText.trim() ? " btn-disabled" : "")
                }
                onClick={handleTestSubmit}
                disabled={submitting || !testText.trim()}
              >
                {submitting ? "전송 중..." : "전송하여 테스트 →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS 모달 ── */}
      {smsTarget && (
        <SmsComposer record={smsTarget} onClose={() => setSmsTarget(null)} />
      )}
    </div>
  );
}
