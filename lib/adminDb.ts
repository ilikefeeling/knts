"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export type Campaign = {
  id: string;
  admin_id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
};

export type MasterLedger = {
  id: string;
  admin_id: string;
  management_num?: string;
  taxpayer_type?: string;
  name: string;
  id_number?: string;
  phone: string;
  jurisdiction?: string;
  address: string;
  detail_address: string;
  is_intensive?: boolean;
  created_at: string;
};

export type TaskLedger = {
  id: string;
  campaign_id: string;
  master_id: string;
  assigned_worker_id: string | null;
  current_status: string;
  failed_visit_count: number;
  memo: string;
  worker_memo: string;
  department?: string;
  tax_item?: string;
  occurred_date?: string;
  arrears_amount?: string;
  arrears_count?: string;
  seizure_details?: string;
  notice_sent?: string;
  installment_status?: string;
  created_at: string;
  updated_at: string;
  // joined fields
  master_ledger?: MasterLedger;
};

export type Profile = {
  id: string;
  role: string;
  name: string | null;
  phone: string | null;
  status: string;
  cumulative_processed_count?: number;
  is_notified?: boolean;
  guide_completed_at?: string | null;
  pin_hash?: string | null;
};

// ---------------------------------------------------------
// 마스터 PIN 관리
// ---------------------------------------------------------
export async function getAdminPinHash(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("pin_hash")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data.pin_hash;
}

export async function setAdminPinHash(pinHash: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ pin_hash: pinHash })
    .eq("id", user.id);

  if (error) {
    console.error("setAdminPinHash Error:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------
// 데이터 재암호화 (Re-encryption)를 위한 서버액션
// ---------------------------------------------------------
export async function getAllEncryptedMasterLedgers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data, error } = await supabase.from("master_ledger").select("id, name, address, detail_address").eq("admin_id", user.id);
  if (error) throw error;
  return data;
}

export async function getAllEncryptedVisitRecords() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get workers for this admin
  const { data: workers } = await supabase.from("profiles").select("id").eq("admin_id", user.id).eq("role", "WORKER");
  const workerIds = workers?.map(w => w.id) || [];
  
  if (workerIds.length === 0) return [];

  const { data, error } = await supabase.from("visit_records").select("id, worker_memo, unvisited_reason").in("worker_id", workerIds);
  if (error) throw error;
  return data;
}

export async function updateBulkEncryptedMasterLedgers(updates: {id: string, name: string, address: string, detail_address: string}[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  for (const update of updates) {
    await supabase.from("master_ledger").update({name: update.name, address: update.address, detail_address: update.detail_address}).eq("id", update.id).eq("admin_id", user.id);
  }
}

export async function updateBulkEncryptedVisitRecords(updates: {id: string, worker_memo: string, unvisited_reason: string}[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: workers } = await supabase.from("profiles").select("id").eq("admin_id", user.id).eq("role", "WORKER");
  const workerIds = workers?.map(w => w.id) || [];
  if (workerIds.length === 0) return;

  for (const update of updates) {
    await supabase.from("visit_records").update({worker_memo: update.worker_memo, unvisited_reason: update.unvisited_reason}).eq("id", update.id).in("worker_id", workerIds);
  }
}

// ---------------------------------------------------------
// 캠페인 관리
// ---------------------------------------------------------
export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Campaign[];
}

export async function createCampaign(name: string, description: string): Promise<{ success: boolean; campaignId?: string; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      admin_id: user.id,
      name,
      description,
      status: "ACTIVE"
    })
    .select()
    .single();

  if (error) {
    console.error("Create Campaign Error:", error);
    return { success: false, message: error.message };
  }
  return { success: true, campaignId: data.id };
}

