"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getTaskLedgers, getWorkers, TaskLedger, Profile } from "@/lib/adminDb";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default function StatsPage() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<TaskLedger[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedPin = sessionStorage.getItem("workspace_pin");
    if (!savedPin) {
      router.push("/admin");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const l = await getTaskLedgers();
      const w = await getWorkers();
      setLedgers(l);
      setWorkers(w);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const workerStats = useMemo(() => {
    const stats: Record<string, {
      id: string;
      name: string;
      assigned: number;
      completed: number;
      totalArrears: number;
      totalPaid: number;
    }> = {};

    workers.forEach(w => {
      stats[w.id] = {
        id: w.id,
        name: w.name || "이름없음",
        assigned: 0,
        completed: 0,
        totalArrears: 0,
        totalPaid: 0
      };
    });

    ledgers.forEach(l => {
      if (l.assigned_worker_id && stats[l.assigned_worker_id]) {
        stats[l.assigned_worker_id].assigned += 1;
        if (l.current_status === "COMPLETED") {
          stats[l.assigned_worker_id].completed += 1;
        }
        stats[l.assigned_worker_id].totalArrears += (l.arrears_amount || 0);
        stats[l.assigned_worker_id].totalPaid += (l.paid_amount || 0);
      }
    });

    return Object.values(stats).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [ledgers, workers]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Pretendard', sans-serif" }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "28px", margin: "0 0 8px 0" }}>실적 및 분석 통계</h1>
            <p style={{ color: "#94a3b8", margin: 0 }}>실태확인원별 누적 배정 건수, 완료 건수, 체납 회수 실적을 파악합니다.</p>
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "16px", padding: "24px", border: "1px solid #334155" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #334155" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>순위</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>실태확인원명</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>총 배정 건수</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>방문 완료 건수</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>할당된 체납액</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#10b981" }}>실 회수액</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#60a5fa" }}>회수율</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>로딩 중...</td></tr>
                ) : workerStats.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>실태확인원 데이터가 없습니다.</td></tr>
                ) : (
                  workerStats.map((stat, index) => {
                    const recoveryRate = stat.totalArrears > 0 ? ((stat.totalPaid / stat.totalArrears) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={stat.id} style={{ borderBottom: "1px solid #334155", background: index < 3 ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
                        <td style={{ padding: "12px", fontWeight: "bold", color: index === 0 ? "#fbbf24" : index === 1 ? "#94a3b8" : index === 2 ? "#b45309" : "white" }}>
                          {index + 1}위
                        </td>
                        <td style={{ padding: "12px", fontWeight: "bold" }}>{stat.name}</td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#cbd5e1" }}>{stat.assigned.toLocaleString()}건</td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#cbd5e1" }}>{stat.completed.toLocaleString()}건</td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#f87171" }}>{stat.totalArrears.toLocaleString()}원</td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{stat.totalPaid.toLocaleString()}원</td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold", color: "#60a5fa" }}>{recoveryRate}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
