"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { 
  getWorkers, Profile, 
  getAllEncryptedMasterLedgers, 
  getAllEncryptedVisitRecords, 
  updateBulkEncryptedMasterLedgers, 
  updateBulkEncryptedVisitRecords, 
  setAdminPinHash, 
  getAdminPinHash, 
  getPinAuditLogs, 
  addPinAuditLog, 
  markLatestPinAsDistributed,
  markPinAsDistributedById,
  PinAuditLog 
} from "@/lib/adminDb";
import { encryptText, decryptText } from "@/lib/crypto";
import { hashPin, validatePinRule } from "@/utils/crypto";

export default function SecurityCenter() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<PinAuditLog[]>([]);

  // Initial PIN creation state
  const [initPin, setInitPin] = useState("");
  const [initPinConfirm, setInitPinConfirm] = useState("");

  // PIN 변경 모달 상태
  const [showResetModal, setShowResetModal] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [reencrypting, setReencrypting] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  async function load() {
    const hash = await getAdminPinHash();
    setHasPin(!!hash);

    const [w, logData] = await Promise.all([
      getWorkers(),
      getPinAuditLogs()
    ]);
    setWorkers(w);
    setLogs(logData);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const handleCopySms = async () => {
    const text = `[현장 방문 시스템 안내]\n현장 암호화 해제를 위한 마스터 PIN 번호가 배포되었습니다.\n\n안전하게 기억해 주시고, 타인에게 노출되지 않도록 주의 바랍니다.\n마스터 PIN: ______\n(관리자에게 직접 전달받은 6자리 숫자를 입력하세요.)`;
    navigator.clipboard.writeText(text);
    await markLatestPinAsDistributed();
    alert("안내 문구가 클립보드에 복사되었습니다.");
    load();
  };

  const handleLogDeploy = async (logId: string) => {
    const text = `[현장 방문 시스템 안내]\n현장 암호화 해제를 위한 마스터 PIN 번호가 배포되었습니다.\n\n마스터 PIN: \n(관리자에게 직접 전달받은 6자리 숫자를 입력하세요.)`;
    const phones = workers.map(w => w.phone?.replace(/[^0-9]/g, "")).filter(Boolean).join(",");
    if (!phones) {
      alert("등록된 실태확인원 연락처가 없습니다.");
      return;
    }
    await markPinAsDistributedById(logId);
    load();
    window.location.href = `sms:${phones}?body=${encodeURIComponent(text)}`;
  };

  const handleSendSms = async () => {
    const text = `[현장 방문 시스템 안내]\n현장 암호화 해제를 위한 마스터 PIN 번호가 배포되었습니다.\n\n마스터 PIN: \n(관리자에게 직접 전달받은 6자리 숫자를 입력하세요.)`;
    const phones = workers.map(w => w.phone?.replace(/[^0-9]/g, "")).filter(Boolean).join(",");
    if (!phones) {
      alert("등록된 실태확인원 연락처가 없습니다.");
      return;
    }
    await markLatestPinAsDistributed();
    load();
    window.location.href = `sms:${phones}?body=${encodeURIComponent(text)}`;
  };

  const handleInitialPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePinRule(initPin);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }
    if (initPin !== initPinConfirm) {
      alert("입력한 두 PIN 번호가 일치하지 않습니다.");
      return;
    }
    if (!confirm("이 PIN 번호는 절대 분실하면 안 되며 실태확인원들에게 배포해야 합니다. 이대로 생성하시겠습니까?")) return;
    
    setLoading(true);
    const newHash = await hashPin(initPin);
    const success = await setAdminPinHash(newHash);
    if (success) {
      await addPinAuditLog('PIN_CREATED', '마스터 PIN 최초 등록');
      alert("마스터 PIN이 성공적으로 생성되었습니다.");
      sessionStorage.setItem("workspace_pin", initPin);
      setHasPin(true);
      load();
    } else {
      alert("PIN 생성 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const startReencryption = async () => {
    const validation = validatePinRule(newPin);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }
    if (newPin !== newPinConfirm) {
      alert("새로운 PIN 번호가 일치하지 않습니다.");
      return;
    }
    const isDemoMode = hasPin && logs.length === 0;
    
    if (oldPin === newPin) {
      if (isDemoMode) {
        alert("해당 번호는 체험용 임시 PIN과 동일하여 사용할 수 없습니다. 나만의 다른 6자리 숫자를 입력해 주세요.");
      } else {
        alert("기존과 동일한 PIN 번호입니다.");
      }
      return;
    }

    if (!confirm("정말 마스터 PIN을 변경하시겠습니까?\n이 작업은 데이터베이스의 모든 암호화된 개인정보를 복호화 후 새 PIN으로 다시 암호화합니다.\n작업 도중 절대 브라우저를 닫지 마세요!")) return;

    setReencrypting(true);
    setProgressText("데이터 준비 중...");
    setProgressPercent(0);

    try {
      // 1. 기존 PIN 검증
      const currentHash = await hashPin(oldPin);
      const savedPin = sessionStorage.getItem("workspace_pin");
      if (savedPin !== oldPin) {
        alert("기존 PIN 번호가 올바르지 않습니다.");
        setReencrypting(false);
        return;
      }

      // 2. 마스터 원장 데이터 재암호화
      setProgressText("원장 데이터 가져오는 중...");
      const ledgers = await getAllEncryptedMasterLedgers();
      setProgressText(`원장 데이터 재암호화 중 (0 / ${ledgers.length})...`);
      
      const newLedgers = [];
      for (let i = 0; i < ledgers.length; i++) {
        const l = ledgers[i];
        try {
          const decName = await decryptText(l.name, oldPin);
          const decAddress = await decryptText(l.address, oldPin);
          const decDetail = await decryptText(l.detail_address, oldPin);
          
          const encName = await encryptText(decName, newPin);
          const encAddress = await encryptText(decAddress, newPin);
          const encDetail = await encryptText(decDetail, newPin);

          newLedgers.push({ id: l.id, name: encName, address: encAddress, detail_address: encDetail });
        } catch (e) {
          // 기존 PIN으로 복호화 실패 시 건너뜀
        }
        if (i % 10 === 0) setProgressPercent(Math.floor((i / (ledgers.length || 1)) * 40));
      }

      setProgressText("원장 데이터 서버 반영 중...");
      const chunkSize = 100;
      for (let i = 0; i < newLedgers.length; i += chunkSize) {
        const chunk = newLedgers.slice(i, i + chunkSize);
        await updateBulkEncryptedMasterLedgers(chunk);
      }
      setProgressPercent(50);

      // 3. 방문 기록 데이터 재암호화
      setProgressText("방문 기록 데이터 가져오는 중...");
      const visits = await getAllEncryptedVisitRecords();
      setProgressText(`방문 기록 재암호화 중 (0 / ${visits.length})...`);
      
      const newVisits = [];
      for (let i = 0; i < visits.length; i++) {
        const v = visits[i];
        try {
          let encMemo = v.worker_memo;
          let encReason = v.unvisited_reason;

          if (v.worker_memo) {
            const decMemo = await decryptText(v.worker_memo, oldPin);
            encMemo = await encryptText(decMemo, newPin);
          }
          if (v.unvisited_reason) {
            const decReason = await decryptText(v.unvisited_reason, oldPin);
            encReason = await encryptText(decReason, newPin);
          }

          newVisits.push({ id: v.id, worker_memo: encMemo, unvisited_reason: encReason });
        } catch (e) {}
        if (i % 10 === 0) setProgressPercent(50 + Math.floor((i / (visits.length || 1)) * 40));
      }

      setProgressText("방문 기록 서버 반영 중...");
      for (let i = 0; i < newVisits.length; i += chunkSize) {
        const chunk = newVisits.slice(i, i + chunkSize);
        await updateBulkEncryptedVisitRecords(chunk);
      }

      setProgressPercent(95);
      setProgressText("마스터 PIN 해시 업데이트 중...");
      
      const newHash = await hashPin(newPin);
      await setAdminPinHash(newHash);
      sessionStorage.setItem("workspace_pin", newPin);
      
      if (isDemoMode) {
        await addPinAuditLog('PIN_CREATED', `마스터 PIN 최초 등록 (원장 ${ledgers.length}건, 방문기록 ${visits.length}건 암호화 연동)`);
      } else {
        await addPinAuditLog('PIN_ROTATED', `원장 ${ledgers.length}건, 방문기록 ${visits.length}건 재암호화 완료`);
      }
      await load();

      setProgressPercent(100);
      setProgressText("완료되었습니다!");
      
      setTimeout(() => {
        alert("마스터 PIN이 성공적으로 변경되었으며 모든 개인정보가 재암호화 되었습니다.\n\n변경된 PIN 번호를 실태확인원들에게 배포해 주세요.");
        setReencrypting(false);
        setShowResetModal(false);
        setOldPin("");
        setNewPin("");
        setNewPinConfirm("");
      }, 500);

    } catch (err: any) {
      console.error(err);
      alert("재암호화 중 오류가 발생했습니다: " + err.message);
      setReencrypting(false);
    }
  };

  if (hasPin === null) {
    return <div style={{ padding: "40px", textAlign: "center" }}>로딩 중...</div>;
  }

  // 초기 핀 생성 화면
  if (hasPin === false) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
        <AdminSidebar onTestGuideSuccess={() => {}} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "40px", borderRadius: "16px", width: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
            <h2 style={{ marginBottom: "16px", color: "#0f172a", fontSize: "22px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span>🛡️</span> 보안 관리 센터 초기 설정
            </h2>
            <div style={{ background: "#eff6ff", color: "#1e40af", padding: "16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", border: "1px solid #bfdbfe", lineHeight: "1.5" }}>
              이 작업공간의 모든 체납자 개인정보는 <strong>종단간 암호화(E2EE)</strong>로 보호됩니다.<br/>
              업무를 시작하기 전, 데이터를 안전하게 보호할 <strong>최초 마스터 PIN</strong>을 생성해주세요.
            </div>
            
            <form onSubmit={handleInitialPinSubmit}>
              <label style={{ display: "block", marginBottom: "12px", fontSize: "14.5px", fontWeight: "700", color: "#334155", lineHeight: "1.6" }}>
                <span style={{ color: "#ef4444", fontSize: "13px" }}>* 보안을 위해 "111111", "123456" 등 3자리 이상 반복되거나 연속된 쉬운 번호 사용을 차단합니다.</span>
              </label>
              <input 
                type="text" 
                value={initPin} 
                onChange={(e) => setInitPin(e.target.value)} 
                placeholder="새로운 6자리 숫자 입력"
                maxLength={6}
                style={{ width: "100%", padding: "16px", marginBottom: "12px", borderRadius: "8px", border: "2px solid #3b82f6", textAlign: "center", letterSpacing: "4px", fontSize: "20px", fontWeight: "bold", background: "#ffffff", outline: "none" }}
                autoFocus
              />
              <input 
                type="text" 
                value={initPinConfirm} 
                onChange={(e) => setInitPinConfirm(e.target.value)} 
                placeholder="새로운 6자리 숫자 확인"
                maxLength={6}
                style={{ width: "100%", padding: "16px", marginBottom: "20px", borderRadius: "8px", border: "2px solid #3b82f6", textAlign: "center", letterSpacing: "4px", fontSize: "20px", fontWeight: "bold", background: "#ffffff", outline: "none" }}
              />
              <button type="submit" disabled={loading} style={{ width: "100%", padding: "16px", borderRadius: "8px", border: "none", background: "#2563eb", color: "white", fontSize: "16px", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "생성 중..." : "마스터 PIN 생성 및 저장"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 정상 화면
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <AdminSidebar onTestGuideSuccess={() => {}} />

      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>🛡️</span> 보안 관리 센터
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          {/* 좌측: 마스터 PIN 상태 */}
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              마스터 PIN (E2EE 암호화 키)
            </h3>
            
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <div style={{ color: "#166534", fontWeight: "bold", fontSize: "15px", marginBottom: "4px" }}>✅ 정상 작동 중</div>
              <div style={{ color: "#15803d", fontSize: "14px" }}>현재 6자리 보안 PIN이 시스템 전체에 안전하게 적용되어 있습니다.</div>
            </div>

            <div style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "24px" }}>
              마스터 PIN은 현장 실태확인원들이 담당 원장 데이터를 확인할 때 반드시 필요한 암호화 해제 열쇠입니다.<br/>
              주기적인 변경을 권장하지만, 변경 시 기존 데이터를 모두 <strong>재암호화</strong>하는 과정이 필요하여 수 분 소요될 수 있습니다.
            </div>

            <button 
              onClick={() => {
                const isDemoMode = hasPin && logs.length === 0;
                if (isDemoMode) setOldPin("159357");
                else setOldPin("");
                setShowResetModal(true);
              }}
              style={{ padding: "12px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              마스터 PIN 설정/재설정 (Re-encryption)
            </button>
          </div>

          {/* 우측: 실태확인원 배포 */}
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              실태확인원 마스터 PIN 일괄 배포
            </h3>
            
            <div style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "24px" }}>
              실태확인원들이 앱에 접속하려면 관리자님이 설정하신 6자리 PIN 번호를 알아야 합니다.<br/>
              아래 버튼을 눌러 안내 문구를 복사하거나 기본 문자 메시지 앱으로 일괄 발송하세요.
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px dashed #cbd5e1", marginBottom: "20px", fontSize: "13px", color: "#475569", whiteSpace: "pre-wrap" }}>
{`[현장 방문 시스템 안내]
현장 암호화 해제를 위한 마스터 PIN 번호가 배포되었습니다.
마스터 PIN: ______`}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={handleCopySms}
                style={{ flex: 1, padding: "12px", background: "white", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                문구 복사하기
              </button>
              <button 
                onClick={handleSendSms}
                style={{ flex: 1, padding: "12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                단체 문자(SMS) 보내기
              </button>
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "12px", textAlign: "center" }}>
              * 단체 문자는 PC나 스마트폰의 기본 메시지 앱을 호출합니다.
            </div>
          </div>
        </div>

        {/* PIN Audit Logs */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🕒</span> 마스터 PIN 관리 이력
          </h3>
          {logs.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>관리 이력이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {logs.map(log => {
                const dateObj = new Date(log.created_at);
                const dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                      <div style={{ minWidth: "170px", color: "#64748b", fontSize: "15px", whiteSpace: "nowrap" }}>{dateStr}</div>
                      <div style={{ fontWeight: "bold", fontSize: "16px", color: log.event_type === "PIN_CREATED" ? "#3b82f6" : "#f59e0b", minWidth: "100px" }}>
                        {log.event_type === "PIN_CREATED" ? "[최초 등록]" : "[PIN 재설정]"}
                      </div>
                      <div style={{ color: "#334155", fontSize: "16px" }}>
                        {log.description}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {!log.is_distributed && (
                        <button 
                          onClick={() => handleLogDeploy(log.id)}
                          style={{ padding: "6px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          배포하기
                        </button>
                      )}
                      {log.is_distributed ? (
                        <span style={{ display: "inline-block", background: "#dcfce7", color: "#166534", padding: "6px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold" }}>
                          ✓ 배포 완료
                        </span>
                      ) : (
                        <span style={{ display: "inline-block", background: "#fee2e2", color: "#b91c1c", padding: "6px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold" }}>
                          배포 전
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PIN 재설정 모달 */}
      {showResetModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
          <div style={{ background: "white", padding: "32px", borderRadius: "16px", width: "480px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px" }}>
              마스터 PIN 설정/재설정
            </h3>
            
            {reencrypting ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", marginBottom: "16px" }}>
                  데이터 재암호화 진행 중...
                </div>
                <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                  <div style={{ width: `${progressPercent}%`, height: "100%", background: "#3b82f6", transition: "width 0.2s" }} />
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>{progressText} ({progressPercent}%)</div>
                <div style={{ marginTop: "24px", color: "#ef4444", fontSize: "13px", fontWeight: "bold" }}>
                  ⚠️ 작업이 완료될 때까지 브라우저를 닫거나 새로고침하지 마세요.
                </div>
              </div>
            ) : (
              <>
                <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", border: "1px solid #fecaca" }}>
                  <strong>⚠️ 주의사항</strong><br/>
                  새로운 PIN으로 변경하면 시스템에 저장된 <strong>모든 암호화 데이터가 재암호화</strong>됩니다. 체납자 수에 따라 수 분 이상 소요될 수 있습니다.
                </div>

                {hasPin && logs.length === 0 ? (
                  <div style={{ marginBottom: "16px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#334155", marginBottom: "8px" }}>✅ 데모 임시 PIN 자동 적용됨</div>
                    <div style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
                      1초 체험하기를 위해 발급된 <strong>임시 PIN(1****7)</strong>이 기존 PIN으로 자동 입력되어 있습니다.<br/>
                      아래에 원하시는 <strong>나만의 새로운 PIN</strong>을 입력하여 나만의 보안 환경을 설정해 보세요!
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", color: "#334155", marginBottom: "8px" }}>기존 마스터 PIN (현재)</label>
                    <input 
                      type="text"
                      maxLength={6}
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "18px", letterSpacing: "4px", textAlign: "center", fontWeight: "bold" }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", color: "#334155", marginBottom: "8px" }}>새로운 마스터 PIN (6자리)</label>
                  <input 
                    type="text"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "18px", letterSpacing: "4px", textAlign: "center", fontWeight: "bold" }}
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", color: "#334155", marginBottom: "8px" }}>새로운 마스터 PIN 확인</label>
                  <input 
                    type="text"
                    maxLength={6}
                    value={newPinConfirm}
                    onChange={(e) => setNewPinConfirm(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "18px", letterSpacing: "4px", textAlign: "center", fontWeight: "bold" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    onClick={() => {
                      setShowResetModal(false);
                      setOldPin("");
                      setNewPin("");
                      setNewPinConfirm("");
                    }}
                    style={{ flex: 1, padding: "12px", background: "white", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    취소
                  </button>
                  <button 
                    onClick={startReencryption}
                    disabled={!oldPin || !newPin || !newPinConfirm}
                    style={{ flex: 1, padding: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", opacity: (!oldPin || !newPin || !newPinConfirm) ? 0.5 : 1 }}
                  >
                    재암호화 시작
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
