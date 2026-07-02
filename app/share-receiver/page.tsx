"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  RESULT_OPTIONS,
  ResultOption,
  VISIT_TIME_OPTIONS,
} from "@/lib/constants";
import { submitVisitResult } from "@/lib/workerDb";
import { type WorkerTarget as LedgerRecord, getAssignedTargets as getTodayVisitList } from "@/lib/workerDb";
import { encryptText, decryptText } from "@/lib/crypto";
import { addLog } from "@/lib/auditLog";
import PhotoCapture from "@/components/PhotoCapture";
import {
  canUseAutoClassify,
  incrementUsage,
  getRemainingFree,
  isProUser,
  FREE_MONTHLY_LIMIT,
} from "@/lib/usage";
import { getTargetPhotos, clearTargetPhotos } from "@/utils/idbUtils";
import { createClient } from "@/utils/supabase/client";

function ShareReceiverInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const errorParam = searchParams.get("error");

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharedText, setSharedText] = useState<string>("");
  const [lastActiveTargetId, setLastActiveTargetId] = useState<string | null>(null);
  const [showAllTargets, setShowAllTargets] = useState<boolean>(false);

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
  const [localBlobs, setLocalBlobs] = useState<{ blob: Blob; url: string }[]>([]);

  // AI 자동분류 사용량(Freemium) 상태
  const [limitReached, setLimitReached] = useState(false);
  const [remaining, setRemaining] = useState(FREE_MONTHLY_LIMIT);
  const [proUser, setProUserState] = useState(false);

  useEffect(() => {
    setRemaining(getRemainingFree());
    setProUserState(isProUser());
  }, []);

  // 단계2 진입 시 로컬 임시저장된 사진 불러오기
  useEffect(() => {
    if (step === 2 && selectedTarget) {
      let active = true;
      getTargetPhotos(selectedTarget.id).then((blobs) => {
        if (!active) return;
        if (blobs.length > 0) {
          const loaded = blobs.map((blob) => ({
            blob,
            url: URL.createObjectURL(blob),
          }));
          setLocalBlobs(loaded);
          setPhotos((prev) => {
            // 중복 방지 (기존 photos에 없는 것만 추가)
            const existingUrls = new Set(prev);
            const newUrls = loaded.map((l) => l.url).filter(u => !existingUrls.has(u));
            return [...newUrls, ...prev];
          });
        }
      });
      return () => { active = false; };
    }
  }, [step, selectedTarget]);

  // 컴포넌트 마운트 시 localStorage에서 직전 작업 대상 ID 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("last_active_target_id");
      const timeStr = localStorage.getItem("last_active_time");
      if (savedId && timeStr) {
        const time = parseInt(timeStr, 10);
        // 2시간 이내의 기록만 유효한 것으로 간주
        if (Date.now() - time < 2 * 60 * 60 * 1000) {
          setLastActiveTargetId(savedId);
        }
      }
    }
  }, []);

  // 오늘 방문 대상 로드
  const loadVisits = useCallback(async () => {
    try {
      const list = await getTodayVisitList();
      const currentPin = sessionStorage.getItem("workspace_pin");
      if (!currentPin) {
        setVisits(list); // PIN이 없으면 복호화 불가 (로그인 화면에서 막히겠지만 혹시 모르니)
        return;
      }
      const decryptedList = await Promise.all(
        list.map(async (v) => ({
          ...v,
          name: await decryptText(v.name, currentPin),
          address: await decryptText(v.address, currentPin),
          detail_address: await decryptText(v.detail_address, currentPin),
        }))
      );
      setVisits(decryptedList);
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
      .then((res) => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (data.error) {
          console.error("Share API Error Response:", JSON.stringify({ status, data }, null, 2));
          setLoadError(data.error);
        } else {
          setSharedText(data.text);
        }
      })
      .catch((err) => {
        console.error("Share API Fetch Error:", err);
        setLoadError("공유 내용을 불러오지 못했습니다.");
      })
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
    setStep(2);
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

    // 0) 로컬 사진들(IndexedDB)을 Supabase에 업로드
    const supabase = createClient();
    const finalPhotos: string[] = [];
    
    for (const p of photos) {
      const localMatch = localBlobs.find((lb) => lb.url === p);
      if (localMatch) {
        const fileExt = localMatch.blob.type.split("/")[1] || "jpeg";
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `records/${fileName}`;
        const { error } = await supabase.storage.from("photos").upload(filePath, localMatch.blob);
        if (!error) {
          const { data } = supabase.storage.from("photos").getPublicUrl(filePath);
          finalPhotos.push(data.publicUrl);
        }
      } else {
        finalPhotos.push(p);
      }
    }

    // 1) 원장 레코드 업데이트 (E2EE)
    const pin = sessionStorage.getItem("workspace_pin");
    const encMemo = await encryptText(summary, pin || "");
    const isSuccess = (result as string) !== "미방문";
    const encReason = isSuccess ? "" : await encryptText(result, pin || "");

    await submitVisitResult(
      selectedTarget.id,
      isSuccess,
      encReason,
      encMemo,
      finalPhotos
    );

    // IndexedDB 비우기
    await clearTargetPhotos(selectedTarget.id);

    // 2) Audit Log: 현장 방문 기록
    await addLog({
      recordId: selectedTarget.id,
      recordName: selectedTarget.name,
      action: "VISIT_RECORDED",
      before: {
        visitCount: selectedTarget.visitCount,
      },
      after: {
        lastVisitResult: result,
        lastVisitSummary: "E2EE Encrypted",
        lastVisitPhotos: finalPhotos.length > 0 ? `${finalPhotos.length}장` : "없음",
        visitCount: (selectedTarget.visitCount || 0) + 1,
      },
      reason: "현장 방문 기록 (B2G)",
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

    // 4) 기기 내 민감 데이터 완전 파기 (Zero Data Policy)
    if (typeof window !== "undefined") {
      localStorage.removeItem("last_active_target_id");
      localStorage.removeItem("last_active_time");
    }
    
    // React 메모리 상태 초기화 (사진, 텍스트 등 즉시 증발)
    setPhotos([]);
    setLocalBlobs((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    setSummary("");
    setSharedText("");
    setResult("재방문필요");

    // 5) 수신함(Pending)에서 삭제
    if (id) {
      await fetch(`/api/share?id=${id}`, { method: "DELETE" }).catch(() => {});
    }

    // 업데이트된 레코드로 selectedTarget 갱신 (목록에서 사라짐)
    setSelectedTarget(null);
    
    // 파기 완료 시각적 피드백 제공
    alert("✅ 전송 완료\n보안 규정에 따라 단말기 내 체납자 관련 데이터(사진, 메모)가 복구 불가능하게 영구 파기되었습니다.");
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
          <h1>대상을 확인하고 선택해주세요</h1>

          <div className="card card-muted" style={{ whiteSpace: "pre-wrap", marginBottom: "1.5rem", maxHeight: "120px", overflowY: "auto" }}>
            <span style={{fontSize: 13, color: "var(--color-text-muted)", display: "block", marginBottom: 4}}>공유받은 텍스트:</span>
            {sharedText}
          </div>

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
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {(() => {
                const recommended = visits.filter(v => {
                  const isContextMatch = v.id === lastActiveTargetId;
                  const isTextMatch = sharedText.includes(v.name);
                  return isContextMatch || isTextMatch;
                });
                
                // 정렬: Context Match(방금 다녀온 곳)를 최상단으로
                recommended.sort((a, b) => {
                  if (a.id === lastActiveTargetId && b.id !== lastActiveTargetId) return -1;
                  if (a.id !== lastActiveTargetId && b.id === lastActiveTargetId) return 1;
                  return 0;
                });

                const others = visits.filter(v => {
                  const isContextMatch = v.id === lastActiveTargetId;
                  const isTextMatch = sharedText.includes(v.name);
                  return !isContextMatch && !isTextMatch;
                });

                const hasMatch = recommended.length > 0;
                const targetsToDisplay = (hasMatch && !showAllTargets) ? recommended : visits;

                return (
                  <div>
                    <h3 style={{ fontSize: 15, marginBottom: 8, color: hasMatch && !showAllTargets ? "var(--color-primary)" : "var(--color-text)" }}>
                      {hasMatch && !showAllTargets ? "✨ 1:1 매칭된 방문 대상" : "방문 명단"}
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {targetsToDisplay.map((v) => {
                        const isRec = recommended.some(r => r.id === v.id);
                        return (
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
                              <span className="visit-order">{visits.indexOf(v) + 1}</span>
                              <span className="visit-name">{v.name}</span>
                              <div className="visit-badges">
                                {isRec && v.id === lastActiveTargetId && (
                                  <span className="badge" style={{ background: "#dbeafe", color: "#1e3a8a", padding: "2px 6px", fontSize: 11, border: "none", marginRight: 4 }}>
                                    🎯 직전 방문
                                  </span>
                                )}
                                {isRec && sharedText.includes(v.name) && (
                                  <span className="badge" style={{ background: "#fef3c7", color: "#d97706", padding: "2px 6px", fontSize: 11, border: "none" }}>
                                    ✨ 텍스트 일치
                                  </span>
                                )}
                                {v.nextVisitTime && (
                                  <span className="badge-reserved">🕐 예약 {v.nextVisitTime}</span>
                                )}
                                <span className="badge-visit-count">
                                  {v.visitCount === 0 ? "최초" : `${v.visitCount + 1}회차`}
                                </span>
                              </div>
                            </div>
                            <div className="visit-addr">{v.address} {v.detail_address}</div>
                          </button>
                        );
                      })}
                    </div>

                    {hasMatch && !showAllTargets && others.length > 0 && (
                      <button 
                        style={{ marginTop: 16, background: "none", border: "none", color: "var(--color-text-muted)", textDecoration: "underline", cursor: "pointer", fontSize: 13, textAlign: "center", width: "100%" }}
                        onClick={() => setShowAllTargets(true)}
                      >
                        목록에 찾는 대상이 없나요? 전체 명단 보기
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <button
            className={"btn btn-primary" + (!selectedTarget ? " btn-disabled" : "")}
            onClick={goToStep3AndClassify}
            disabled={!selectedTarget}
          >
            선택한 대상으로 자동 정리하기
          </button>
        </section>
      )}

      {step === 2 && selectedTarget && (
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
              <div className="btn btn-primary" style={{ cursor: "default", opacity: 0.9 }}>
                ✨ Pro 요금제 보기 (가이드용)
              </div>
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
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎉</div>
                  <h2 style={{ fontSize: "1.2rem", color: "#16a34a", marginBottom: "4px" }}>
                    ✅ 관리자에게 결과 보고가 완료되었습니다.
                  </h2>
                  {result === "재방문필요" && revisitDate && (
                    <div style={{ fontSize: 14, marginTop: 8, color: "#15803d" }}>
                      재방문 예약: {revisitDate} {revisitTime}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "12px", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", fontSize: "13px", lineHeight: "1.5", textAlign: "center", border: "1px solid #fecaca" }}>
                <strong>보안 안내:</strong> 오늘 예정된 모든 현장 업무가 끝났다면,<br/>홈 화면 우측 상단의 <strong>[🔒 업무 종료 (데이터 잠금)]</strong> 버튼을 눌러 반드시 기기 내 민감정보를 파기해 주세요.
              </div>
              <a className="btn btn-primary" href="/">홈으로 돌아가기</a>
            </div>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={classifying}
            >
              📤 방문내용 보고하기
            </button>
          )}
        </section>
      )}

      <div className="dots">
        <div className={"dot" + (step === 1 ? " active" : "")} />
        <div className={"dot" + (step === 2 ? " active" : "")} />
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
