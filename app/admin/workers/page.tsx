"use client";

import React, { useState, useEffect } from "react";
import { getWorkers, getTaskLedgers, registerWorkerAccount, updateWorker, deleteWorker, sendMockSMS, forceGuideComplete, Profile, TaskLedger } from "@/lib/adminDb";
import Link from "next/link";
import * as XLSX from "xlsx";
import AdminSidebar from "@/components/AdminSidebar";

export default function WorkerManagementPage() {
  const [pin, setPin] = useState<string>("");
  const [isPinEntered, setIsPinEntered] = useState(false);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [ledgers, setLedgers] = useState<TaskLedger[]>([]);
  const [loading, setLoading] = useState(false);

  // 등록 모달 상태
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [wName, setWName] = useState("");
  const [wPhone, setWPhone] = useState("");
  const [wPin, setWPin] = useState("");
  const [wSendSms, setWSendSms] = useState(true);
  const [wLoading, setWLoading] = useState(false);

  // 엑셀 대량 등록
  const workerFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingWorkers, setIsUploadingWorkers] = useState(false);

  // 수정 모달 상태
  const [showEditWorker, setShowEditWorker] = useState(false);
  const [editWorkerId, setEditWorkerId] = useState("");
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");

  // 다중 선택 상태
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);

  const toggleWorkerSelect = (id: string) => {
    setSelectedWorkerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const toggleSelectAll = () => {
    if (selectedWorkerIds.length === workers.length && workers.length > 0) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(workers.map(w => w.id));
    }
  };

  useEffect(() => {
    const savedPin = sessionStorage.getItem("workspace_pin");
    if (savedPin) {
      setPin(savedPin);
      setIsPinEntered(true);
      loadData();
    } else {
      window.location.href = "/admin"; // 핀 번호 없으면 대시보드로 튕기기
    }

    // 테스트 로그아웃 자동 초기화 감지
    const handleMessage = async (event: MessageEvent) => {
      if (event.data === "TEST_LOGOUT") {
        try {
          await fetch("/api/admin/reset-test", { method: "POST" });
          await loadData();
          alert("실태확인원 테스트가 종료되어 테스트 데이터가 자동으로 초기화되었습니다.");
        } catch (e) {
          console.error("자동 초기화 실패", e);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [workerData, ledgerData] = await Promise.all([
        getWorkers(),
        getTaskLedgers()
      ]);
      setWorkers(workerData);
      setLedgers(ledgerData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatPhoneNumber = (value: string) => {
    if (!value) return "";
    const onlyNums = value.replace(/[^0-9]/g, "");
    if (onlyNums.length <= 3) return onlyNums;
    if (onlyNums.length <= 7) return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
  };

  async function handleRegisterWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!wName || !wPhone || !wPin) return alert("입력값을 확인해주세요.");
    if (wPin.length < 4) return alert("초기 비밀번호는 최소 4자리 이상이어야 합니다. (예: 1234)");
    setWLoading(true);
    try {
      const res = await registerWorkerAccount(wName, wPhone, wPin);
      if (!res.success) {
        alert(res.message);
        return;
      }
      
      let smsResSuccess = false;
      let smsResMessage = "";
      
      if (wSendSms && res.workerId) {
        const smsRes = await sendMockSMS([res.workerId], wPin);
        smsResSuccess = smsRes.success;
        smsResMessage = smsRes.message || "";
      }

      setShowAddWorker(false);
      setWName("");
      setWPhone("");
      setWPin("");
      setWSendSms(true);
      loadData();

      setTimeout(() => {
        if (wSendSms && res.workerId) {
          if (smsResSuccess) {
            alert(`✅ ${wName} 실태확인원이 성공적으로 등록되었습니다.\n\n초기 비밀번호(PIN): [ ${wPin} ]\n\n안내 메시지 발송이 예약되었습니다.`);
          } else {
            alert(`✅ ${wName} 실태확인원이 등록되었습니다.\n\n초기 비밀번호(PIN): [ ${wPin} ]\n\n(단, 안내 메시지 발송에 실패했습니다: ${smsResMessage})`);
          }
        } else {
          alert(`✅ ${wName} 실태확인원이 성공적으로 등록되었습니다.\n\n초기 비밀번호(PIN): [ ${wPin} ]\n\n해당 실태확인원에게 접속 주소와 초기 비밀번호를 안내해 주세요.`);
        }

        const currentHost = window.location.hostname;
        let targetHost = currentHost;
        if (currentHost === 'localhost') {
          targetHost = '127.0.0.1';
        } else if (currentHost === '127.0.0.1') {
          targetHost = 'localhost';
        }
        const port = window.location.port ? ':' + window.location.port : '';
        const targetUrl = window.location.protocol + '//' + targetHost + port + '/login';

        // Session collision alert removed per user request
        window.open(targetUrl, "_blank");
      }, 100);
    } catch (err: any) {
      alert("클라이언트 에러: " + err.message);
    } finally {
      setWLoading(false);
    }
  }

  const handleWorkerExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWorkers(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(firstSheet);

      if (rows.length === 0) {
        alert("엑셀 파일에 데이터가 없습니다.");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const row of rows) {
        const name = row["이름"] || row["성명"] || row["Name"];
        const phone = row["전화번호"] || row["연락처"] || row["Phone"];
        
        let pinVal = row["초기비밀번호"] || row["비밀번호"] || row["PIN"];
        if (!pinVal && phone) {
          const phoneStr = String(phone).replace(/[^0-9]/g, "");
          pinVal = phoneStr.length >= 4 ? phoneStr.slice(-4) : "1234";
        } else if (!pinVal) {
          pinVal = "1234";
        }

        if (!name || !phone) {
          failCount++;
          continue;
        }

        const safePhone = formatPhoneNumber(String(phone));
        const res = await registerWorkerAccount(String(name), safePhone, String(pinVal));
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      alert(`대량 등록 완료!\n- 성공: ${successCount}건\n- 실패(양식 오류 또는 중복): ${failCount}건\n\n* 엑셀 파일에 비밀번호를 비워둔 경우, 자동으로 해당 실태확인원의 '전화번호 뒷 4자리'가 초기 PIN번호로 설정되었습니다.`);
      
      if (successCount > 0) {
        const sendBulkSms = window.confirm(`${successCount}명의 실태확인원이 새로 등록되었습니다.\n아직 안내 메시지를 받지 않은 실태확인원 전원에게 등록 안내 메시지를 일괄 발송하시겠습니까?`);
        if (sendBulkSms) {
          const workerData = await getWorkers();
          const unnotifiedIds = workerData.filter(w => !w.is_notified).map(w => w.id);
          if (unnotifiedIds.length > 0) {
            const smsRes = await sendMockSMS(unnotifiedIds, pin);
            if (smsRes.success) {
              alert(`총 ${smsRes.sentCount}명에게 안내 메시지 발송이 예약되었습니다.`);
            } else {
              alert(`안내 메시지 발송 실패: ${smsRes.message}`);
            }
          } else {
            alert("발송 대상이 없습니다. (모두 이미 메시지를 받았습니다)");
          }
        }
      }

      loadData();
    } catch (err: any) {
      alert("엑셀 처리 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsUploadingWorkers(false);
      if (workerFileInputRef.current) workerFileInputRef.current.value = "";
    }
  };

  async function handleEditWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!editName) return alert("이름을 입력해주세요.");
    if (editPin && editPin.length < 4) return alert("비밀번호는 최소 4자리 이상이어야 합니다.");
    
    setWLoading(true);
    try {
      const res = await updateWorker(editWorkerId, editName, editPin || undefined);
      if (!res.success) {
        alert("수정 실패: " + res.message);
        return;
      }
      alert("수정되었습니다.");
      setShowEditWorker(false);
      loadData();
    } catch (err: any) {
      alert("오류: " + err.message);
    } finally {
      setWLoading(false);
    }
  }

  async function handleDeleteWorker(id: string, name: string) {
    if (!window.confirm(`${name} 실태확인원을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    
    setLoading(true);
    try {
      const res = await deleteWorker(id);
      if (!res.success) {
        alert("삭제 실패: " + res.message);
        return;
      }
      alert("삭제되었습니다.");
      setSelectedWorkerIds(prev => prev.filter(wid => wid !== id));
      loadData();
    } catch (err: any) {
      alert("오류: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isPinEntered) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <AdminSidebar onTestGuideSuccess={() => loadData()} />

      {/* ── 메인 콘텐츠 ── */}
      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>실태확인원 관리</h3>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {selectedWorkerIds.length > 0 && (
              <button 
                onClick={() => {
                  const selectedPhones = workers
                    .filter(w => selectedWorkerIds.includes(w.id))
                    .map(w => (w.phone || "").replace(/[^0-9]/g, ""))
                    .filter(p => p.length > 0)
                    .join(",");
                  const msg = encodeURIComponent(`[체납관리단] 안녕하세요 실태확인원님, 관리자입니다.\n`);
                  window.location.href = `sms:${selectedPhones}?body=${msg}`;
                }}
                style={{ padding: "10px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", animation: "fadeIn 0.2s ease-out" }}
              >
                {selectedWorkerIds.length}명 선택 문자 발송
              </button>
            )}
            <button 
              onClick={() => {
                window.location.href = "/admin/security";
              }}
              style={{ padding: "10px 16px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
            >
              핀번호생성
            </button>
            <button 
              onClick={async () => {
                const proceed = window.confirm("💡 [테스트 시작 전 주의사항]\n\n실태확인원 앱에 로그인하면 가장 먼저 '6자리 마스터 PIN'을 요구합니다.\n이 PIN 번호는 이제 관리자님께서 [보안 관리 센터] 메뉴에서 설정하셔야 하는 '마스터 암호화 키(6자리 숫자)'를 의미합니다.\n\n만약 PIN 번호를 아직 생성하지 않으셨다면, 취소를 누르고 왼쪽 메뉴의 [보안 관리 센터]로 이동하여 먼저 PIN 번호를 생성해 주세요.\n\n계속해서 실태확인원 로그인 창을 여시겠습니까?");
                
                if (proceed) {
                  try {
                    // 1초 테스트 시작 시, 이전에 테스트했던 데이터(보고서, 가이드 수료 등)를 초기화합니다.
                    const res = await fetch("/api/admin/reset-test", { method: "POST" });
                    if (!res.ok) {
                      const errData = await res.json();
                      alert("테스트 데이터 초기화 중 서버 오류가 발생했습니다: " + (errData.error || res.statusText));
                      return;
                    }
                    // 즉각적으로 화면 상태를 업데이트합니다.
                    await loadData();
                  } catch (e: any) {
                    console.error("테스트 데이터 초기화 실패", e);
                    alert("테스트 데이터 초기화 중 네트워크 오류가 발생했습니다.");
                    return;
                  }

                  const currentHost = window.location.hostname;
                  let targetHost = currentHost;
                  if (currentHost === 'localhost') {
                    targetHost = '127.0.0.1';
                  } else if (currentHost === '127.0.0.1') {
                    targetHost = 'localhost';
                  }
                  const port = window.location.port ? ':' + window.location.port : '';
                  const targetUrl = window.location.protocol + '//' + targetHost + port + '/login?test_mode=1';
                  
                  window.open(targetUrl, "_blank");
                }
              }}
              style={{ padding: "10px 16px", background: "#f59e0b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}
              title="가이드 수료 연동 테스트 (세션 분리)"
            >
              <span>💡 가이드 수료 테스트</span>
            </button>
            <button 
              onClick={() => setShowAddWorker(true)}
              style={{ padding: "10px 16px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
            >
              개별 등록
            </button>
            <button 
              onClick={() => workerFileInputRef.current?.click()}
              disabled={isUploadingWorkers}
              style={{ padding: "10px 16px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
            >
              {isUploadingWorkers ? "등록 중..." : "엑셀 대량 등록"}
            </button>
            <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} ref={workerFileInputRef} onChange={handleWorkerExcelUpload} />
          </div>
        </div>

        {/* 실태확인원 목록 */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <tr>
                <th style={{ padding: "16px", width: "40px", textAlign: "center" }}>
                  <input 
                    type="checkbox" 
                    checked={workers.length > 0 && selectedWorkerIds.length === workers.length}
                    onChange={toggleSelectAll}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                </th>
                <th style={{ padding: "16px", color: "#64748b", fontSize: "14px", fontWeight: "bold", width: "60px", textAlign: "center" }}>번호</th>
                <th style={{ padding: "16px", color: "#64748b", fontSize: "14px", fontWeight: "bold" }}>이름</th>
                <th style={{ padding: "16px", color: "#64748b", fontSize: "14px", fontWeight: "bold" }}>연락처 (ID)</th>
                <th style={{ padding: "16px", color: "#64748b", fontSize: "14px", fontWeight: "bold" }}>가이드 수료</th>
                <th style={{ padding: "16px", color: "#64748b", fontSize: "14px", fontWeight: "bold" }}>배정된 체납자 수</th>
                <th style={{ padding: "16px", color: "#64748b", fontSize: "14px", fontWeight: "bold" }}>처리 건 수</th>
                <th style={{ padding: "16px", color: "#64748b", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w, index) => {
                const assignedCount = ledgers.filter(l => l.assigned_worker_id === w.id).length;
                return (
                  <tr key={w.id} style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: selectedWorkerIds.includes(w.id) ? "#eff6ff" : "transparent" }}>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedWorkerIds.includes(w.id)}
                        onChange={() => toggleWorkerSelect(w.id)}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                    </td>
                    <td style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>{index + 1}</td>
                    <td style={{ padding: "16px", fontWeight: "bold", color: "#0f172a" }}>{w.name}</td>
                    <td style={{ padding: "16px", color: "#475569" }}>{w.phone}</td>
                    <td style={{ padding: "16px", color: "#475569", fontSize: "13px" }}>
                      {w.guide_completed_at ? (
                        <span style={{ color: "#10b981", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          ✅ {new Date(w.guide_completed_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span 
                          style={{ color: "#ef4444", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          ⚠️ 미수료
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px", color: "#3b82f6", fontWeight: "bold" }}>{assignedCount}건</td>
                    <td style={{ padding: "16px", color: "#10b981", fontWeight: "bold" }}>{w.cumulative_processed_count || 0}건</td>
                    <td style={{ padding: "16px", textAlign: "right", gap: "8px", display: "flex", justifyContent: "flex-end" }}>
                      <button 
                        onClick={() => {
                          const cleanPhone = (w.phone || "").replace(/[^0-9]/g, "");
                          const msg = encodeURIComponent(`[체납관리단] 안녕하세요 ${w.name} 실태확인원님, 관리자입니다.\n`);
                          window.location.href = `sms:${cleanPhone}?body=${msg}`;
                        }}
                        style={{ padding: "6px 12px", background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer", color: "#2563eb", fontSize: "13px", fontWeight: "bold" }}
                        title="문자 보내기"
                      >
                        문자
                      </button>
                      <button 
                        onClick={() => {
                          setEditWorkerId(w.id);
                          setEditName(w.name || "");
                          setEditPin("");
                          setShowEditWorker(true);
                        }}
                        style={{ padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", color: "#475569", fontSize: "13px", fontWeight: "bold" }}
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDeleteWorker(w.id, w.name || "")}
                        style={{ padding: "6px 12px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", color: "#ef4444", fontSize: "13px", fontWeight: "bold" }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
              {workers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    등록된 실태확인원이 없습니다.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    로딩 중...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 등록 모달 */}
      {showAddWorker && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "32px", borderRadius: "16px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "20px" }}>실태확인원 개별 등록</h3>
            <form onSubmit={handleRegisterWorker}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>이름</label>
                <input required type="text" value={wName} onChange={e => setWName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} placeholder="홍길동" />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>전화번호 (로그인 ID)</label>
                <input required type="text" value={wPhone} onChange={e => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setWPhone(formatted);
                  const numOnly = formatted.replace(/[^0-9]/g, "");
                  if (numOnly.length >= 4) {
                    setWPin(numOnly.slice(-4));
                  } else {
                    setWPin("");
                  }
                }} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} placeholder="010-1234-5678" />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>초기 비밀번호</label>
                <input required type="text" value={wPin} onChange={e => setWPin(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} placeholder="전화번호 뒷 4자리 자동 배정" />
                <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 0 0" }}>전화번호 입력 시 뒷 4자리로 자동 지정되며, 본인이 로그인 후 수정 가능합니다.</p>
              </div>
              <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <input type="checkbox" id="sendSmsCheckbox" checked={wSendSms} onChange={e => setWSendSms(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                <label htmlFor="sendSmsCheckbox" style={{ fontSize: "14px", fontWeight: "bold", color: "#1e293b", cursor: "pointer" }}>등록 완료 시 안내 메시지 자동 발송</label>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" onClick={() => setShowAddWorker(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "bold" }}>취소</button>
                <button type="submit" disabled={wLoading} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#0f172a", color: "white", cursor: "pointer", fontWeight: "bold" }}>{wLoading ? "등록중..." : "등록하기"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditWorker && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "32px", borderRadius: "16px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "20px" }}>실태확인원 정보 수정</h3>
            <form onSubmit={handleEditWorker}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>이름</label>
                <input required type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} placeholder="이름 입력" />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>비밀번호 (선택)</label>
                <input type="text" value={editPin} onChange={e => setEditPin(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} placeholder="변경하려면 입력 (최소 4자리)" />
                <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 0 0" }}>비밀번호를 변경하지 않으려면 비워두세요.</p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" onClick={() => setShowEditWorker(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "bold" }}>취소</button>
                <button type="submit" disabled={wLoading} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#0f172a", color: "white", cursor: "pointer", fontWeight: "bold" }}>{wLoading ? "저장중..." : "저장하기"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
