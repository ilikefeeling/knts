"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getTaskLedgers, getAdminPinHash, getDashboardStats, getRecentActivities, TaskLedger, type DashboardWorkerSummary, type RecentActivity } from "@/lib/adminDb";
import { hashPin } from "@/utils/crypto";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminDashboard() {
  const router = useRouter();
  const [pin, setPin] = useState<string>("");
  const [isPinEntered, setIsPinEntered] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);
  const [dbPinHash, setDbPinHash] = useState<string | null>(null);
  
  const [ledgers, setLedgers] = useState<TaskLedger[]>([]);
  const [dashWorkers, setDashWorkers] = useState<DashboardWorkerSummary[]>([]);
  const [statusCounts, setStatusCounts] = useState({ unassigned: 0, assigned: 0, pending: 0, completed: 0 });
  const [licenseInfo, setLicenseInfo] = useState<{ totalSlots: number; usedSlots: number; validUntil: string; isValid: boolean } | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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
            loadAllData();
          } else {
            sessionStorage.removeItem("workspace_pin");
          }
        }
      }
      setIsCheckingPin(false);
    }
    init();
  }, [router]);

  // 30초 자동 새로고침
  useEffect(() => {
    if (!isPinEntered) return;
    const interval = setInterval(() => {
      loadAllData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [isPinEntered]);

  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [tLedgers, dashStats, activities] = await Promise.all([
        getTaskLedgers(),
        getDashboardStats(),
        getRecentActivities(8),
      ]);
      setLedgers(tLedgers);
      setDashWorkers(dashStats.workers);
      setStatusCounts(dashStats.statusCounts);
      setLicenseInfo(dashStats.licenseInfo);
      setRecentActivities(activities);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("대시보드 데이터 로딩 오류:", error);
    }
    if (!silent) setLoading(false);
    else setRefreshing(false);
  }, []);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbPinHash) return;
    const inputHash = await hashPin(pin);
    if (inputHash === dbPinHash) {
      sessionStorage.setItem("workspace_pin", pin);
      setIsPinEntered(true);
      loadAllData();
    } else {
      alert("PIN 번호가 일치하지 않습니다.");
      setPin("");
    }
  };

  // 통계 계산
  const stats = useMemo(() => {
    let totalArrears = 0;
    let totalPaid = 0;
    const slaAlerts: TaskLedger[] = [];

    ledgers.forEach(l => {
      totalArrears += Number(String(l.arrears_amount || 0).replace(/,/g, "")) || 0;
      totalPaid += Number(String((l as any).paid_amount || 0).replace(/,/g, "")) || 0;

      if (l.failed_visit_count >= 3 || (l.worker_memo && (l.worker_memo.includes("욕설") || l.worker_memo.includes("거부")))) {
        slaAlerts.push(l);
      }
    });

    const recoveryRate = totalArrears > 0 ? ((totalPaid / totalArrears) * 100).toFixed(1) : "0.0";
    const totalCount = statusCounts.unassigned + statusCounts.assigned + statusCounts.pending + statusCounts.completed;

    return { totalArrears, totalPaid, recoveryRate, slaAlerts, totalCount };
  }, [ledgers, statusCounts]);

  // 도넛 차트 비율 계산
  const donutData = useMemo(() => {
    const total = stats.totalCount || 1;
    return {
      completedPct: (statusCounts.completed / total) * 100,
      assignedPct: ((statusCounts.assigned + statusCounts.pending) / total) * 100,
      unassignedPct: (statusCounts.unassigned / total) * 100,
    };
  }, [statusCounts, stats.totalCount]);

  // 활동 타입 레이블
  const getActivityLabel = (type: string) => {
    const map: Record<string, { label: string; color: string; icon: string }> = {
      "ASSIGN": { label: "배정", color: "#3b82f6", icon: "📋" },
      "REASSIGN": { label: "재배정", color: "#f59e0b", icon: "🔄" },
      "UNASSIGN": { label: "배정해제", color: "#ef4444", icon: "❌" },
      "ACCEPT": { label: "수락", color: "#10b981", icon: "✅" },
      "REJECT": { label: "거부", color: "#ef4444", icon: "🚫" },
    };
    return map[type] || { label: type, color: "#64748b", icon: "📌" };
  };

  // 시간 상대 표시
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "방금 전";
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  if (isCheckingPin) {
    return <div style={{ padding: "40px", color: "white", background: "#0f172a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>확인 중...</div>;
  }

  if (!isPinEntered) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#0f172a", alignItems: "center", justifyContent: "center" }}>
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

  // 도넛 차트 CSS conic-gradient
  const conicGradient = `conic-gradient(
    #10b981 0% ${donutData.completedPct}%, 
    #3b82f6 ${donutData.completedPct}% ${donutData.completedPct + donutData.assignedPct}%, 
    #475569 ${donutData.completedPct + donutData.assignedPct}% 100%
  )`;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Pretendard', sans-serif" }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: "32px", overflowY: "auto", position: "relative" }}>
        
        {/* 헤더 + 새로고침 + 시스템 상태 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "28px", margin: "0 0 4px 0", fontWeight: 800 }}>종합 상황판 (Control Tower)</h1>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>전체 재무 실적, 인력 현황 및 긴급 이슈를 한눈에 파악하세요.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* 시스템 상태 */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94a3b8" }}>
              <span className={`status-dot ${licenseInfo?.isValid ? 'online' : 'warning'}`}></span>
              {licenseInfo ? (
                <span>슬롯 {licenseInfo.usedSlots}/{licenseInfo.totalSlots} · 만료 {new Date(licenseInfo.validUntil).toLocaleDateString('ko-KR')}</span>
              ) : (
                <span>라이선스 확인 중</span>
              )}
            </div>
            {/* 새로고침 */}
            <button 
              onClick={() => loadAllData(true)}
              disabled={refreshing}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
            >
              <span className={refreshing ? "refresh-spin" : ""}>🔄</span>
              {refreshing ? "갱신 중" : `${lastRefresh.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준`}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: "white", textAlign: "center", padding: "80px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
            데이터를 불러오는 중입니다...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* ── Section 1: KPI 카드 4열 ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {/* 총 관리 건수 */}
              <div className="glass-card dash-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ color: "#94a3b8", margin: "0 0 8px 0", fontSize: "13px", fontWeight: 600 }}>총 관리 건수</h3>
                  <span style={{ fontSize: "22px" }}>📊</span>
                </div>
                <div style={{ color: "white", fontSize: "32px", fontWeight: "bold", lineHeight: 1.2 }}>
                  {stats.totalCount.toLocaleString()}
                  <span style={{ fontSize: "15px", color: "#64748b", marginLeft: "4px" }}>건</span>
                </div>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                  미배정 <span style={{ color: "#f59e0b", fontWeight: 600 }}>{statusCounts.unassigned}</span> · 진행중 <span style={{ color: "#3b82f6", fontWeight: 600 }}>{statusCounts.assigned + statusCounts.pending}</span> · 완료 <span style={{ color: "#10b981", fontWeight: 600 }}>{statusCounts.completed}</span>
                </div>
              </div>

              {/* 총 체납액 */}
              <div className="glass-card dash-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ color: "#94a3b8", margin: "0 0 8px 0", fontSize: "13px", fontWeight: 600 }}>총 체납액</h3>
                  <span style={{ fontSize: "22px" }}>💰</span>
                </div>
                <div style={{ color: "white", fontSize: "28px", fontWeight: "bold", lineHeight: 1.2 }}>
                  {stats.totalArrears.toLocaleString()}
                  <span style={{ fontSize: "14px", color: "#64748b", marginLeft: "4px" }}>원</span>
                </div>
              </div>

              {/* 실 회수액 */}
              <div className="glass-card dash-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ color: "#10b981", margin: "0 0 8px 0", fontSize: "13px", fontWeight: 600 }}>실 회수액</h3>
                  <span style={{ fontSize: "22px" }}>✅</span>
                </div>
                <div style={{ color: "#10b981", fontSize: "28px", fontWeight: "bold", lineHeight: 1.2 }}>
                  {stats.totalPaid.toLocaleString()}
                  <span style={{ fontSize: "14px", color: "#059669", marginLeft: "4px" }}>원</span>
                </div>
              </div>

              {/* 회수율 */}
              <div className="glass-card dash-fade-in" style={{ borderColor: "rgba(59, 130, 246, 0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ color: "#60a5fa", margin: "0 0 8px 0", fontSize: "13px", fontWeight: 600 }}>회수율</h3>
                  <span style={{ fontSize: "22px" }}>📈</span>
                </div>
                <div style={{ color: "#60a5fa", fontSize: "32px", fontWeight: "bold", lineHeight: 1.2 }}>
                  {stats.recoveryRate}
                  <span style={{ fontSize: "18px" }}>%</span>
                </div>
              </div>
            </div>

            {/* ── Section 2: 2열 레이아웃 (도넛 + 실태확인원 현황) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
              
              {/* 배정 현황 도넛 차트 */}
              <div className="glass-card dash-fade-in">
                <h3 style={{ color: "white", margin: "0 0 20px 0", fontSize: "16px", fontWeight: 700 }}>배정 현황</h3>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                  <div className="donut-chart" style={{ background: conicGradient }}>
                    <div className="donut-center">
                      <span style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>{stats.totalCount}</span>
                      <span style={{ color: "#94a3b8", fontSize: "11px" }}>총 건수</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#10b981", display: "inline-block" }}></span>
                        <span style={{ color: "#cbd5e1" }}>완료</span>
                      </span>
                      <span style={{ color: "#10b981", fontWeight: 600 }}>{statusCounts.completed}건 ({donutData.completedPct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#3b82f6", display: "inline-block" }}></span>
                        <span style={{ color: "#cbd5e1" }}>진행중</span>
                      </span>
                      <span style={{ color: "#3b82f6", fontWeight: 600 }}>{statusCounts.assigned + statusCounts.pending}건 ({donutData.assignedPct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#475569", display: "inline-block" }}></span>
                        <span style={{ color: "#cbd5e1" }}>미배정</span>
                      </span>
                      <span style={{ color: "#94a3b8", fontWeight: 600 }}>{statusCounts.unassigned}건 ({donutData.unassignedPct.toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 실태확인원 현황 카드 */}
              <div className="glass-card dash-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ color: "white", margin: 0, fontSize: "16px", fontWeight: 700 }}>실태확인원 현황</h3>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                    <span style={{ color: "#94a3b8" }}>등록 <span style={{ color: "white", fontWeight: 600 }}>{dashWorkers.length}명</span></span>
                    <span style={{ color: "#94a3b8" }}>활성 <span style={{ color: "#10b981", fontWeight: 600 }}>{dashWorkers.filter(w => w.status === "ACTIVE").length}명</span></span>
                    <span style={{ color: "#94a3b8" }}>가이드 미완료 <span style={{ color: "#f59e0b", fontWeight: 600 }}>{dashWorkers.filter(w => !w.guide_completed_at).length}명</span></span>
                  </div>
                </div>

                {dashWorkers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>👤</div>
                    등록된 실태확인원이 없습니다.
                    <div style={{ marginTop: "12px" }}>
                      <Link href="/admin/workers" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>실태확인원 등록하기 →</Link>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "260px", overflowY: "auto" }}>
                    {dashWorkers.map(w => {
                      const todayTotal = w.assigned_today + w.completed_today;
                      const progressPct = todayTotal > 0 ? (w.completed_today / todayTotal) * 100 : 0;
                      return (
                        <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(51, 65, 85, 0.3)" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: w.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                            {w.status === "ACTIVE" ? "🟢" : "⚪"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>{w.name}</span>
                              <span style={{ color: "#64748b", fontSize: "11px" }}>총 {w.assigned_count}건 배정</span>
                            </div>
                            <div className="progress-bar-track">
                              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", fontSize: "11px", color: "#64748b" }}>
                              <span>오늘 완료 {w.completed_today}건</span>
                              <span>{progressPct.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 3: 2열 레이아웃 (SLA 경고 + 최근 활동) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              
              {/* SLA 긴급 경고 */}
              <div className="glass-card dash-fade-in" style={{ borderColor: stats.slaAlerts.length > 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(148, 163, 184, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ background: stats.slaAlerts.length > 0 ? "#ef4444" : "#334155", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                    {stats.slaAlerts.length > 0 ? "!" : "✓"}
                  </div>
                  <h3 style={{ color: "white", margin: 0, fontSize: "16px", fontWeight: 700 }}>긴급 대응 (SLA)</h3>
                  {stats.slaAlerts.length > 0 && (
                    <span style={{ background: "#ef4444", color: "white", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>{stats.slaAlerts.length}건</span>
                  )}
                </div>
                
                {stats.slaAlerts.length === 0 ? (
                  <div style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0", fontSize: "14px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🌟</div>
                    현재 대응이 필요한 긴급 이슈가 없습니다.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
                    {stats.slaAlerts.slice(0, 5).map(alert => (
                      <div key={alert.id} style={{ background: "rgba(15, 23, 42, 0.6)", padding: "12px", borderRadius: "8px", borderLeft: "3px solid #ef4444" }}>
                        <div style={{ color: "white", fontWeight: 600, fontSize: "13px", marginBottom: "2px" }}>
                          {alert.master_ledger?.name || "알 수 없음"} 
                          <span style={{ color: "#ef4444", fontWeight: 400, marginLeft: "8px", fontSize: "12px" }}>
                            체납: {(Number(String(alert.arrears_amount || 0).replace(/,/g, "")) || 0).toLocaleString()}원
                          </span>
                        </div>
                        <div style={{ color: "#f87171", fontSize: "12px" }}>
                          {alert.failed_visit_count >= 3 ? `⚠ ${alert.failed_visit_count}회 방문 실패 ` : ""}
                          {alert.worker_memo || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 최근 활동 타임라인 */}
              <div className="glass-card dash-fade-in">
                <h3 style={{ color: "white", margin: "0 0 12px 0", fontSize: "16px", fontWeight: 700 }}>최근 활동</h3>
                {recentActivities.length === 0 ? (
                  <div style={{ color: "#64748b", textAlign: "center", padding: "24px 0", fontSize: "14px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📭</div>
                    아직 기록된 활동이 없습니다.
                  </div>
                ) : (
                  <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                    {recentActivities.map(act => {
                      const info = getActivityLabel(act.action_type);
                      return (
                        <div key={act.id} className="timeline-item">
                          <div className="timeline-dot" style={{ background: info.color }}></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#e2e8f0", fontSize: "13px" }}>
                              <span style={{ marginRight: "4px" }}>{info.icon}</span>
                              <span style={{ fontWeight: 600 }}>{info.label}</span>
                              {act.worker_name && <span style={{ color: "#94a3b8" }}> · {act.worker_name}</span>}
                            </div>
                            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>{timeAgo(act.created_at)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 4: 빠른 액션 패널 ── */}
            <div className="dash-fade-in">
              <h3 style={{ color: "#94a3b8", margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, letterSpacing: "0.5px" }}>⚡ 빠른 액션</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                <Link href="/admin/campaigns?upload=true" className="quick-action-card">
                  <span className="quick-action-icon">📥</span>
                  엑셀 업로드
                </Link>
                <Link href="/admin/campaigns" className="quick-action-card">
                  <span className="quick-action-icon">📋</span>
                  방문 배정
                </Link>
                <Link href="/admin/workers" className="quick-action-card">
                  <span className="quick-action-icon">👤</span>
                  확인원 관리
                </Link>
                <Link href="/admin/report" className="quick-action-card">
                  <span className="quick-action-icon">📄</span>
                  보고서 출력
                </Link>
                <Link href="/admin/stats" className="quick-action-card">
                  <span className="quick-action-icon">📊</span>
                  실적 통계
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
