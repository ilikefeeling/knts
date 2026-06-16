"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  RESULT_OPTIONS,
  ResultOption,
  VISIT_TIME_OPTIONS,
} from "@/lib/constants";
import {
  getTodayVisitList,
  updateVisitResult,
  type LedgerRecord,
} from "@/lib/ledgerDB";
import { addLog } from "@/lib/auditLog";
import PhotoCapture from "@/components/PhotoCapture";
import {
  canUseAutoClassify,
  incrementUsage,
  getRemainingFree,
  isProUser,
  FREE_MONTHLY_LIMIT,
} from "@/lib/usage";

function ShareReceiverInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const errorParam = searchParams.get("error");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharedText, setSharedText] = useState<string>("");

  // 원장에서 가져온 오늘 방문 대상 목록
  const [visits, setVisits] = useState<LedgerRecord[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  const [selectedTarget, setSelectedTarget] = useState<LedgerRecord | null>(null);

  const [result, setResult] = useState<ResultOption>("재방문필요");
  const [summary, setSummary] = useState<string>("");
  const [showOriginal, setShowOriginal] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [retryUsed, setRetryUsed] = useState(false);
  const [saved, setSaved] = useState(false);

  // 재방문 예약 상태
  const [revisitDate, setRevisitDate] = useState("");
  const [revisitTime, setRevisitTime] = useState("");

  // 현장 사진
  const [photos, setPhotos] = useState<string[]>([]);

  // AI 자동분류 사용량(Freemium) 상태
  const [limitReached, setLimitReached] = useState(false);
  const [remaining, setRemaining] = useState(FREE_MONTHLY_LIMIT);
  const [proUser, setProUserState] = useState(false);

  useEffect(() => {
    setRemaining(getRemainingFree());
    setProUserState(isProUser());
  }, []);

  // 오늘 방문 대상 로드
  const loadVisits = useCallback(async () => {
    try {
      const list = await getTodayVisitList();
      setVisits(list);
    } catch (err) {
      console.error("방문명단 로드 실패:", err);
    } finally {
      setVisitsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // 재방문 기본 날짜 (1주 뒤)
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setRevisitDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
    setRevisitTime("10:00");
  }, []);

  // id로 공유받은 텍스트 조회
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/share?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setLoadError(data.error);
        } else {
          setSharedText(data.text);
        }
      })
      .catch(() => setLoadError("공유 내용을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  async function runClassify(text: string) {
    setClassifying(true);
    setClassifyError(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.error) {
        setClassifyError(data.error);
      } else {
        setResult(data.result);
        setSummary(data.summary || "");
        if (!isProUser()) {
          const updated = incrementUsage();
          setRemaining(Math.max(0, FREE_MONTHLY_LIMIT - updated.count));
        }
      }
    } catch {
      setClassifyError("자동분류 중 오류가 발생했습니다. 직접 입력해주세요.");
    } finally {
      setClassifying(false);
    }
  }

  function goToStep3AndClassify() {
    setStep(3);
    if (!sharedText) return;

    if (!canUseAutoClassify()) {
      setLimitReached(true);
      return;
    }
    runClassify(sharedText);
  }

  function handleRetry() {
    if (retryUsed || !sharedText) return;
    if (!canUseAutoClassify()) {
      setLimitReached(true);
      return;
    }
    setRetryUsed(true);
    runClassify(sharedText);
  }

  async function handleSave() {
    if (!selectedTarget) return;

    const isRevisit = result === "재방문필요";
    const nextDate = isRevisit ? revisitDate : null;
    const nextTime = isRevisit ? revisitTime : null;

    // 1) 원장 레코드 업데이트
    const updated = await updateVisitResult(
      selectedTarget.id,
      result,
      summary,
      nextDate,
      nextTime,
      photos
    );

    // 2) Audit Log: 현장 방문 기록
    await addLog({
      recordId: selectedTarget.id,
      recordName: selectedTarget.name,
      action: "VISIT_RECORDED",
      before: {
        lastVisitResult: selectedTarget.lastVisitResult,
        visitCount: selectedTarget.visitCount,
      },
      after: {
        lastVisitResult: result,
        lastVisitSummary: summary,
        lastVisitPhotos: photos.length > 0 ? `${photos.length}장` : "없음",
        visitCount: (selectedTarget.visitCount || 0) + 1,
      },
      reason: "현장 방문 기록",
      reasonCategory: null,
    });

    // 3) 재방문 예약 시 추가 로그
    if (isRevisit && nextDate) {
      await addLog({
        recordId: selectedTarget.id,
        recordName: selectedTarget.name,
        action: "REVISIT_SCHEDULED",
        before: null,
        after: { nextVisitDate: nextDate, nextVisitTime: nextTime },
        reason: `재방문 예약: ${nextDate} ${nextTime || ""}`,
        reasonCategory: null,
      });
    }

    setSaved(true);

    // 4) 수신함(Pending)에서 삭제
    if (id) {
      await fetch(`/api/share?id=${id}`, { method: "DELETE" }).catch(() => {});
    }

    // 업데이트된 레코드로 selectedTarget 갱신 (화면 표시용)
    if (updated) {
      setSelectedTarget(updated);
    }
  }

  // ---------- 화면 ----------

  if (errorParam === "empty") {
    return (
      <div className="card card-muted">
        <p>공유받은 내용이 비어 있습니다. 클로바노트에서 변환된 텍스트가 있는지 확인 후 다시 시도해주세요.</p>
        <a className="btn btn-primary" href="/">홈으로 돌아가기</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card card-muted">
        <p>공유받은 상담 내용을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="card card-muted">
        <p>{loadError}</p>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          공유한 지 1시간이 지났거나, 잘못된 경로로 접근했을 수 있습니다.
        </p>
        <a className="btn btn-primary" href="/">홈으로 돌아가기</a>
      </div>
    );
  }

  if (!id || !sharedText) {
    return (
      <div className="card card-muted">
        <h1 style={{ fontSize: 19, marginBottom: 8 }}>공유받은 내용이 없습니다</h1>
        <p style={{ fontSize: 15, color: "var(--color-text-muted)" }}>
          클로바노트(또는 음성 변환 앱)에서 상담 내용을 변환한 뒤,
          <strong> 공유 → Field-Master</strong> 를 선택해주세요.
        </p>
        <a className="btn btn-primary" href="/">홈으로 돌아가기</a>
      </div>
    );
  }

  return (
    <div>
      {step === 1 && (
        <section>
          <div className="badge" style={{ marginBottom: 8 }}>
            🔗 클로바노트에서 공유됨
          </div>
          <h1>상담 내용을 받았어요</h1>
          <div className="card card-muted" style={{ whiteSpace: "pre-wrap" }}>
            {sharedText}
          </div>
          <button className="btn btn-primary" onClick={() => setStep(2)}>
            다음
          </button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1>어느 방문 건인가요?</h1>

          {visitsLoading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p className="empty-state-text">방문 명단 로드 중...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">
                오늘 방문 대상이 없습니다.<br />
                홈에서 엑셀 명단을 업로드해주세요.
              </p>
            </div>
          ) : (
            visits.map((v, idx) => (
              <button
                key={v.id}
                className={
                  "visit-card" +
                  (v.nextVisitTime ? " reserved" : "") +
                  (selectedTarget?.id === v.id ? " selected" : "")
                }
                style={
                  selectedTarget?.id === v.id
                    ? { borderColor: "var(--color-primary)", background: "var(--color-primary-bg)" }
                    : undefined
                }
                onClick={() => setSelectedTarget(v)}
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
            ))
          )}

          <button
            className={"btn btn-primary" + (!selectedTarget ? " btn-disabled" : "")}
            onClick={goToStep3AndClassify}
            disabled={!selectedTarget}
          >
            자동 정리하기
          </button>
        </section>
      )}

      {step === 3 && selectedTarget && (
        <section>
          <div className="badge" style={{ marginBottom: 8 }}>
            ✨ {selectedTarget.name} - 자동 정리 결과
          </div>
          <h1>현장기록 확인</h1>

          {classifying && (
            <div className="empty-state" style={{ padding: "1rem" }}>
              <div className="spinner" />
              <p className="empty-state-text">AI가 상담 내용을 분석하고 있습니다...</p>
            </div>
          )}

          {limitReached && !proUser && (
            <div
              className="card"
              style={{
                background: "var(--color-primary-bg)",
                border: "none",
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>
                이번 달 무료 자동분류({FREE_MONTHLY_LIMIT}건)를 모두
                사용했어요
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--color-text-muted)" }}>
                아래 항목은 직접 선택/입력하면 그대로 저장됩니다. AI 자동분류를
                계속 이용하시려면 Pro로 업그레이드해주세요.
              </p>
              <a className="btn btn-primary" href="/pricing">
                ✨ Pro 요금제 보기
              </a>
            </div>
          )}

          {!proUser && !limitReached && !classifying && (
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-muted)",
                margin: "0 0 12px",
              }}
            >
              이번 달 AI 자동분류 {FREE_MONTHLY_LIMIT - remaining}/
              {FREE_MONTHLY_LIMIT}건 사용
            </p>
          )}

          {classifyError && (
            <p style={{ fontSize: 14, color: "#a33" }}>{classifyError}</p>
          )}

          <label className="field-label">방문결과</label>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as ResultOption)}
            disabled={classifying}
          >
            {RESULT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {/* ── 재방문 예약 UI ── */}
          {result === "재방문필요" && !classifying && (
            <div className="revisit-box">
              <h4>📅 재방문 예약</h4>
              <div className="revisit-row">
                <label>예약 날짜</label>
                <input
                  type="date"
                  value={revisitDate}
                  onChange={(e) => setRevisitDate(e.target.value)}
                />
              </div>
              <div className="revisit-row">
                <label>예약 시간</label>
                <select
                  value={revisitTime}
                  onChange={(e) => setRevisitTime(e.target.value)}
                >
                  {VISIT_TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ height: 16 }} />

          <label className="field-label">특이사항 / 다음조치</label>
          <textarea
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={classifying}
          />

          {/* ── 현장 사진 촬영 ── */}
          {!classifying && (
            <PhotoCapture
              photos={photos}
              onChange={setPhotos}
              maxPhotos={5}
              disabled={saved}
            />
          )}

          {!classifying && !limitReached && (
            <button
              className={"btn btn-ghost" + (retryUsed ? " btn-disabled" : "")}
              onClick={handleRetry}
              disabled={retryUsed}
              style={{ justifyContent: "flex-start", padding: 0, marginTop: 4 }}
            >
              ↻ 다시 분석하기{retryUsed ? " (1회 사용함)" : ""}
            </button>
          )}

          <button
            className="btn btn-ghost"
            onClick={() => setShowOriginal((s) => !s)}
            style={{ justifyContent: "flex-start", padding: 0, marginTop: 8 }}
          >
            {showOriginal ? "원본 음성 텍스트 닫기" : "원본 음성 텍스트 보기"}
          </button>
          {showOriginal && (
            <div className="original-text">{sharedText}</div>
          )}

          <div style={{ height: 16 }} />

          {saved ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                className="card"
                style={{
                  background: "var(--color-success-bg)",
                  color: "var(--color-success)",
                  border: "none",
                  textAlign: "center",
                }}
              >
                ✅ 저장되었습니다.
                {result === "재방문필요" && revisitDate && (
                  <div style={{ fontSize: 14, marginTop: 4 }}>
                    재방문 예약: {revisitDate} {revisitTime}
                  </div>
                )}
              </div>
              <a className="btn btn-primary" href="/">홈으로 돌아가기</a>
            </div>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={classifying}
            >
              ✓ 저장하기
            </button>
          )}
        </section>
      )}

      <div className="dots">
        <div className={"dot" + (step === 1 ? " active" : "")} />
        <div className={"dot" + (step === 2 ? " active" : "")} />
        <div className={"dot" + (step === 3 ? " active" : "")} />
      </div>
    </div>
  );
}

export default function ShareReceiverPage() {
  return (
    <Suspense fallback={<div className="card card-muted">불러오는 중...</div>}>
      <ShareReceiverInner />
    </Suspense>
  );
}
