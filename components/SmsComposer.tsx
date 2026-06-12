"use client";

import { useState } from "react";
import { SMS_TEMPLATES } from "@/lib/constants";
import { addLog } from "@/lib/auditLog";
import type { LedgerRecord } from "@/lib/ledgerDB";

type Props = {
  record: LedgerRecord;
  onClose: () => void;
};

export default function SmsComposer({ record, onClose }: Props) {
  const [templateIdx, setTemplateIdx] = useState(0);
  const [body, setBody] = useState(SMS_TEMPLATES[0].body);
  const [sent, setSent] = useState(false);

  const handleTemplate = (idx: number) => {
    setTemplateIdx(idx);
    const tpl = SMS_TEMPLATES[idx];
    if (tpl.body) {
      // 날짜/시간 플레이스홀더 치환
      let text = tpl.body;
      if (record.nextVisitDate) {
        const parts = record.nextVisitDate.split("-");
        text = text.replace("{날짜}", `${parts[1]}/${parts[2]}`);
      } else {
        text = text.replace("{날짜}", "( )");
      }
      text = text.replace("{시간}", record.nextVisitTime || "( )");
      setBody(text);
    } else {
      setBody("");
    }
  };

  const handleSend = async () => {
    // 1) Audit Log에 문자 내용 자동 저장
    await addLog({
      recordId: record.id,
      recordName: record.name,
      action: "SMS_SENT",
      before: null,
      after: { to: record.contact, body },
      reason: body,
      reasonCategory: SMS_TEMPLATES[templateIdx].label,
    });

    // 2) 기기 문자 앱 호출 (sms: 스킴)
    const encoded = encodeURIComponent(body);
    const smsUrl = `sms:${record.contact}?body=${encoded}`;
    window.open(smsUrl, "_blank");

    setSent(true);
  };

  if (sent) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content sms-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sms-sent-check">✅</div>
          <p className="sms-sent-msg">문자 발송 기록이 저장되었습니다</p>
          <p className="sms-sent-sub">기기 문자 앱에서 발송을 확인해주세요</p>
          <button className="btn-primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content sms-modal" onClick={(e) => e.stopPropagation()}>
        <h3>📱 문자 발송 — {record.name}</h3>
        <div className="sms-field">
          <label>수신</label>
          <span>{record.contact || "(연락처 없음)"}</span>
        </div>

        <div className="sms-field">
          <label>템플릿</label>
          <select
            value={templateIdx}
            onChange={(e) => handleTemplate(Number(e.target.value))}
          >
            {SMS_TEMPLATES.map((t, i) => (
              <option key={i} value={i}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="sms-field">
          <label>내용</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="문자 내용을 입력하세요"
          />
        </div>

        <div className="sms-actions">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={!body.trim() || !record.contact}
          >
            📤 문자앱으로 보내기
          </button>
        </div>
      </div>
    </div>
  );
}
