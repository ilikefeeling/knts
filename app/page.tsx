"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InstallPrompt from "@/components/InstallPrompt";
import ExcelUploader from "@/components/ExcelUploader";
import SmsComposer from "@/components/SmsComposer";
import { getTodayVisitList, type LedgerRecord } from "@/lib/ledgerDB";
import { isBusinessDay } from "korean-holidays";

export default function Home() {
  const router = useRouter();
  const [visits, setVisits] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<LedgerRecord | null>(null);
  const [testText, setTestText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [smsTarget, setSmsTarget] = useState<LedgerRecord | null>(null);
  const [todayStr, setTodayStr] = useState("");
  const [isHolidayToday, setIsHolidayToday] = useState(false);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const loadVisits = useCallback(async () => {
    try {
      let targetDate = new Date();
      if (!isBusinessDay(targetDate)) {
        setIsHolidayToday(true);
        while (!isBusinessDay(targetDate)) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
      } else {
        setIsHolidayToday(false);
      }

      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const dayOfWeek = days[targetDate.getDay()];
      
      if (!isBusinessDay(new Date())) {
        setTodayStr(`[다음 근무일] ${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일 (${dayOfWeek}) `);
      } else {
        setTodayStr(`${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일 (${dayOfWeek}) `);
      }

      const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;
      const list = await getTodayVisitList(targetDateStr);
      setVisits(list);
    } catch (err) {
      console.error("방문명단 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingItems = useCallback(async () => {
    try {
      const res = await fetch("/api/share/pending");
      const data = await res.json();
      if (data.pending) {
        setPendingItems(data.pending);
      }
    } catch (err) {
      console.error("미정리 항목 로드 실패:", err);
    }
  }, []);

  async function handleDeletePendingItem(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("이 상담 내용을 목록에서 완전히 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)")) return;
    try {
      await fetch(`/api/share?id=${id}`, { method: "DELETE" });
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
      if (pendingItems.length <= 1) {
        setShowPendingModal(false);
      }
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  useEffect(() => {
    loadVisits();
    loadPendingItems();
  }, [loadVisits, loadPendingItems]);

  async function handleTestSubmit() {
    if (!testText.trim() || !modalTarget) return;
    setSubmitting(true);
    
    // 테스트 전송 시에도 임시 저장 (테스트 편의성)
    localStorage.setItem("last_active_target_id", modalTarget.id);
    localStorage.setItem("last_active_time", Date.now().toString());

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
      <h1 style={{ marginBottom: "0.5rem" }}>
        FM
      </h1>
      <p style={{ color: "var(--color-text)", fontSize: "18px", fontWeight: "700", fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", letterSpacing: "-0.5px", wordBreak: "keep-all", marginBottom: "1.5rem" }}>
        국세외수입 체납관리단 실태확인원 업무 관리 도구
      </p>

      <InstallPrompt />

      {/* ── 백그라운드 수신함 배너 ── */}
      {pendingItems.length > 0 && (
        <div
          className="card"
          style={{
            background: "var(--color-primary-bg)",
            border: "1px solid var(--color-primary)",
            marginBottom: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>
            📥 클로바노트에서 전송된 미정리 상담 내용이 {pendingItems.length}건 있습니다.
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowPendingModal(true)}
          >
            정리하러 가기 →
          </button>
        </div>
      )}

      {/* ── 엑셀 업로드 ── */}
      <ExcelUploader onComplete={loadVisits} hasVisits={visits.length > 0} />
      <a
        href="/templates/visit-list-template.xlsx"
        download="방문명단_샘플양식.xlsx"
        className="btn btn-ghost"
        style={{
          justifyContent: "center",
          border: "1px solid var(--color-border)",
          marginTop: "-4px",
        }}
      >
        📥 방문명단 샘플 엑셀 양식 다운로드
      </a>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-text-muted)",
          margin: "4px 0 0",
        }}
      >
        명단 양식이 따로 없으신가요? 샘플 양식을 받아 1행은 그대로 두고
        2행부터 채워서 업로드하면 됩니다.
      </p>

      {/* ── 바로가기 ── */}
      <div className="home-links">
        <Link href="/ledger" className="home-link-btn btn-visit">
          방문 관리
        </Link>
        <Link href="/guide" className="home-link-btn btn-guide">
          사용 설명
        </Link>
        <Link href="/pricing" className="home-link-btn btn-pricing">
          요금제
        </Link>
        <Link href="/ios-guide" className="home-link-btn btn-ios">
          iPhone
        </Link>
      </div>

      {/* ── 오늘의 방문 명단 ── */}
      <div className="section-title">
        <h2>{todayStr}오늘의 방문 명단</h2>
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
          <div className="empty-state-icon">{isHolidayToday ? "🏖️" : "📋"}</div>
          <p className="empty-state-text">
            {isHolidayToday ? (
              <>주말 및 공휴일에는 방문 명단이 생성되지 않습니다.<br />다음 근무일에도 예정된 방문이 없습니다.<br /></>
            ) : (
              <>오늘 예정된 방문이 없습니다.<br /></>
            )}
            엑셀 명단을 업로드하거나,<br />
            방문 관리에서 방문 예정일을 설정해주세요.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 0.5rem" }}>
            📍 예약 건 우선 · 시간순 정렬 &nbsp;|&nbsp; 카드를 눌러 현장 작업 시작
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
            <strong>➕ 엑셀 명단 추가하기</strong>를 눌러 방문할 명단을 업로드합니다. (잘못 올린 경우 <strong>🗑️ 잘못 올린 파일 삭제</strong>로 초기화 가능)
          </li>
          <li style={{ marginBottom: 8 }}>
            방문 명단에서 대상을 선택 후 <strong>클로바노트 앱 실행하기(현장 사진찍기)</strong>를 누릅니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            현장에서 필요한 사진을 촬영하고, 클로바노트에서 상담 내용을 녹음 및 텍스트로 변환합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            변환된 텍스트 화면에서 <strong>공유</strong> 버튼을 눌러{" "}
            <strong>Field-Master</strong>를 선택합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            앱으로 돌아오면 AI가 방문결과와 특이사항을 자동으로 정리해줍니다.
          </li>
          <li>촬영한 사진을 등록하고 최종 저장하면 완료됩니다.</li>
        </ol>
      </div>

      {/* ── 현장 작업 모달 (클로바노트 연결 & 테스트) ── */}
      {modalTarget && (
        <div className="modal-overlay" onClick={() => setModalTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📍 {modalTarget.name} - 현장 작업</h2>

            <div style={{ margin: "1rem 0" }}>
              <a
                href="intent://#Intent;package=com.naver.clovanote;scheme=clovanote;end;"
                className="btn btn-primary"
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: "16px",
                  padding: "12px",
                  marginBottom: "8px",
                  textDecoration: "none",
                }}
              >
                🎙️ 클로바노트 앱 실행하기(현장 사진찍기)
              </a>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.4,
                  marginTop: 4,
                }}
              >
                * 스마트폰에 설치된 클로바노트가 바로 실행됩니다.<br />
                * 녹음 종료 후 <b>[공유] → [Field-Master]</b>를 선택하면<br />
                이 앱으로 다시 돌아와 자동으로 방문 결과를 정리합니다.
              </p>
            </div>

            <hr
              style={{
                border: 0,
                borderTop: "1px solid var(--color-border)",
                margin: "1.5rem 0 1rem",
              }}
            />

            <h4 style={{ margin: "0 0 8px" }}>⌨️ 텍스트 직접 입력</h4>
            <p style={{ fontSize: 14, margin: "0 0 8px" }}>
              PC 환경이거나 텍스트를 직접 복사한 경우 아래에 붙여넣고 전송하세요.
            </p>
            <textarea
              rows={5}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="상담 녹취 텍스트를 입력하세요..."
              style={{ marginBottom: 12 }}
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
                  "btn btn-ghost" +
                  (submitting || !testText.trim() ? " btn-disabled" : "")
                }
                style={{ background: "var(--color-surface)" }}
                onClick={handleTestSubmit}
                disabled={submitting || !testText.trim()}
              >
                {submitting ? "전송 중..." : "전송하여 진행 →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS 모달 ── */}
      {smsTarget && (
        <SmsComposer record={smsTarget} onClose={() => setSmsTarget(null)} />
      )}

      {/* ── 대기열 모달 ── */}
      {showPendingModal && (
        <div className="modal-overlay" onClick={() => setShowPendingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📥 미정리 상담 내용 ({pendingItems.length}건)</h2>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: "1rem" }}>
              클로바노트에서 전송되었으나 아직 정리되지 않은 내역입니다. 정리할 항목을 선택해주세요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto", marginBottom: "1rem" }}>
              {pendingItems.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "stretch", gap: "8px" }}>
                  <button
                    className="card"
                    style={{ flex: 1, textAlign: "left", cursor: "pointer", border: "1px solid var(--color-border)", padding: "12px", background: "var(--color-surface)" }}
                    onClick={() => router.push(`/share-receiver?id=${item.id}`)}
                  >
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>
                      {new Date(item.createdAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: "var(--color-text)" }}>
                      {item.text || "(내용 없음)"}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeletePendingItem(e, item.id)}
                    style={{
                      background: "none",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-danger, #d32f2f)",
                      padding: "0 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setShowPendingModal(false)}
                style={{ border: "1px solid var(--color-border)" }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
