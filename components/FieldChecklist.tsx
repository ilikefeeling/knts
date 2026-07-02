"use client";

import { useState, useEffect } from "react";

type CheckItem = {
  id: string;
  label: string;
  emoji: string;
  required: boolean;
};

const DEFAULT_CHECKLIST: CheckItem[] = [
  { id: "arrive",    label: "현장 도착 확인",           emoji: "📍", required: true },
  { id: "id_check",  label: "신분증(공무원증) 제시",     emoji: "🪪", required: true },
  { id: "photo",     label: "현장 외관 사진 촬영",       emoji: "📸", required: true },
  { id: "record",    label: "녹음 시작 (클로바노트)",     emoji: "🎙️", required: false },
  { id: "interior",  label: "내부 현황 확인 및 사진",     emoji: "🏠", required: false },
  { id: "interview", label: "대상자 면담 실시",          emoji: "💬", required: true },
  { id: "notice",    label: "안내문/고지서 전달",        emoji: "📋", required: false },
  { id: "complete",  label: "방문 종료 및 결과 정리",     emoji: "✅", required: true },
];

type Props = {
  targetName: string;
  onComplete: () => void;
  onSkip: () => void;
};

export default function FieldChecklist({ targetName, onComplete, onSkip }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // 초기화
    const initial: Record<string, boolean> = {};
    DEFAULT_CHECKLIST.forEach(item => { initial[item.id] = false; });
    setChecked(initial);
  }, [targetName]);

  function toggle(id: string) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const totalRequired = DEFAULT_CHECKLIST.filter(c => c.required).length;
  const checkedRequired = DEFAULT_CHECKLIST.filter(c => c.required && checked[c.id]).length;
  const allRequiredDone = checkedRequired >= totalRequired;
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const progressPercent = Math.round((totalChecked / DEFAULT_CHECKLIST.length) * 100);

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: "fixed", bottom: "20px", right: "20px", zIndex: 1000,
          background: allRequiredDone ? "#00b894" : "#3366ff",
          color: "#fff", padding: "12px 20px", borderRadius: "50px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)", cursor: "pointer",
          fontSize: "14px", fontWeight: "bold",
          display: "flex", alignItems: "center", gap: "8px"
        }}
      >
        📋 {totalChecked}/{DEFAULT_CHECKLIST.length}
        {allRequiredDone && " ✅"}
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
      background: "#fff", borderTop: "2px solid #3366ff",
      borderRadius: "16px 16px 0 0",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
      padding: "16px 20px 24px",
      maxHeight: "60vh", overflowY: "auto"
    }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>📋 현장 조사 체크리스트</div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "2px" }}>{targetName}</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setIsMinimized(true)}
            style={{ background: "none", border: "1px solid #ddd", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
          >
            최소화
          </button>
          <button
            onClick={onSkip}
            style={{ background: "none", border: "1px solid #ddd", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", color: "#888" }}
          >
            건너뛰기
          </button>
        </div>
      </div>

      {/* 프로그레스 */}
      <div style={{ width: "100%", height: "6px", background: "#e0e0e0", borderRadius: "3px", marginBottom: "16px", overflow: "hidden" }}>
        <div style={{
          width: `${progressPercent}%`, height: "100%",
          background: allRequiredDone ? "#00b894" : "#3366ff",
          transition: "width 0.3s ease"
        }} />
      </div>

      {/* 체크리스트 항목 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {DEFAULT_CHECKLIST.map(item => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px", borderRadius: "10px",
              border: checked[item.id] ? "2px solid #00b894" : "1px solid #e0e0e0",
              background: checked[item.id] ? "#e8faf0" : "#fff",
              cursor: "pointer", width: "100%", textAlign: "left",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: "20px", minWidth: "28px", textAlign: "center" }}>
              {checked[item.id] ? "✅" : item.emoji}
            </span>
            <span style={{
              flex: 1, fontSize: "15px", fontWeight: 500,
              color: checked[item.id] ? "#00b894" : "#333",
              textDecoration: checked[item.id] ? "line-through" : "none"
            }}>
              {item.label}
            </span>
            {item.required && !checked[item.id] && (
              <span style={{ fontSize: "11px", color: "#e74c3c", fontWeight: "bold", padding: "2px 6px", background: "#fff0f0", borderRadius: "4px" }}>
                필수
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 완료 버튼 */}
      <button
        onClick={onComplete}
        disabled={!allRequiredDone}
        style={{
          width: "100%", marginTop: "16px", padding: "14px",
          borderRadius: "10px", border: "none", fontSize: "16px", fontWeight: "bold",
          background: allRequiredDone ? "#00b894" : "#ccc",
          color: "#fff", cursor: allRequiredDone ? "pointer" : "not-allowed",
          transition: "background 0.3s ease"
        }}
      >
        {allRequiredDone ? "✓ 체크리스트 완료 — 결과 정리하기" : `필수 항목 ${checkedRequired}/${totalRequired} 완료`}
      </button>
    </div>
  );
}
