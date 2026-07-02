"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdminNotices, createNotice, deleteNotice, Notice, getNoticeReadStatus } from "@/lib/noticeDb";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [showReadersModal, setShowReadersModal] = useState<string | null>(null);
  const [readers, setReaders] = useState<{ id: string; name: string; phone: string; isRead: boolean; read_at: string | null }[]>([]);
  const [loadingReaders, setLoadingReaders] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await getAdminNotices();
      setNotices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createNotice(newTitle, newContent, isImportant);
      if (res.success) {
        alert("공지사항이 등록되었습니다.");
        setShowCreateModal(false);
        setNewTitle("");
        setNewContent("");
        setIsImportant(false);
        fetchNotices();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert("오류 발생: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteNotice(deleteId);
      if (res.success) {
        setNotices(prev => prev.filter(n => n.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert("삭제 중 오류 발생: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewReaders = async (id: string) => {
    setShowReadersModal(id);
    setLoadingReaders(true);
    try {
      const data = await getNoticeReadStatus(id);
      setReaders(data);
    } catch (err) {
      console.error(err);
      alert("조회 현황을 불러오는데 실패했습니다.");
    } finally {
      setLoadingReaders(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AdminSidebar onTestGuideSuccess={() => window.location.reload()} />

      {/* ── 메인 컨텐츠 ── */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", margin: 0 }}>공지사항 관리</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            style={{ background: "#0f172a", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}
          >
            새 공지사항 등록
          </button>
        </div>

        {/* 공지사항 목록 */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>로딩 중...</div>
          ) : notices.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>등록된 공지사항이 없습니다.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", color: "#64748b", fontWeight: "600", width: "80px" }}>상태</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", color: "#64748b", fontWeight: "600" }}>제목</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "14px", color: "#64748b", fontWeight: "600", width: "150px" }}>작성일</th>
                  <th style={{ padding: "16px", textAlign: "center", fontSize: "14px", color: "#64748b", fontWeight: "600", width: "180px" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((n) => {
                  const isAllRead = n.total_workers ? n.total_workers > 0 && n.read_count === n.total_workers : false;
                  return (
                    <tr key={n.id} style={{ borderBottom: "1px solid #e2e8f0", background: n.is_important ? "#fffbeb" : "white" }}>
                      <td style={{ padding: "16px" }}>
                        {n.is_important && <span style={{ background: "#ef4444", color: "white", fontSize: "12px", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>중요</span>}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: n.is_important ? "bold" : "normal", color: "#0f172a", marginBottom: "4px" }}>{n.title}</div>
                        <div style={{ fontSize: "13px", color: "#64748b", whiteSpace: "pre-wrap" }}>{n.content}</div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#64748b" }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button 
                          onClick={() => handleViewReaders(n.id)}
                          style={{ 
                            padding: "6px 12px", 
                            background: isAllRead ? "#dcfce7" : "#f1f5f9", 
                            color: isAllRead ? "#166534" : "#334155", 
                            border: `1px solid ${isAllRead ? "#bbf7d0" : "#cbd5e1"}`, 
                            borderRadius: "6px", 
                            fontSize: "13px", 
                            fontWeight: "600", 
                            cursor: "pointer" 
                          }}
                        >
                          {isAllRead ? "모두 읽음" : "조회 현황"}
                        </button>
                        <button 
                          onClick={() => setDeleteId(n.id)}
                          style={{ padding: "6px 12px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
                          onMouseOver={(e) => e.currentTarget.style.background = "#fecaca"}
                          onMouseOut={(e) => e.currentTarget.style.background = "#fee2e2"}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 새 공지사항 모달 */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", width: "100%", maxWidth: "500px", borderRadius: "16px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>새 공지사항 등록</h3>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>제목</label>
              <input 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px" }}
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>내용</label>
              <textarea 
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", minHeight: "150px", resize: "vertical" }}
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>

            <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input 
                type="checkbox" 
                id="isImportant"
                checked={isImportant}
                onChange={e => setIsImportant(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              <label htmlFor="isImportant" style={{ fontSize: "14px", fontWeight: "600", color: "#ef4444", cursor: "pointer" }}>
                중요 공지사항 (상단 고정 및 강조 표시)
              </label>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <button 
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                style={{ flex: 1, padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "600", cursor: "pointer" }}
              >
                취소
              </button>
              <button 
                onClick={handleCreate}
                disabled={submitting}
                style={{ flex: 1, padding: "14px", borderRadius: "8px", border: "none", background: "#0f172a", color: "white", fontWeight: "600", cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 읽은 사람 보기 모달 */}
      {showReadersModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", width: "100%", maxWidth: "500px", borderRadius: "16px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>조회 현황</h3>
              <button 
                onClick={() => setShowReadersModal(null)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
              {loadingReaders ? (
                <div style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>로딩 중...</div>
              ) : readers.length === 0 ? (
                <div style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>실태확인원이 없습니다.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {readers.map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ 
                          padding: "4px 8px", 
                          borderRadius: "4px", 
                          fontSize: "12px", 
                          fontWeight: "bold", 
                          background: r.isRead ? "#f1f5f9" : "#fee2e2", 
                          color: r.isRead ? "#64748b" : "#ef4444" 
                        }}>
                          {r.isRead ? "읽음" : "안 읽음"}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#0f172a" }}>{r.name}</div>
                          <div style={{ fontSize: "13px", color: "#64748b" }}>{r.phone}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: "13px", color: "#94a3b8", textAlign: "right" }}>
                        {r.read_at ? new Date(r.read_at).toLocaleString() : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px" }}>
              <button 
                onClick={() => setShowReadersModal(null)}
                style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "none", background: "#f1f5f9", color: "#334155", fontWeight: "600", cursor: "pointer" }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.2s ease-out" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "400px", borderRadius: "16px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", textAlign: "center", animation: "slideUp 0.2s ease-out" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "24px", background: "#fee2e2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", fontSize: "24px" }}>
              ⚠️
            </div>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>공지사항 삭제</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
              정말 이 공지사항을 삭제하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseOut={(e) => e.currentTarget.style.background = "white"}
              >
                취소
              </button>
              <button 
                onClick={executeDelete}
                disabled={deleting}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#ef4444", color: "white", fontWeight: "600", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1, transition: "background 0.2s" }}
                onMouseOver={(e) => { if(!deleting) e.currentTarget.style.background = "#dc2626"; }}
                onMouseOut={(e) => { if(!deleting) e.currentTarget.style.background = "#ef4444"; }}
              >
                {deleting ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