// ---------------------------------------------------------
// 명단 및 작업 원장 조회
// ---------------------------------------------------------
export async function getTaskLedgers(campaignId?: string): Promise<TaskLedger[]> {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("task_ledger")
    .select(`
      *,
      master_ledger:master_id (*)
    `)
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // DB에서 worker 삭제 등으로 인해 assigned_worker_id가 null이 되었지만
  // current_status가 여전히 'ASSIGNED'인 경우를 처리 (임시 자동 교정)
  const ledgers = data as TaskLedger[];
  ledgers.forEach(l => {
    if (!l.assigned_worker_id && l.current_status === "ASSIGNED") {
      l.current_status = "UNASSIGNED";
      // 백그라운드에서 DB도 수정해주면 좋음
      supabase.from("task_ledger").update({ current_status: "UNASSIGNED" }).eq("id", l.id).then();
    }
  });

  return ledgers;
}

export async function getWorkers(): Promise<Profile[]> {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "WORKER")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Profile[];
}

export async function fixCorruptedLedgers(): Promise<{ success: boolean; fixedCount: number; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    // 1) Fetch all valid workers for this admin
    const { data: workers } = await supabase.from("profiles").select("id").eq("admin_id", user.id).eq("role", "WORKER");
    const validIds = new Set(workers?.map(w => w.id) || []);

    // 2) Fetch all ledgers for this admin
    const { data: ledgers } = await supabase.from("task_ledger").select("id, assigned_worker_id, current_status").eq("admin_id", user.id);
    
    let fixedCount = 0;
    if (ledgers) {
      for (const l of ledgers) {
        let needsFix = false;

        // Catch invalid statuses (typos)
        const validStatuses = ["UNASSIGNED", "PENDING_ACCEPT", "ASSIGNED", "COMPLETED"];
        if (!validStatuses.includes(l.current_status)) {
          needsFix = true;
        }

        // Catch ASSIGNED or PENDING_ACCEPT with missing/invalid worker
        if ((l.current_status === "ASSIGNED" || l.current_status === "PENDING_ACCEPT") && 
            (!l.assigned_worker_id || !validIds.has(l.assigned_worker_id))) {
          needsFix = true;
        }

        if (needsFix) {
          await supabase.from("task_ledger").update({
            current_status: "UNASSIGNED",
            assigned_worker_id: null
          }).eq("id", l.id);
          fixedCount++;
        }
      }
    }

    return { success: true, fixedCount };
  } catch (error: any) {
    return { success: false, fixedCount: 0, message: error.message };
  }
}

// ---------------------------------------------------------
// 배정 관리 (슬롯 검증 포함)
// ---------------------------------------------------------

export async function getLicenseStatus() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let { data: license, error: fetchError } = await supabase.from("admin_licenses").select("*").eq("admin_id", user.id).single();
  
  if (!license) {
    const { data: newLicense, error: insertError } = await supabase.from("admin_licenses").insert({
      admin_id: user.id,
      total_slots: 100, // 기본 슬롯 넉넉히 제공
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1년
    }).select().single();
    
    if (newLicense) {
      license = newLicense;
    } else {
      license = {
        total_slots: 100,
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }

  const { data: assignedWorkers } = await supabase
    .from("task_ledger")
    .select("assigned_worker_id")
    .not("assigned_worker_id", "is", null);

  const uniqueWorkers = new Set(assignedWorkers?.map(w => w.assigned_worker_id));
  const usedSlots = uniqueWorkers.size;
  const isValid = new Date(license.valid_until) > new Date();

  return {
    totalSlots: license.total_slots,
    usedSlots: usedSlots,
    validUntil: license.valid_until,
    isValid: isValid,
    assignedWorkerIds: Array.from(uniqueWorkers)
  };
}

export async function processPayment(slots: number, months: number, totalAmount: number) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: license, error: fetchError } = await supabase.from("admin_licenses").select("*").eq("admin_id", user.id).single();
  
  if (fetchError || !license) {
    throw new Error("라이선스 정보를 찾을 수 없습니다.");
  }

  // 남은 기간 계산하여 연장
  const now = new Date();
  const currentValidUntil = new Date(license.valid_until);
  const baseDate = currentValidUntil > now ? currentValidUntil : now;
  
  const newValidUntil = new Date(baseDate.setMonth(baseDate.getMonth() + months)).toISOString();
  const newTotalSlots = license.total_slots + slots;

  const { error: updateError } = await supabase.from("admin_licenses").update({
    total_slots: newTotalSlots,
    valid_until: newValidUntil
  }).eq("admin_id", user.id);

  if (updateError) {
    throw new Error("라이선스 업데이트 중 오류가 발생했습니다.");
  }
  
  return true;
}

