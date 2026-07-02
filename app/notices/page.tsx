"use client";

import { useState, useEffect } from "react";
import { getWorkerNotices, markNoticeAsRead, Notice } from "@/lib/noticeDb";
import { useRouter } from "next/navigation";

export default function WorkerNoticesPage() {
  const [notices, setNotices] = useState<{ notice: Notice, isRead: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await getWorkerNotices();
      setNotices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markNoticeAsRead(id);
      // 로컬 상태 업데이트
      setNotices(prev => prev.map(n => n.notice.id === id ? { ...n, isRead: true } : n));
    }
    // 상세 내용을 보여주는 모달 등을 띄우거나 그냥 토글되게 할 수 있음
    // 모바일 뷰에선 아코디언 스타일이 좋음
  };

  const toggleAccordion = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markNoticeAsRead(id);
      setNotices(prev => prev.map(n => n.notice.id === id ? { ...n, isRead: true } : n));
    }
    // 여기서 토글 열기 처리. React state로 openId 관리를 추가해야 함.
  };

  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (id: string, isRead: boolean) => {
    setOpenId(prev => prev === id ? null : id);
    if (!isRead) {
      markNoticeAsRead(id).then(() => {
        setNotices(prev => prev.map(n => n.notice.id === id ? { ...n, isRead: true } : n));
      });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "24px", color: "var(--color-text)" }}>
        공지사항
      </h2>
      
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>등록된 공지사항이 없습니다.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notices.map(({ notice, isRead }) => (
            <div 
              key={notice.id} 
              style={{ 
                background: "var(--color-bg)", 
                borderRadius: "12px", 
                border: `1px solid ${notice.is_important ? "#ef4444" : "var(--color-border)"}`,
                overflow: "hidden"
              }}
            >
              <div 
                onClick={() => handleToggle(notice.id, isRead)}
                style={{ 
                  padding: "16px", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px", 
                  cursor: "pointer",
                  background: notice.is_important ? "#fef2f2" : "transparent"
                }}
              >
                {!isRead && (
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                )}
                {isRead && <div style={{ width: "8px" }} />}
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    {notice.is_important && (
                      <span style={{ fontSize: "12px", background: "#ef4444", color: "white", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>중요</span>
                    )}
                    <div style={{ fontSize: "16px", fontWeight: notice.is_important ? "bold" : (isRead ? "normal" : "bold"), color: "var(--color-text)" }}>
                      {notice.title}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                    {new Date(notice.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ color: "var(--color-text-muted)" }}>
                  {openId === notice.id ? "▲" : "▼"}
                </div>
              </div>
              
              {openId === notice.id && (
                <div style={{ padding: "16px", borderTop: "1px solid var(--color-border)", fontSize: "15px", color: "var(--color-text)", whiteSpace: "pre-wrap", lineHeight: 1.5, background: "var(--color-bg)" }}>
                  {notice.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
