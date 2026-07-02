"use server";

import { createClient } from "@/utils/supabase/server";

export type WorkerTarget = {
  id: string; // task_ledger id
  campaign_id: string;
  name: string; // master_ledger name (encrypted)
  contact: string; // master_ledger phone
  address: string; // master_ledger address (encrypted)
  detail_address: string; // master_ledger detail_address (encrypted)
  nextVisitTime: string | null;
  visitCount: number;
  department?: string;
  tax_item?: string;
  arrears_amount?: string;
  arrears_count?: string;
  seizure_details?: string;
  installment_status?: string;
};

export async function getWorkspaceAdminPinHash(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Get worker's admin_id
  const { data: workerProfile } = await supabase
    .from("profiles")
    .select("admin_id")
    .eq("id", user.id)
    .single();

  if (!workerProfile || !workerProfile.admin_id) return null;

  // 2. Get admin's pin_hash
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("pin_hash")
    .eq("id", workerProfile.admin_id)
    .single();

  return adminProfile?.pin_hash || null;
}

export async function getAssignedTargets(): Promise<WorkerTarget[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (profile?.status === "INACTIVE") {
    throw new Error("WORKER_INACTIVE");
  }

  const { data, error } = await supabase
    .from("task_ledger")
    .select(`
      *,
      master_ledger (
        name, phone, address, detail_address
      )
    `)
    .eq("assigned_worker_id", user.id)
    .eq("current_status", "ASSIGNED");

  if (error) {
    console.error("getAssignedTargets error:", error);
    return [];
  }

  return (data as any[]).map(d => ({
    id: d.id,
    campaign_id: d.campaign_id,
    name: d.master_ledger?.name || "",
    contact: d.master_ledger?.phone || "",
    address: d.master_ledger?.address || "",
    detail_address: d.master_ledger?.detail_address || "",
    nextVisitTime: null,
    visitCount: d.failed_visit_count || 0,
    department: d.department || "",
    tax_item: d.tax_item || "",
    arrears_amount: d.arrears_amount || "",
    arrears_count: d.arrears_count || "",
    seizure_details: d.seizure_details || "",
    installment_status: d.installment_status || "",
  }));
}

export async function getPendingTargets(): Promise<WorkerTarget[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (profile?.status === "INACTIVE") {
    throw new Error("WORKER_INACTIVE");
  }

  const { data, error } = await supabase
    .from("task_ledger")
    .select(`
      *,
      master_ledger (
        name, phone, address, detail_address
      )
    `)
    .eq("assigned_worker_id", user.id)
    .eq("current_status", "PENDING_ACCEPT");

  if (error) {
    console.error("getPendingTargets error:", error);
    return [];
  }

  return (data as any[]).map(d => ({
    id: d.id,
    campaign_id: d.campaign_id,
    name: d.master_ledger?.name || "",
    contact: d.master_ledger?.phone || "",
    address: d.master_ledger?.address || "",
    detail_address: d.master_ledger?.detail_address || "",
    nextVisitTime: null,
    visitCount: d.failed_visit_count || 0,
    department: d.department || "",
    tax_item: d.tax_item || "",
    arrears_amount: d.arrears_amount || "",
    arrears_count: d.arrears_count || "",
    seizure_details: d.seizure_details || "",
    installment_status: d.installment_status || "",
  }));
}

export async function submitVisitResult(targetId: string, isSuccess: boolean, encReason?: string, encMemo?: string, photos: string[] = []) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. visit_records 에 기록 (E2EE 암호문)
  await supabase.from("visit_records").insert({
    ledger_id: targetId,
    worker_id: user.id,
    scheduled_date: new Date().toISOString().split('T')[0],
    status: isSuccess ? 'COMPLETED' : 'UNVISITED',
    unvisited_reason: encReason,
    worker_memo: encMemo,
    photos: photos
  });

  // 2. task_ledger 상태 업데이트 (미방문시 UNASSIGNED 로 회수)
  if (!isSuccess) {
    const { data: ledger } = await supabase.from("task_ledger").select("failed_visit_count").eq("id", targetId).single();
    const failCount = (ledger?.failed_visit_count || 0) + 1;
    
    await supabase.from("task_ledger").update({
      current_status: "UNASSIGNED",
      assigned_worker_id: null,
      failed_visit_count: failCount,
      updated_at: new Date().toISOString()
    }).eq("id", targetId);
  } else {
    await supabase.from("task_ledger").update({
      current_status: "COMPLETED",
      updated_at: new Date().toISOString()
    }).eq("id", targetId);

    // 누적 처리 건수 증가
    const { data: profile } = await supabase
      .from("profiles")
      .select("cumulative_processed_count")
      .eq("id", user.id)
      .single();
      
    const newCount = (profile?.cumulative_processed_count || 0) + 1;
    await supabase.from("profiles").update({ cumulative_processed_count: newCount }).eq("id", user.id);
  }
}