export async function assignTarget(taskId: string, workerId: string | null): Promise<void> {
  const supabase = await createClient();
  
  if (workerId) {
    const status = await getLicenseStatus();
    
    if (!status.isValid) {
      throw new Error("라이선스 기간이 만료되었습니다. 결제 페이지에서 기간을 연장해주세요.");
    }
    
    if (!status.assignedWorkerIds.includes(workerId)) {
      if (status.usedSlots >= status.totalSlots) {
        throw new Error(`작업자 슬롯이 부족합니다. (사용:${status.usedSlots} / 총:${status.totalSlots}) 결제 페이지에서 슬롯을 추가해주세요.`);
      }
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: target } = await supabase.from("task_ledger").select("campaign_id, assigned_worker_id, current_status").eq("id", taskId).single();

  const { error } = await supabase
    .from("task_ledger")
    .update({ 
      assigned_worker_id: workerId || null,
      current_status: workerId ? "ASSIGNED" : "UNASSIGNED",
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) throw error;

  if (target && user) {
    const action_type = workerId ? (target.assigned_worker_id ? "REASSIGN" : "ASSIGN") : "UNASSIGN";
    try {
      await supabase.from("assignment_logs").insert({
        campaign_id: target.campaign_id,
        target_id: taskId,
        admin_id: user.id,
        worker_id: workerId,
        action_type,
        previous_worker_id: target.assigned_worker_id || null
      });
    } catch (e) {
      console.error("Audit log insertion failed:", e);
    }
  }
}

export async function deleteTargets(taskIds: string[]): Promise<{ success: boolean; message?: string }> {
  if (!taskIds || taskIds.length === 0) {
    return { success: false, message: "삭제할 대상자가 없습니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("task_ledger")
    .delete()
    .in("id", taskIds);

  if (error) {
    return { success: false, message: "삭제 중 오류가 발생했습니다: " + error.message };
  }
  
  return { success: true };
}

export async function autoAssignTargets(campaignId: string, workerIds: string[]): Promise<{ success: boolean; message?: string; assignedCount?: number }> {
  if (!workerIds || workerIds.length === 0) {
    return { success: false, message: "선택된 보조원이 없습니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const status = await getLicenseStatus();
  if (!status.isValid) {
    return { success: false, message: "라이선스 기간이 만료되었습니다." };
  }

  const newWorkers = workerIds.filter(id => !status.assignedWorkerIds.includes(id));
  if (status.usedSlots + newWorkers.length > status.totalSlots) {
    return { success: false, message: `작업자 슬롯이 부족합니다. (필요:${status.usedSlots + newWorkers.length} / 총:${status.totalSlots})` };
  }

  // current_status가 UNASSIGNED이거나, assigned_worker_id가 null인 경우 모두 미배정으로 간주
  const { data: unassignedTargets } = await supabase
    .from("task_ledger")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("current_status", "UNASSIGNED");

  if (!unassignedTargets || unassignedTargets.length === 0) {
    return { success: false, message: "배정할 미배정 대상자가 없습니다." };
  }

  const assignments: Record<string, string[]> = {};
  workerIds.forEach(id => assignments[id] = []);

  unassignedTargets.forEach((target, index) => {
    const workerId = workerIds[index % workerIds.length];
    assignments[workerId].push(target.id);
  });

  for (const workerId of workerIds) {
    const targetIds = assignments[workerId];
    if (targetIds.length > 0) {
      const { error } = await supabase
        .from("task_ledger")
        .update({
          assigned_worker_id: workerId,
          current_status: "ASSIGNED",
          updated_at: new Date().toISOString()
        })
        .in("id", targetIds);

      if (error) {
        console.error("Bulk Assign Error:", error);
        return { success: false, message: `배정 실패 (보조원 ID: ${workerId}): ${error.message || "알 수 없는 오류"}` };
      }
    }
  }

  return { success: true, assignedCount: unassignedTargets.length };
}

export async function acceptAssignment(taskId: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { data: target } = await supabase.from("task_ledger").select("assigned_worker_id, current_status, campaign_id").eq("id", taskId).single();

  if (!target || target.assigned_worker_id !== user.id) {
    return { success: false, message: "권한이 없거나 대상을 찾을 수 없습니다." };
  }

  if (target.current_status !== "PENDING_ACCEPT") {
    return { success: false, message: "수락 대기 상태가 아닙니다." };
  }

  const { error } = await supabase
    .from("task_ledger")
    .update({ 
      current_status: "ASSIGNED",
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) return { success: false, message: error.message };

  try {
    await supabase.from("assignment_logs").insert({
      campaign_id: target.campaign_id,
      target_id: taskId,
      worker_id: user.id,
      action_type: "ACCEPT",
    });
  } catch (e) {
    console.error("Audit log insertion failed:", e);
  }

  return { success: true };
}

export async function rejectAssignment(taskId: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { data: target } = await supabase.from("task_ledger").select("assigned_worker_id, current_status, campaign_id").eq("id", taskId).single();

  if (!target || target.assigned_worker_id !== user.id) {
    return { success: false, message: "권한이 없거나 대상을 찾을 수 없습니다." };
  }

  if (target.current_status !== "PENDING_ACCEPT") {
    return { success: false, message: "수락 대기 상태가 아닙니다." };
  }

  const { error } = await supabase
    .from("task_ledger")
    .update({ 
      assigned_worker_id: null,
      current_status: "UNASSIGNED",
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) return { success: false, message: error.message };

  try {
    await supabase.from("assignment_logs").insert({
      campaign_id: target.campaign_id,
      target_id: taskId,
      worker_id: user.id,
      action_type: "REJECT",
    });
  } catch (e) {
    console.error("Audit log insertion failed:", e);
  }

  return { success: true };
}

// ---------------------------------------------------------
// 데이터 생성 로직
// ---------------------------------------------------------

export async function createLedgerTarget(campaignId: string, encName: string, phone: string, encAddress: string, encDetail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  // 1. Insert into master_ledger
  const { data: masterData, error: masterError } = await supabase
    .from("master_ledger")
    .insert({
      admin_id: user.id,
      name: encName,
      phone: phone || "",
      address: encAddress,
      detail_address: encDetail
    })
    .select()
    .single();

  if (masterError) {
    console.error("Insert Master Ledger Error:", masterError);
    return { success: false, message: `DB 오류(${masterError.code}): ${masterError.message}` };
  }

  // 2. Insert into task_ledger
  const { error: taskError } = await supabase
    .from("task_ledger")
    .insert({
      campaign_id: campaignId,
      master_id: masterData.id,
      admin_id: user.id,
      current_status: "UNASSIGNED"
    });

  if (taskError) {
    console.error("Insert Task Ledger Error:", taskError);
    return { success: false, message: `DB 오류(${taskError.code}): ${taskError.message}` };
  }

  return { success: true };
}

export async function createMockTarget(campaignId: string, encName: string, encAddress: string, encDetail: string) {
  return createLedgerTarget(campaignId, encName, "010-0000-0000", encAddress, encDetail);
}

export async function createUploadNotice(campaignName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const title = "[알림] 새로운 업무가 배정되었습니다.";
  const content = `* 배정 캠페인: '${campaignName}'\n\n각 보조원님들은 나의 관리대장에서 할당된 대상자 목록을 확인하고 현장 점검을 진행해 주세요.`;

  const { error } = await supabase
    .from("notices")
    .insert({
      admin_id: user.id,
      title: title,
      content: content,
      is_important: false
    });

  if (error) {
    console.error("Create Notice Error:", error);
    return { success: false, message: error.message };
  }
  return { success: true };
}

// ---------------------------------------------------------
// 작업자 관리 / 기타 유틸리티
// ---------------------------------------------------------

export async function registerWorkerAccount(name: string, phone: string, initialPin: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요합니다." };

  const { createClient: createServerClient } = await import('@supabase/supabase-js');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const tempSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const phoneDigits = phone.replace(/[^0-9]/g, '');
  const dummyEmail = `${phoneDigits}@knts.local`;
  const generatedPin = initialPin.padEnd(6, '0');

  let signUpData, signUpError;

  if (serviceRoleKey) {
    const res = await tempSupabase.auth.admin.createUser({
      email: dummyEmail,
      password: generatedPin,
      email_confirm: true,
    });
    signUpData = res.data;
    signUpError = res.error;
  } else {
    const res = await tempSupabase.auth.signUp({
      email: dummyEmail,
      password: generatedPin,
    });
    signUpData = res.data;
    signUpError = res.error;
  }

  if (signUpError) {
    if (signUpError.message.includes("User already registered") || signUpError.message.includes("already been registered")) {
      if (serviceRoleKey) {
        let existingUserId = null;
        let page = 1;
        while (true) {
          const { data: { users }, error: listError } = await tempSupabase.auth.admin.listUsers({ page, perPage: 100 });
          if (listError || !users || users.length === 0) break;
          
          const found = users.find(u => u.email === dummyEmail);
          if (found) {
            existingUserId = found.id;
            break;
          }
          if (users.length < 100) break; // Last page
          page++;
        }

        if (existingUserId) {
          const { error: profileError } = await tempSupabase.from("profiles").upsert({
            id: existingUserId,
            admin_id: user.id,
            role: "WORKER",
            status: "ACTIVE",
            name: name,
            phone: phone,
            is_notified: false
          });
          if (!profileError) {
            revalidatePath("/admin/workers");
            revalidatePath("/admin");
            return { success: true, workerId: existingUserId };
          } else {
            return { success: false, message: "프로필 복구 실패: " + profileError.message };
          }
        }
      }
    }
    return { success: false, message: "작업자 생성 실패: " + signUpError.message };
  }

  if (signUpData.user) {
    const targetSupabase = serviceRoleKey ? tempSupabase : supabase;
    const { error: profileError } = await targetSupabase.from("profiles").upsert({
      id: signUpData.user.id,
      admin_id: user.id,
      role: "WORKER",
      status: "ACTIVE",
      name: name,
      phone: phone,
      is_notified: false
    });
    if (profileError) return { success: false, message: `프로필 생성 실패: ${profileError.message}` };
  }
  
  revalidatePath("/admin/workers");
  revalidatePath("/admin");
  
  return { success: true, workerId: signUpData.user?.id };
}

export async function sendMockSMS(workerIds: string[], masterPin: string): Promise<{ success: boolean; message?: string; sentCount?: number }> {
  if (!workerIds || workerIds.length === 0) return { success: false, message: "발송 대상이 없습니다." };

  const supabase = await createClient();
  const { createClient: createServerClient } = await import('@supabase/supabase-js');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    return { success: false, message: "서버 키가 설정되지 않아 상태를 업데이트할 수 없습니다." };
  }

  const tempSupabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } });

  const { data: targets, error: fetchErr } = await tempSupabase
    .from("profiles")
    .select("id, name, phone, is_notified")
    .in("id", workerIds)
    .eq("is_notified", false);

  if (fetchErr) return { success: false, message: "발송 대상 조회 중 오류가 발생했습니다." };
  if (!targets || targets.length === 0) return { success: false, message: "모든 대상이 이미 안내 메시지를 받았습니다." };

  console.log(`\n========== [가입 SMS 발송 시뮬레이션: 총 ${targets.length}건] ==========`);
  targets.forEach(t => {
    console.log(`To: ${t.phone} (${t.name})`);
    console.log(`[Field-Master 현장조사 관리팀]\n환영합니다. 시스템 등록이 완료되었습니다.\n- 접속 주소: https://knts.vercel.app\n- 아이디: ${t.phone}\n- 초기 비밀번호: ${t.phone?.slice(-4)}\n- 마스터 해독 PIN: ${masterPin} (이 번호는 계속 사용되니 외워주세요!)`);
    console.log("-----------------------------------------------------");
  });
  console.log("=========================================================\n");

  const targetIds = targets.map(t => t.id);
  const { error: updateErr } = await tempSupabase
    .from("profiles")
    .update({ is_notified: true })
    .in("id", targetIds);

  if (updateErr) return { success: false, message: "상태 업데이트 중 오류가 발생했습니다." };
  return { success: true, sentCount: targets.length };
}

export async function getVisitRecords(): Promise<any[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("visit_records")
    .select(`
      id,
      scheduled_date,
      status,
      unvisited_reason,
      worker_memo,
      photos,
      created_at,
      worker:profiles ( name, phone ),
      task:task_ledger (
        master_ledger:master_id ( name, phone, address, detail_address )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as any[];
}

export async function updateWorker(id: string, name: string, newPin?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { error: profileError } = await supabase.from('profiles').update({ name }).eq('id', id);
  if (profileError) return { success: false, message: profileError.message };

  if (newPin) {
    const { createClient: createServerClient } = await import('@supabase/supabase-js');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const tempSupabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } });
      const generatedPin = newPin.padEnd(6, '0');
      const { error: authError } = await tempSupabase.auth.admin.updateUserById(id, { password: generatedPin });
      if (authError) return { success: false, message: authError.message };
    }
  }
  return { success: true };
}

export async function deleteWorker(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createClient: createServerClient } = await import('@supabase/supabase-js');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return { success: false, message: "작업자 삭제를 위한 서버 키가 설정되지 않았습니다." };

  const tempSupabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } });

  await tempSupabase.from('profiles').delete().eq('id', id);
  const { error } = await tempSupabase.auth.admin.deleteUser(id);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function forceGuideComplete(workerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from('profiles')
    .update({ guide_completed_at: new Date().toISOString() })
    .eq('id', workerId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ---------------------------------------------------------
// PIN Audit Logs
// ---------------------------------------------------------

export type PinAuditLog = {
  id: string;
  created_at: string;
  event_type: string;
  description: string;
  is_distributed: boolean;
  distributed_at: string | null;
};

export async function addPinAuditLog(eventType: string, description: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('pin_audit_logs').insert({
    event_type: eventType,
    description: description,
    is_distributed: false,
  });
  if (error) console.error("addPinAuditLog error:", error);
}

export async function markLatestPinAsDistributed() {
  const supabase = await createClient();
  // Find the most recent record
  const { data, error } = await supabase
    .from('pin_audit_logs')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error("markLatestPinAsDistributed fetch error:", error);
    return;
  }

  const { error: updateError } = await supabase
    .from('pin_audit_logs')
    .update({
      is_distributed: true,
      distributed_at: new Date().toISOString()
    })
    .eq('id', data.id);

  if (updateError) console.error("markLatestPinAsDistributed update error:", updateError);
}

export async function markPinAsDistributedById(logId: string) {
  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from('pin_audit_logs')
    .update({
      is_distributed: true,
      distributed_at: new Date().toISOString()
    })
    .eq('id', logId);

  if (updateError) console.error("markPinAsDistributedById update error:", updateError);
}

export async function getPinAuditLogs(): Promise<PinAuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("getPinAuditLogs error:", error);
    return [];
  }

  // Removed auto-injection of PIN_CREATED log to prevent phantom logs after demo reset.

  return data || [];
}

// ---------------------------------------------------------
// 마스터 원장 관리
// ---------------------------------------------------------
export async function getMasterLedgers(): Promise<MasterLedger[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_ledger")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as MasterLedger[];
}

export async function setMasterLedgerIntensive(ids: string[]): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("master_ledger")
    .update({ is_intensive: true })
    .in("id", ids);
  
  if (error) {
    console.error("Set Intensive Error:", error);
    return false;
  }
  return true;
}
export async function uploadMasterLedgers(data: { name: string, phone: string, address: string, detail_address: string }[]): Promise<{ success: boolean; count?: number; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  const insertData = data.map(d => ({
    admin_id: user.id,
    name: d.name,
    phone: d.phone,
    address: d.address,
    detail_address: d.detail_address,
    is_intensive: false,
  }));

  const { error } = await supabase.from('master_ledger').insert(insertData);
  if (error) {
    console.error('Upload Master Ledgers Error:', error);
    return { success: false, message: error.message };
  }
  return { success: true, count: data.length };
}

export type AdminExcelRow = {
  management_num: string;
  taxpayer_type: string;
  name: string;
  id_number: string;
  phone: string;
  jurisdiction: string;
  address: string;
  detail_address: string;
  department: string;
  tax_item: string;
  arrears_amount: string;
  occurred_date: string;
  arrears_count: string;
  seizure_details: string;
  notice_sent: string;
  installment_status: string;
  memo: string;
};

export async function upsertLedgerFromExcel(campaignId: string, rows: AdminExcelRow[]): Promise<{ success: boolean; masterCount: number; taskCount: number; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, masterCount: 0, taskCount: 0, message: "Unauthorized" };

    if (!rows || rows.length === 0) {
      return { success: false, masterCount: 0, taskCount: 0, message: "No data" };
    }

    // 1. Upsert master_ledger
    const masterPayloads = rows.map(r => ({
      admin_id: user.id,
      management_num: r.management_num,
      taxpayer_type: r.taxpayer_type,
      name: r.name,
      id_number: r.id_number,
      phone: r.phone,
      jurisdiction: r.jurisdiction,
      address: r.address,
      detail_address: r.detail_address,
      is_intensive: false,
    }));

    const { data: upsertedMasters, error: masterErr } = await supabase
      .from('master_ledger')
      .upsert(masterPayloads, { onConflict: 'management_num' })
      .select('id, management_num');

    if (masterErr) {
      console.error('upsert master_ledger error:', masterErr);
      return { success: false, masterCount: 0, taskCount: 0, message: masterErr.message };
    }

    const masterMap = new Map();
    if (upsertedMasters) {
      upsertedMasters.forEach(m => masterMap.set(m.management_num, m.id));
    }

    // 2. Fetch existing tasks for this campaign to avoid duplicates
    const { data: existingTasks } = await supabase
      .from('task_ledger')
      .select('master_id')
      .eq('campaign_id', campaignId);
    
    const existingMasterIds = new Set(existingTasks?.map(t => t.master_id) || []);

    // 3. Prepare task payloads
    const taskPayloads: any[] = [];
    rows.forEach(r => {
      const masterId = masterMap.get(r.management_num);
      if (masterId && !existingMasterIds.has(masterId)) {
        taskPayloads.push({
          campaign_id: campaignId,
          master_id: masterId,
          admin_id: user.id,
          current_status: 'UNASSIGNED',
          department: r.department,
          tax_item: r.tax_item,
          occurred_date: r.occurred_date,
          arrears_amount: r.arrears_amount,
          arrears_count: r.arrears_count,
          seizure_details: r.seizure_details,
          notice_sent: r.notice_sent,
          installment_status: r.installment_status,
          memo: r.memo,
        });
        existingMasterIds.add(masterId); // Add to set to avoid duplicates within same batch
      }
    });

    if (taskPayloads.length > 0) {
      const { error: taskErr } = await supabase.from('task_ledger').insert(taskPayloads);
      if (taskErr) {
        console.error('insert task_ledger error:', taskErr);
        return { success: false, masterCount: upsertedMasters?.length || 0, taskCount: 0, message: taskErr.message };
      }
    }

    return { success: true, masterCount: upsertedMasters?.length || 0, taskCount: taskPayloads.length };
  } catch (error: any) {
    console.error('upsertLedgerFromExcel exception:', error);
    return { success: false, masterCount: 0, taskCount: 0, message: error.message };
  }
}

// ---------------------------------------------------------
// 대시보드 전용 집계 함수
// ---------------------------------------------------------

export type DashboardWorkerSummary = {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  guide_completed_at: string | null;
  assigned_count: number;
  completed_today: number;
  assigned_today: number;
};

export type RecentActivity = {
  id: string;
  created_at: string;
  action_type: string;
  worker_name?: string;
  target_name?: string;
};

export async function getDashboardStats(): Promise<{
  workers: DashboardWorkerSummary[];
  statusCounts: { unassigned: number; assigned: number; pending: number; completed: number };
  licenseInfo: { totalSlots: number; usedSlots: number; validUntil: string; isValid: boolean } | null;
}> {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. 확인원 목록
  const { data: workerProfiles } = await supabase
    .from("profiles")
    .select("id, name, phone, status, guide_completed_at")
    .eq("role", "WORKER")
    .eq("admin_id", user.id);

  // 2. 전체 task_ledger 상태별 카운트 (해당 관리자 소속만)
  const { data: allTasks } = await supabase
    .from("task_ledger")
    .select("id, current_status, assigned_worker_id, updated_at")
    .eq("admin_id", user.id);

  const statusCounts = { unassigned: 0, assigned: 0, pending: 0, completed: 0 };
  const workerAssignMap = new Map<string, number>();
  const workerCompletedTodayMap = new Map<string, number>();
  const workerAssignedTodayMap = new Map<string, number>();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  allTasks?.forEach(t => {
    switch (t.current_status) {
      case "UNASSIGNED": statusCounts.unassigned++; break;
      case "ASSIGNED": statusCounts.assigned++; break;
      case "PENDING_ACCEPT": statusCounts.pending++; break;
      case "COMPLETED": statusCounts.completed++; break;
      default: statusCounts.unassigned++; break;
    }

    if (t.assigned_worker_id) {
      workerAssignMap.set(t.assigned_worker_id, (workerAssignMap.get(t.assigned_worker_id) || 0) + 1);

      const updatedAt = new Date(t.updated_at);
      if (updatedAt >= todayStart) {
        if (t.current_status === "COMPLETED") {
          workerCompletedTodayMap.set(t.assigned_worker_id, (workerCompletedTodayMap.get(t.assigned_worker_id) || 0) + 1);
        }
        if (t.current_status === "ASSIGNED" || t.current_status === "PENDING_ACCEPT") {
          workerAssignedTodayMap.set(t.assigned_worker_id, (workerAssignedTodayMap.get(t.assigned_worker_id) || 0) + 1);
        }
      }
    }
  });

  const workers: DashboardWorkerSummary[] = (workerProfiles || []).map(w => ({
    id: w.id,
    name: w.name || "이름없음",
    phone: w.phone,
    status: w.status,
    guide_completed_at: w.guide_completed_at,
    assigned_count: workerAssignMap.get(w.id) || 0,
    completed_today: workerCompletedTodayMap.get(w.id) || 0,
    assigned_today: workerAssignedTodayMap.get(w.id) || 0,
  }));

  // 3. 라이선스 정보
  let licenseInfo = null;
  try {
    const status = await getLicenseStatus();
    licenseInfo = {
      totalSlots: status.totalSlots,
      usedSlots: status.usedSlots,
      validUntil: status.validUntil,
      isValid: status.isValid,
    };
  } catch (e) {
    // 라이선스 테이블 없을 수 있음
  }

  return { workers, statusCounts, licenseInfo };
}

export async function getRecentActivities(limit: number = 8): Promise<RecentActivity[]> {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // assignment_logs에서 최근 활동 가져오기
  // worker_id를 기준으로 현재 관리자 소속의 로그만 가져옵니다.
  const { data: workers } = await supabase.from("profiles").select("id").eq("admin_id", user.id).eq("role", "WORKER");
  const workerIds = workers?.map(w => w.id) || [];
  
  if (workerIds.length === 0) return [];

  const { data: logs, error } = await supabase
    .from("assignment_logs")
    .select("id, created_at, action_type, worker_id")
    .in("worker_id", workerIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !logs) return [];

  // worker 이름 매핑
  const logWorkerIds = [...new Set(logs.map(l => l.worker_id).filter(Boolean))];
  const { data: workerProfiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", logWorkerIds.length > 0 ? logWorkerIds : ["__none__"]);

  const workerNameMap = new Map<string, string>();
  workerProfiles?.forEach(w => workerNameMap.set(w.id, w.name || "이름없음"));

  return logs.map(l => ({
    id: l.id,
    created_at: l.created_at,
    action_type: l.action_type,
    worker_name: l.worker_id ? workerNameMap.get(l.worker_id) || "알 수 없음" : undefined,
  }));
}

