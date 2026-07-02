"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InstallPrompt from "@/components/InstallPrompt";
import SmsComposer from "@/components/SmsComposer";
import FieldChecklist from "@/components/FieldChecklist";
import LocalPhotoCapture from "@/components/LocalPhotoCapture";
import { getAssignedTargets, getPendingTargets, getWorkspaceAdminPinHash, type WorkerTarget as LedgerRecord } from "@/lib/workerDb";
import { decryptText } from "@/lib/crypto";
import { isBusinessDay } from "korean-holidays";
import { hashPin } from "@/utils/crypto";
import { acceptAssignment, rejectAssignment } from "@/lib/adminDb";

export default function Home() {
  const router = useRouter();
  const [visits, setVisits] = useState<LedgerRecord[]>([]);
  const [pendingVisits, setPendingVisits] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTarget, setModalTarget] = useState<LedgerRecord | null>(null);
  const [testText, setTestText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [smsTarget, setSmsTarget] = useState<LedgerRecord | null>(null);
  const [todayStr, setTodayStr] = useState("");
  const [isHolidayToday, setIsHolidayToday] = useState(false);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pin, setPin] = useState<string>("");
  const [isPinEntered, setIsPinEntered] = useState(false);
  const [adminPinHash, setAdminPinHash] = useState<string | null>(null);
  const [proUser, setProUser] = useState(false);

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

      const [list, pendingList] = await Promise.all([
        getAssignedTargets(),
        getPendingTargets()
      ]);
      const currentPin = sessionStorage.getItem("workspace_pin") || pin;
      
      const decryptedList = await Promise.all(
        list.map(async (v) => ({
          ...v,
          name: await decryptText(v.name, currentPin),
          address: await decryptText(v.address, currentPin),
          detail_address: await decryptText(v.detail_address, currentPin),
        }))
      );
      
      const decryptedPendingList = await Promise.all(
        pendingList.map(async (v) => ({
          ...v,
          name: await decryptText(v.name, currentPin),
          address: await decryptText(v.address, currentPin),
          detail_address: await decryptText(v.detail_address, currentPin),
        }))
      );
      
      setVisits(decryptedList);
      setPendingVisits(decryptedPendingList);
    } catch (err: any) {
      console.error("방문명단 로드 실패:", err);
      if (err.message?.includes("WORKER_INACTIVE")) {
        alert("계약이 만료되었거나 비활성화되었습니다. 단말기의 모든 현장 데이터가 파기됩니다.");
        sessionStorage.clear();
        localStorage.clear();
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }, [pin]);

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

  const [workerName, setWorkerName] = useState<string>("");
  const [guideCompleted, setGuideCompleted] = useState<boolean | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setMounted(true);
    const savedPin = sessionStorage.getItem("workspace_pin");
    if (savedPin) {
      setPin(savedPin);
      setIsPinEntered(true);
    }
    setProUser(localStorage.getItem("knts_pro_v1") === "true");
    
    const fetchUserAndGuide = async () => {
      try {
        const hash = await getWorkspaceAdminPinHash();
        setAdminPinHash(hash);

        const [authRes, guideRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/worker/guide-status")
        ]);
        
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.user?.name) {
            setWorkerName(authData.user.name);
          }
          
          if (authData.user?.role === "ADMIN") {
            setGuideCompleted(true);
            setIsAdminUser(true);
          } else if (guideRes.ok) {
            const guideData = await guideRes.json();
            setGuideCompleted(guideData.completed);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    fetchUserAndGuide();
  }, []);

  useEffect(() => {
    if (isPinEntered) {
      loadVisits();
      loadPendingItems();
    }
  }, [isPinEntered, loadVisits, loadPendingItems]);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!adminPinHash) {
      alert("⚠️ 보안 오류: 소속 관리자가 마스터 암호화 키(PIN)를 아직 설정하지 않았습니다.\n데이터 접근이 차단됩니다. 관리자에게 문의하세요.");
      return;
    }

    const inputHash = await hashPin(pin);
    if (inputHash !== adminPinHash) {
      alert("관리자에게 전달받은 정확한 PIN 6자리를 입력해주세요.");
      return;
    }

    sessionStorage.setItem("workspace_pin", pin);
    setIsPinEntered(true);
  }

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

  if (!mounted || isCheckingAuth) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8fafc", color: "#64748b", fontWeight: "bold" }}>
        안전한 환경을 준비 중입니다...
      </div>
    );
  }

  if (!isPinEntered) {
    return (
      <div style={{ padding: "30px", maxWidth: "420px", margin: "80px auto", textAlign: "center", background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
        
        <div style={{ background: "#f0fdf4", color: "#15803d", padding: "14px", borderRadius: "8px", marginBottom: "24px", fontSize: "15px", fontWeight: "500", border: "1px solid #bbf7d0" }}>
          ✅ 로그인 성공! {workerName ? <><strong style={{ color: "#14532d", fontSize: "17px", fontWeight: "800", textDecoration: "underline" }}>{workerName}</strong> 님 계정입니다.</> : "계정입니다."}
        </div>

        <h2 style={{ marginBottom: "12px", color: "#0f172a", fontSize: "22px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span>🔒</span> 보안 잠금 상태
        </h2>
        
        <div style={{ background: "#eff6ff", color: "#1e40af", padding: "16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", border: "1px solid #bfdbfe", lineHeight: "1.5", textAlign: "left" }}>
          <strong>💡 보안 접속 안내</strong><br/>
          현장 방문록의 모든 데이터는 종단간 암호화(E2EE)로 보호됩니다.<br/>
          관리자에게 전달받은 <strong>6자리 마스터 PIN 번호</strong>를 입력해 주세요.
        </div>
        
        <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "8px", border: "1px dashed #f87171", fontSize: "14px", color: "#b91c1c", lineHeight: "1.6", textAlign: "center", marginBottom: "24px" }}>
          <strong>💡 관리자 테스트 중이신가요?</strong><br/>
          <div style={{ marginTop: "8px", fontWeight: "bold" }}>관리자는 핀번호생성 메뉴를 이용해주세요.</div>
        </div>
        
        <form onSubmit={handlePinSubmit} style={{ marginBottom: "20px" }}>
          <input 
            type="password" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            placeholder="6자리 숫자 입력"
            maxLength={6}
            style={{ 
              width: "100%", 
              padding: "16px", 
              marginBottom: "16px", 
              borderRadius: "8px", 
              border: "2px solid #3b82f6", 
              textAlign: "center", 
              letterSpacing: "8px",
              fontSize: "24px",
              fontWeight: "bold",
              background: "#ffffff",
              boxShadow: "0 4px 6px rgba(59, 130, 246, 0.1)",
              outline: "none"
            }}
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <button type="submit" className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px" }}>
            암호화 접속
          </button>
        </form>

        {/* 경고 박스 (깔끔하면서도 눈에 띄게) */}
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", textAlign: "left", lineHeight: "1.6", border: "2px solid #ef4444", boxShadow: "0 4px 6px rgba(239, 68, 68, 0.1)" }}>
          <strong style={{ display: "block", fontSize: "17px", marginBottom: "12px", color: "#dc2626", fontWeight: "800", letterSpacing: "-0.5px" }}>
            [매우 중요] PIN 번호 분실 주의
          </strong>
          <span style={{ fontSize: "15px", fontWeight: "500", color: "#334155", wordBreak: "keep-all", display: "block" }}>
            관리자님께서 알려주신 PIN 번호는 <span style={{ color: "#b91c1c", textDecoration: "underline", fontWeight: "700" }}>절대로 잊지 않도록 주의</span>해 주세요.<br/><br/>
            PIN 번호를 분실하면 잠금을 풀 수 없어 <strong style={{ color: "#b91c1c", fontWeight: "800" }}>업무 진행이 전면 불가능</strong>하며, 관리자님께 다시 연락해 새로 발급받아야 하는 중대한 번거로움이 발생합니다.
          </span>
        </div>

      </div>
    );
  }

  if (guideCompleted === false) {
    return (
      <div style={{ padding: "30px", maxWidth: "420px", margin: "80px auto", textAlign: "center", background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
        <h2 style={{ marginBottom: "16px", color: "#dc2626", fontSize: "22px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span>🚨</span> 필수 안내
        </h2>
        <p style={{ fontSize: "16px", color: "#334155", marginBottom: "24px", lineHeight: "1.6", wordBreak: "keep-all" }}>
          현장 보조원 업무를 시작하기 전에 <strong>반드시 사용 가이드를 숙지하고 수료</strong>하셔야 합니다.
        </p>
        <Link href="/guide" style={{ display: "block", width: "100%", padding: "16px", fontSize: "16px", fontWeight: "bold", borderRadius: "8px", background: "#3b82f6", color: "#ffffff", textDecoration: "none" }}>
          수료 페이지로 이동하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>
          FM
        </h1>
        <button 
          onClick={() => { 
            if(window.confirm("업무를 종료하고 데이터를 다시 안전하게 잠그시겠습니까?\n\n확인을 누르시면 기기에 임시 저장된 PIN 번호가 즉시 삭제되며, 데이터를 다시 보려면 PIN 번호를 새로 입력해야 합니다. (보안 유지)")) {
              sessionStorage.removeItem("workspace_pin"); 
              window.location.reload(); 
            }
          }} 
          className="btn-ghost" 
          style={{ 
            border: "1px solid #fca5a5", 
            background: "#fef2f2", 
            color: "#b91c1c", 
            borderRadius: "8px", 
            padding: "8px 12px", 
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          🔒 업무 종료 (데이터 잠금)
        </button>
      </div>
      <p style={{ color: "var(--color-text)", fontSize: "18px", fontWeight: "700", fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", letterSpacing: "-0.5px", wordBreak: "keep-all", marginBottom: "1.5rem" }}>
        Field-Master 현장조사 업무 관리 도구 (E2EE 암호화됨)
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

      {/* ── 바로가기 ── */}
      <div className="home-links">
        <Link href="/guide" className="home-link-btn btn-guide">
          <span style={{ fontSize: "1.2rem" }}>📖</span>
          <span>사용 설명</span>
        </Link>
        <Link href="/mypage" className="home-link-btn btn-mypage">
          <span style={{ fontSize: "1.2rem" }}>🔑</span>
          <span>비밀번호 수정</span>
        </Link>
        <Link href="/ios-guide" className="home-link-btn btn-ios">
          iPhone
        </Link>
      </div>

      {/* ── 관리자 테스트용 배너 ── */}
      {isAdminUser && (visits.length > 0 || pendingVisits.length > 0) && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
          <strong style={{ color: "#d97706", display: "block", marginBottom: "8px" }}>⚠️ 관리자 테스트 안내</strong>
          <p style={{ color: "#92400e", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
            현재 보이는 체납자 목록은 관리자님의 <strong>'1초 테스트' 진행을 위해 자동 생성된 샘플 데이터</strong>입니다.<br/>
            실제 보조원이 로그인할 때는 배정된 내역이 없는 빈 화면부터 시작됩니다.
          </p>
        </div>
      )}

      {/* ── 수락 대기 중인 배정 건 (Handshake) ── */}
      {pendingVisits.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <div className="section-title" style={{ color: "#b91c1c" }}>
            <h2 style={{ color: "#b91c1c" }}>⏳ 수락 대기 중인 배정 건</h2>
            <span className="section-count" style={{ background: "#fee2e2", color: "#b91c1c" }}>{pendingVisits.length}건</span>
          </div>
          <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "12px", border: "1px solid #fca5a5" }}>
            <p style={{ fontSize: "14px", color: "#991b1b", marginBottom: "12px", fontWeight: "bold" }}>
              관리자가 배정한 새로운 업무입니다. 수락해야만 진행할 수 있습니다.
            </p>
            {pendingVisits.map((v) => (
              <div key={v.id} style={{ background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, marginRight: "12px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#1e293b", marginBottom: "4px" }}>{v.name}</div>
                  <div style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>{v.address}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexDirection: "column" }}>
                  <button 
                    onClick={async () => {
                      if (!window.confirm("배정된 업무를 수락하시겠습니까?")) return;
                      await acceptAssignment(v.id);
                      loadVisits();
                    }}
                    style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >수락하기</button>
                  <button 
                    onClick={async () => {
                      if (!window.confirm("정말로 거절하시겠습니까? (거절 사유는 관리자에게 기록됩니다)")) return;
                      await rejectAssignment(v.id);
                      loadVisits();
                    }}
                    style={{ background: "#fff", color: "#dc2626", border: "1px solid #dc2626", padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >거절하기</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-title" style={{ marginTop: "2rem" }}>
        <h2>📋 진행 중인 업무</h2>
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
              <>오늘 배정된 방문 체납자가 없습니다.<br /></>
            )}
            관리자로부터 새로운 업무가 배정될 때까지 대기해 주세요.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 0.5rem" }}>
            📍 예약 건 우선 · 시간순 정렬 &nbsp;|&nbsp; 카드를 눌러 현장 작업 시작
          </p>
          {visits.map((v, idx) => (
            <div key={v.id} className="visit-card-row" style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
              
              {/* 상단: 이름 및 상태 뱃지 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#3b82f6", color: "white", width: "24px", height: "24px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>{idx + 1}</span>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{v.name}</span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {v.nextVisitTime && <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>🕐 {v.nextVisitTime}</span>}
                  <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>{v.visitCount === 0 ? "최초방문" : `${v.visitCount + 1}회차`}</span>
                </div>
              </div>

              {/* 1. 방문 및 연락처 정보 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                <a href={`https://map.kakao.com/link/search/${v.address} ${v.detail_address}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#334155", display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ fontSize: "16px" }}>📍</span>
                  <span style={{ fontSize: "14px", lineHeight: "1.4", flex: 1 }}>
                    <div style={{ fontWeight: "bold", color: "#1e293b", marginBottom: "2px" }}>실거주지 (지도 보기)</div>
                    {v.address} {v.detail_address}
                  </span>
                </a>
                {v.contact && (
                  <a href={`tel:${v.contact}`} style={{ textDecoration: "none", color: "#334155", display: "flex", alignItems: "center", gap: "8px", padding: "8px", background: "#f8fafc", borderRadius: "8px" }}>
                    <span style={{ fontSize: "16px" }}>📞</span>
                    <span style={{ fontSize: "14px", flex: 1 }}>
                      <span style={{ fontWeight: "bold", color: "#1e293b", marginRight: "8px" }}>연락처</span> 
                      <span style={{ color: "#2563eb", fontWeight: "bold", textDecoration: "underline" }}>{v.contact}</span>
                    </span>
                  </a>
                )}
              </div>

              {/* 2. 징수 목적 (금액 및 세목) */}
              <div style={{ background: "#fef2f2", padding: "12px", borderRadius: "8px", marginBottom: "12px", border: "1px dashed #fca5a5" }}>
                <div style={{ fontSize: "12px", color: "#991b1b", fontWeight: "bold", marginBottom: "4px" }}>💰 총 체납액</div>
                <div style={{ fontSize: "24px", fontWeight: "900", color: "#b91c1c", marginBottom: "8px" }}>
                  {v.arrears_amount ? v.arrears_amount + " 원" : "금액 미상"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "13px", color: "#7f1d1d" }}>
                  <span style={{ background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>{v.department}</span>
                  <span style={{ background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>{v.tax_item}</span>
                  {v.arrears_count && <span style={{ background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>총 {v.arrears_count}건</span>}
                </div>
              </div>

              {/* 3. 징수 독려 무기 (협상 카드) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#475569", background: "#f1f5f9", padding: "12px", borderRadius: "8px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ fontWeight: "bold", minWidth: "60px" }}>🚨 압류:</span> 
                  <span style={{ color: v.seizure_details && v.seizure_details !== "없음" && v.seizure_details !== "해당없음" ? "#b91c1c" : "#64748b", fontWeight: "bold" }}>{v.seizure_details || "내역 없음"}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ fontWeight: "bold", minWidth: "60px" }}>🤝 분납:</span> 
                  <span style={{ color: v.installment_status && v.installment_status !== "해당없음" ? "#047857" : "#64748b", fontWeight: "bold" }}>{v.installment_status || "내역 없음"}</span>
                </div>
              </div>

              {/* 하단: 작업 시작 버튼 */}
              <button 
                onClick={() => openModal(v)} 
                style={{ width: "100%", padding: "14px", marginTop: "4px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", gap: "8px" }}
              >
                <span>📝</span> 현장 조사 기록하기
              </button>
            </div>
          ))}
        </>
      )}

      {/* ── 사용 방법 ── */}
      <h2>사용 방법</h2>
      <div className="card card-muted">
        <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 15 }}>
          <li style={{ marginBottom: 8 }}>
            방문 명단에서 체납자를 터치하고 팝업창에서 <strong>현장 사진을 미리 촬영(임시 저장)</strong>해 둡니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>[🎙️ 녹음(클로바노트 실행)]</strong> 버튼을 눌러 대화를 녹음하고 텍스트로 변환합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            변환된 텍스트 화면에서 <strong>공유</strong> 버튼을 눌러{" "}
            <strong>Field-Master</strong>를 선택합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>FM 앱</strong>으로 돌아오면 AI가 결과를 정리해주며, <strong>미리 찍은 사진이 자동으로 첨부</strong>됩니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            내용을 확인하고 <strong>[📤 방문내용 보고하기]</strong>를 누르면 서버로 안전하게 최종 전송되며 업무가 마감됩니다.
          </li>
          <li>
            오늘 예정된 모든 업무가 끝나면, 우측 상단의 <strong>[🔒 업무 종료 (데이터 잠금)]</strong> 버튼을 눌러 반드시 기기 내 개인정보를 파기해 주세요.
          </li>
        </ol>
      </div>

      {/* ── 현장 작업 모달 (클로바노트 연결 & 테스트) ── */}
      {modalTarget && (
        <div className="modal-overlay" onClick={() => setModalTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📍 {modalTarget.name} - 현장 작업</h2>

            <div style={{ margin: "1rem 0" }}>
              <LocalPhotoCapture targetId={modalTarget.id} />

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
                onClick={() => {
                  localStorage.setItem("knts_last_target", modalTarget.id);
                }}
              >
                🎙️ 녹음(클로바노트 실행)
              </a>
              
              <button
                className="btn"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  fontSize: "16px",
                  padding: "12px",
                  marginBottom: "8px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
                onClick={async () => {
                  if (!modalTarget) return;
                  setSubmitting(true);
                  
                  localStorage.setItem("knts_last_target", modalTarget.id);
                  localStorage.setItem("last_active_time", Date.now().toString());

                  try {
                    const res = await fetch("/api/share", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: "체납자가 부재중입니다. 현장에 안내문을 부착하였습니다." }),
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
                }}
                disabled={submitting}
              >
                🚫 부재중 (바로 보고하기)
              </button>

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

      {/* ── 현장 조사 체크리스트 (Pro 전용) ── */}
      {modalTarget && proUser && (
        <FieldChecklist
          targetName={modalTarget.name}
          onComplete={() => {}} // 완료 시 버튼 등은 checklist 내부에 있으므로 추가 작업 생략 가능
          onSkip={() => setModalTarget(null)}
        />
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
