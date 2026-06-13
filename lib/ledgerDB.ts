"use server";

import { createClient } from "@/utils/supabase/server";

export type LedgerRecord = {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  address: string;
  debtAmount: string;
  debtPeriod: string;
  notes: string;
  nextVisitDate: string | null;   // YYYY-MM-DD
  nextVisitTime: string | null;   // HH:mm
  lastVisitResult: string | null;
  lastVisitDate: string | null;
  lastVisitSummary: string | null;
  lastVisitPhotos: string[];       // 이미지 URL 배열
  visitCount: number;
  createdAt: string;
  updatedAt: string;
};

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getAllRecords(): Promise<LedgerRecord[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) throw error;
  return data as LedgerRecord[];
}

export async function getRecord(id: string): Promise<LedgerRecord | undefined> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return undefined;
  return data as LedgerRecord;
}

export async function putRecord(record: Partial<LedgerRecord>): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // user_id를 자동으로 주입
  const recordToUpsert = {
    ...record,
    user_id: user.id,
  };

  const { error } = await supabase
    .from("records")
    .upsert(recordToUpsert);

  if (error) throw error;
}

export async function getTodayVisitList(): Promise<LedgerRecord[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = todayStr();
  
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("nextVisitDate", today);

  if (error) throw error;

  const list = data as LedgerRecord[];
  
  list.sort((a, b) => {
    const ta = a.nextVisitTime || "99:99";
    const tb = b.nextVisitTime || "99:99";
    return ta.localeCompare(tb);
  });

  return list;
}

export type ExcelRow = {
  name: string;
  contact: string;
  address: string;
  debtAmount: string;
  debtPeriod: string;
  notes: string;
};

export type UpsertResult = {
  created: number;
  updated: number;
  records: { record: LedgerRecord; isNew: boolean }[];
};

export async function upsertFromExcel(
  rows: ExcelRow[],
  visitDate?: string
): Promise<UpsertResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const all = await getAllRecords();
  const now = new Date().toISOString();
  const targetDate = visitDate || todayStr();

  const existingMap = new Map<string, LedgerRecord>();
  for (const r of all) {
    existingMap.set(`${r.name}||${r.address}`, r);
  }

  let created = 0;
  let updated = 0;
  const resultRecords: { record: LedgerRecord; isNew: boolean }[] = [];

  for (const row of rows) {
    const key = `${row.name}||${row.address}`;
    const existing = existingMap.get(key);

    if (existing) {
      const updatedRecord = {
        ...existing,
        contact: row.contact || existing.contact,
        debtAmount: row.debtAmount || existing.debtAmount,
        debtPeriod: row.debtPeriod || existing.debtPeriod,
        notes: row.notes || existing.notes,
        nextVisitDate: targetDate,
        updatedAt: now,
      };
      await putRecord(updatedRecord);
      updated++;
      resultRecords.push({ record: updatedRecord as LedgerRecord, isNew: false });
    } else {
      const newRecord = {
        user_id: user.id,
        name: row.name,
        contact: row.contact,
        address: row.address,
        debtAmount: row.debtAmount,
        debtPeriod: row.debtPeriod,
        notes: row.notes,
        nextVisitDate: targetDate,
        nextVisitTime: null,
        lastVisitResult: null,
        lastVisitDate: null,
        lastVisitSummary: null,
        lastVisitPhotos: [],
        visitCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      
      const { data, error } = await supabase
        .from("records")
        .insert(newRecord)
        .select()
        .single();
        
      if (!error && data) {
        created++;
        resultRecords.push({ record: data as LedgerRecord, isNew: true });
      }
    }
  }

  return { created, updated, records: resultRecords };
}

export async function updateVisitResult(
  id: string,
  result: string,
  summary: string,
  nextDate?: string | null,
  nextTime?: string | null,
  photos?: string[]
): Promise<LedgerRecord | null> {
  const record = await getRecord(id);
  if (!record) return null;

  const now = new Date().toISOString();
  const updated = {
    ...record,
    lastVisitResult: result,
    lastVisitDate: todayStr(),
    lastVisitSummary: summary,
    lastVisitPhotos: photos ?? record.lastVisitPhotos ?? [],
    visitCount: record.visitCount + 1,
    nextVisitDate: nextDate ?? null,
    nextVisitTime: nextTime ?? null,
    updatedAt: now,
  };

  await putRecord(updated);
  return updated as LedgerRecord;
}

export async function updateRecordFields(
  id: string,
  changes: Partial<LedgerRecord>
): Promise<{ before: LedgerRecord; after: LedgerRecord } | null> {
  const record = await getRecord(id);
  if (!record) return null;

  const before = { ...record };
  const after = {
    ...record,
    ...changes,
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await putRecord(after);
  return { before, after: after as LedgerRecord };
}
