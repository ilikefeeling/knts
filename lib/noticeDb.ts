"use server";

import { createClient } from "@/utils/supabase/server";

export type Notice = {
  id: string;
  admin_id: string;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  read_count?: number;
  total_workers?: number;
};

// [관리자용] 공지사항 목록 조회
export async function getAdminNotices(): Promise<Notice[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. 전체 활성 보조원 수 계산
  const { count: totalWorkers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "WORKER")
    .eq("status", "ACTIVE");

  // 2. 공지사항 조회
  const { data: notices, error } = await supabase
    .from("notices")
    .select("*")
    .eq("admin_id", user.id)
    .order("is_important", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !notices) {
    console.error("getAdminNotices Error:", error);
    return [];
  }

  // 3. 각 공지사항별 읽음 수 조회
  // 실제 서비스라면 RPC나 View를 쓰겠지만, 목록이 엄청 길지 않다면 루프나 notice_reads 그룹핑으로 처리 가능
  const noticeIds = notices.map(n => n.id);
  const { data: reads } = await supabase
    .from("notice_reads")
    .select("notice_id")
    .in("notice_id", noticeIds);

  const readCounts = new Map<string, number>();
  if (reads) {
    reads.forEach(r => {
      readCounts.set(r.notice_id, (readCounts.get(r.notice_id) || 0) + 1);
    });
  }

  return notices.map(n => ({
    ...n,
    read_count: readCounts.get(n.id) || 0,
    total_workers: totalWorkers || 0
  })) as Notice[];
}

// [관리자용] 공지사항 작성
export async function createNotice(title: string, content: string, is_important: boolean = false): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { error } = await supabase.from("notices").insert({
    admin_id: user.id,
    title,
    content,
    is_important
  });

  if (error) {
    return { success: false, message: "공지사항 등록 실패: " + error.message };
  }
  return { success: true };
}

// [관리자용] 공지사항 수정
export async function updateNotice(id: string, title: string, content: string, is_important: boolean = false): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("notices").update({
    title,
    content,
    is_important,
    updated_at: new Date().toISOString()
  }).eq("id", id);

  if (error) {
    return { success: false, message: "공지사항 수정 실패: " + error.message };
  }
  return { success: true };
}

// [관리자용] 공지사항 삭제
export async function deleteNotice(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) {
    return { success: false, message: "공지사항 삭제 실패: " + error.message };
  }
  return { success: true };
}

// [보조원용] 공지사항 목록 조회
export async function getWorkerNotices(): Promise<{ notice: Notice, isRead: boolean }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 현재 보조원의 admin_id를 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("admin_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.admin_id) return [];

  // 소속 관리자가 작성한 공지사항만 필터링해서 조회
  const { data: notices, error: noticeError } = await supabase
    .from("notices")
    .select("*")
    .eq("admin_id", profile.admin_id)
    .order("is_important", { ascending: false })
    .order("created_at", { ascending: false });

  if (noticeError) {
    console.error("getWorkerNotices Error:", noticeError);
    return [];
  }

  // 읽음 기록 조회
  const { data: reads, error: readsError } = await supabase
    .from("notice_reads")
    .select("notice_id")
    .eq("worker_id", user.id);

  if (readsError) {
    console.error("getWorkerNoticeReads Error:", readsError);
    return [];
  }

  const readSet = new Set(reads?.map(r => r.notice_id) || []);

  return notices.map(n => ({
    notice: n,
    isRead: readSet.has(n.id)
  }));
}

// [보조원용] 안 읽은 공지사항 있는지 확인
export async function hasUnreadNotices(): Promise<boolean> {
  const notices = await getWorkerNotices();
  return notices.some(n => !n.isRead);
}

// [보조원용] 공지사항 읽음 처리
export async function markNoticeAsRead(noticeId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("notice_reads").insert({
    notice_id: noticeId,
    worker_id: user.id
  });
  
  // 이미 읽은 경우 Unique Constraint 로 에러가 날 수 있으나 무시
  if (error && error.code !== '23505') {
    console.error("markNoticeAsRead Error:", error);
  }
}

// [관리자용] 특정 공지사항을 읽은/안 읽은 보조원 전체 현황 조회
export async function getNoticeReadStatus(noticeId: string): Promise<{ id: string; name: string; phone: string; isRead: boolean; read_at: string | null }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. 모든 활성 보조원 조회
  const { data: workers, error: workersErr } = await supabase
    .from("profiles")
    .select("id, name, phone")
    .eq("role", "WORKER")
    .eq("status", "ACTIVE");

  if (workersErr || !workers) {
    console.error("getNoticeReadStatus - profiles Error:", workersErr);
    return [];
  }

  // 2. 해당 공지사항 읽음 기록 조회
  const { data: reads, error: readsErr } = await supabase
    .from("notice_reads")
    .select("worker_id, read_at")
    .eq("notice_id", noticeId);

  if (readsErr) {
    console.error("getNoticeReadStatus - notice_reads Error:", readsErr);
    return [];
  }

  const readMap = new Map();
  reads.forEach(r => readMap.set(r.worker_id, r.read_at));

  // 3. 결합 및 안 읽은 사람 상단 정렬
  const result = workers.map(w => ({
    id: w.id,
    name: w.name || "알 수 없음",
    phone: w.phone || "알 수 없음",
    isRead: readMap.has(w.id),
    read_at: readMap.get(w.id) || null
  }));

  // 정렬: 안 읽은 사람 먼저, 그 다음 이름순
  result.sort((a, b) => {
    if (a.isRead === b.isRead) {
      return a.name.localeCompare(b.name);
    }
    return a.isRead ? 1 : -1;
  });

  return result;
}
