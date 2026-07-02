"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getTaskLedgers, getWorkers, getAdminPinHash, TaskLedger, Profile } from "@/lib/adminDb";
import { hashPin } from "@/utils/crypto";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminDashboard() {
  const router = useRouter();
  const [pin, setPin] = useState<string>("");
  const [isPinEntered, setIsPinEntered] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);
  const [dbPinHash, setDbPinHash] = useState<string | null>(null);
  
  const [ledgers, setLedgers] = useState<TaskLedger[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const hash = await getAdminPinHash();
      setDbPinHash(hash);
      if (!hash) {
        router.push("/admin/security");
        return;
      }

      const savedPin = sessionStorage.getItem("workspace_pin");
      if (savedPin) {
        if (hash) {
          const hashedSavedPin = await hashPin(savedPin);
          if (hashedSavedPin === hash) {
            setPin(savedPin);
            setIsPinEntered(true);
            loadData(savedPin);
          } else {
            sessionStorage.removeItem("workspace_pin");
          }
        }
      }
      setIsCheckingPin(false);
    }
    init();
  }, [router]);

  const loadData = async (currentPin: string) => {
    setLoading(true);
    try {
      const tLedgers = await getTaskLedgers();
      const tWorkers = await getWorkers();
      setLedgers(tLedgers);
      setWorkers(tWorkers);
    } catch (error) {
      console.error("데이터 로딩 오류:", error);
    }
    setLoading(false);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbPinHash) return;
    const inputHash = await hashPin(pin);
    if (inputHash === dbPinHash) {
      sessionStorage.setItem("workspace_pin", pin);
      setIsPinEntered(true);
      loadData(pin);
    } else {
      alert("PIN 번호가 일치하지 않습니다.");
      setPin("");
    }
  };

  const sendPushNotification = (workerId: string | null) => {
    if (!workerId) {
      alert("배정된 실태확인원이 없습니다.");
      return;
    }
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    alert(`[PUSH 발송 완료] ${worker.name}(${worker.phone})님에게 긴급 확인 요청 문자를 발송했습니다.`);
  };

  // 통계 계산
  const stats = useMemo(() => {
    let totalArrears = 0;
    let totalPaid = 0;
    let unassigned = 0;
    let completed = 0;
    const slaAlerts: TaskLedger[] = [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const periodStats = {
      today: { total: 0, completed: 0 },
      week: { total: 0, completed: 0 },
      month: { total: 0, completed: 0 },
      all: { total: 0, completed: 0, unassigned: 0 }
    };

    ledgers.forEach(l => {
      // 재무 데이터
      totalArrears += (l.arrears_amount || 0);
      totalPaid += (l.paid_amount || 0);

      // 현황
      if (l.current_status === "UNASSIGNED") unassigned++;
      if (l.current_status === "COMPLETED") completed++;

      // 기간별 처리
      const createdAt = new Date(l.created_at);
      const isCompleted = l.current_status === "COMPLETED";

      periodStats.all.total++;
      if (isCompleted) periodStats.all.completed++;
      if (l.current_status === "UNASSIGNED") periodStats.all.unassigned++;

      if (createdAt >= today) {
        periodStats.today.total++;
        if (isCompleted) periodStats.today.completed++;
      }
      if (createdAt >= thisWeek) {
        periodStats.week.total++;
        if (isCompleted) periodStats.week.completed++;
      }
      if (createdAt >= thisMonth) {
        periodStats.month.total++;
        if (isCompleted) periodStats.month.completed++;
      }

      // SLA 경고 (방문 3회 이상 실패 또는 메모에 욕설/거부 포함)
      if (l.failed_visit_count >= 3 || (l.worker_memo && (l.worker_memo.includes("욕설") || l.worker_memo.includes("거부")))) {
        slaAlerts.push(l);
      }
    });

    const recoveryRate = totalArrears > 0 ? ((totalPaid / totalArrears) * 100).toFixed(1) : "0.0";

    return { totalArrears, totalPaid, recoveryRate, unassigned, completed, total: ledgers.length, slaAlerts, periodStats };
  }, [ledgers]);

  if (isCheckingPin) {
    return <div style={{ padding: "40px", color: "white" }}>확인 중...</div>;
  }

  if (!isPinEntered) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#0f172a", alignItems: "center", justify: "center" }}>
        <div style={{ background: "#1e293b", padding: "40px", borderRadius: "16px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", border: "1px solid #334155", maxWidth: "400px", width: "90%" }}>
          <h2 style={{ color: "white", marginTop: 0, marginBottom: "8px" }}>관리자 접속</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>안전한 환경을 위해 PIN을 입력해 주세요.</p>
          <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input type="password" placeholder="PIN 6자리" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "white", fontSize: "16px", textAlign: "center", letterSpacing: "4px" }} />
            <button type="submit" style={{ padding: "12px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>접속하기</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Pretendard', sans-serif" }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: "32px", overflowY: "auto", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "28px", margin: "0 0 8px 0" }}>종합 상황판 (Control Tower)</h1>
            <p style={{ color: "#94a3b8", margin: 0 }}>전체 재무 실적 및 긴급 이슈를 한눈에 파악하세요.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ color: "white", textAlign: "center", padding: "40px" }}>데이터를 불러오는 중입니다...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 재무 실적 최적화 위젯 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
              <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", padding: "24px", borderRadius: "16px", border: "1px solid #334155", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <h3 style={{ color: "#94a3b8", margin: "0 0 8px 0", fontSize: "14px" }}>총 체납액 (Arrears)</h3>
                <div style={{ color: "white", fontSize: "32px", fontWeight: "bold" }}>{stats.totalArrears.toLocaleString()} <span style={{fontSize: "16px", color: "#64748b"}}>원</span></div>
              </div>
              <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", padding: "24px", borderRadius: "16px", border: "1px solid #334155", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                <h3 style={{ color: "#10b981", margin: "0 0 8px 0", fontSize: "14px" }}>실 회수액 (Recovered)</h3>
                <div style={{ color: "#10b981", fontSize: "32px", fontWeight: "bold" }}>{stats.totalPaid.toLocaleString()} <span style={{fontSize: "16px", color: "#059669"}}>원</span></div>
              </div>
              <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", padding: "24px", borderRadius: "16px", border: "1px solid #3b82f6", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.2)" }}>
                <h3 style={{ color: "#60a5fa", margin: "0 0 8px 0", fontSize: "14px" }}>회수율 (Recovery Rate)</h3>
                <div style={{ color: "#60a5fa", fontSize: "32px", fontWeight: "bold" }}>{stats.recoveryRate} <span style={{fontSize: "20px"}}>%</span></div>
              </div>
            </div>

            {/* SLA 긴급 경고반 */}
            <div style={{ background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #ef4444" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: "#ef4444", color: "white", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>!</div>
                <h2 style={{ color: "white", margin: 0, fontSize: "20px" }}>긴급 대응반 (SLA Alerts)</h2>
              </div>
              
              {stats.slaAlerts.length === 0 ? (
                <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>현재 대응이 필요한 긴급 이슈가 없습니다. 🌟</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {stats.slaAlerts.map(alert => (
                    <div key={alert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #ef4444" }}>
                      <div>
                        <div style={{ color: "white", fontWeight: "bold", marginBottom: "4px" }}>{alert.master_ledger?.name || "알 수 없음"} (체납: {alert.arrears_amount?.toLocaleString() || 0}원)</div>
                        <div style={{ color: "#ef4444", fontSize: "14px" }}>사유: {alert.failed_visit_count >= 3 ? "3회 이상 방문 실패 " : ""}{alert.worker_memo}</div>
                      </div>
                      <button 
                        onClick={() => sendPushNotification(alert.assigned_worker_id)}
                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#ef4444", color: "white", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        📲 담당자 긴급 푸시 발송
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 작업 현황 요약 */}
            <div style={{ display: "flex", gap: "20px" }}>
               <div style={{ flex: 1, background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155" }}>
                <h3 style={{ color: "#94a3b8", margin: "0 0 16px 0", fontSize: "16px" }}>기간별 작업 현황 (건)</h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", borderBottom: "1px solid #334155", paddingBottom: "8px", marginBottom: "12px", color: "#64748b", fontSize: "14px", fontWeight: "bold" }}>
                  <div>기간</div>
                  <div style={{ textAlign: "right" }}>배정(발생)</div>
                  <div style={{ textAlign: "right" }}>완료</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", paddingBottom: "12px", marginBottom: "8px", borderBottom: "1px solid rgba(51,65,85,0.5)" }}>
                  <div style={{ color: "white" }}>금일</div>
                  <div style={{ color: "#cbd5e1", textAlign: "right" }}>{stats.periodStats.today.total}</div>
                  <div style={{ color: "#10b981", textAlign: "right", fontWeight: "bold" }}>{stats.periodStats.today.completed}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", paddingBottom: "12px", marginBottom: "8px", borderBottom: "1px solid rgba(51,65,85,0.5)" }}>
                  <div style={{ color: "white" }}>금주</div>
                  <div style={{ color: "#cbd5e1", textAlign: "right" }}>{stats.periodStats.week.total}</div>
                  <div style={{ color: "#10b981", textAlign: "right", fontWeight: "bold" }}>{stats.periodStats.week.completed}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", paddingBottom: "12px", marginBottom: "8px", borderBottom: "1px solid rgba(51,65,85,0.5)" }}>
                  <div style={{ color: "white" }}>금월</div>
                  <div style={{ color: "#cbd5e1", textAlign: "right" }}>{stats.periodStats.month.total}</div>
                  <div style={{ color: "#10b981", textAlign: "right", fontWeight: "bold" }}>{stats.periodStats.month.completed}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", paddingTop: "4px" }}>
                  <div style={{ color: "#3b82f6", fontWeight: "bold" }}>누적 총계</div>
                  <div style={{ color: "white", textAlign: "right", fontWeight: "bold" }}>{stats.periodStats.all.total}</div>
                  <div style={{ color: "#10b981", textAlign: "right", fontWeight: "bold" }}>{stats.periodStats.all.completed}</div>
                </div>
                
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#cbd5e1", fontSize: "14px" }}>현재 미배정 대기</span>
                  <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{stats.periodStats.all.unassigned} 건</span>
                </div>
              </div>
              <div style={{ flex: 1, background: "#1e293b", padding: "24px", borderRadius: "16px", border: "1px solid #334155", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <h3 style={{ color: "white", marginBottom: "12px" }}>배정 업무를 시작하시겠습니까?</h3>
                <p style={{ color: "#94a3b8", marginBottom: "20px", fontSize: "14px" }}>캠페인 및 배정 관리 메뉴에서 초고속 일괄 배정을 진행하세요.</p>
                <button onClick={() => router.push('/admin/campaigns')} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>
                  캠페인 및 배정 관리 이동 ➡️
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
