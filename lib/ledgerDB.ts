// ─── 원장(마스터 DB) — IndexedDB 기반 ───
// 브라우저 로컬에 체납자 원장 데이터를 누적 보관합니다.
// localStorage(5~10MB 제한)와 달리 IndexedDB는 용량 제한이 거의 없어
// 원장이 누적되더라도 안정적으로 동작합니다.

const DB_NAME = "fieldmaster_ledger";
const DB_VERSION = 1;
const STORE_NAME = "records";

export type LedgerRecord = {
  id: string;
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
  visitCount: number;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("name_address", ["name", "address"], { unique: false });
        store.createIndex("nextVisitDate", "nextVisitDate", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── CRUD ───

export async function getAllRecords(): Promise<LedgerRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as LedgerRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getRecord(id: string): Promise<LedgerRecord | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as LedgerRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function putRecord(record: LedgerRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── 오늘의 방문명단 ───

export async function getTodayVisitList(): Promise<LedgerRecord[]> {
  const all = await getAllRecords();
  const today = todayStr();
  const list = all.filter((r) => r.nextVisitDate === today);

  // 정렬: 예약시간 있는 건 우선 → 시간순
  list.sort((a, b) => {
    const ta = a.nextVisitTime || "99:99";
    const tb = b.nextVisitTime || "99:99";
    return ta.localeCompare(tb);
  });

  return list;
}

// ─── 엑셀 업로드 → 원장 upsert ───

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
  visitDate?: string // 업로드 시 방문 예정일 지정 (기본: 오늘)
): Promise<UpsertResult> {
  const all = await getAllRecords();
  const now = new Date().toISOString();
  const targetDate = visitDate || todayStr();

  // 성명+주소 기준 기존 레코드 맵
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
      // 기존 레코드 업데이트 (체납액, 연락처 등 갱신 + 방문예정일 설정)
      const updatedRecord: LedgerRecord = {
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
      resultRecords.push({ record: updatedRecord, isNew: false });
    } else {
      // 신규 추가
      const newRecord: LedgerRecord = {
        id: generateId(),
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
        visitCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      await putRecord(newRecord);
      created++;
      resultRecords.push({ record: newRecord, isNew: true });
    }
  }

  return { created, updated, records: resultRecords };
}

// ─── 현장기록 저장 ───

export async function updateVisitResult(
  id: string,
  result: string,
  summary: string,
  nextDate?: string | null,
  nextTime?: string | null
): Promise<LedgerRecord | null> {
  const record = await getRecord(id);
  if (!record) return null;

  const now = new Date().toISOString();
  const updated: LedgerRecord = {
    ...record,
    lastVisitResult: result,
    lastVisitDate: todayStr(),
    lastVisitSummary: summary,
    visitCount: record.visitCount + 1,
    nextVisitDate: nextDate ?? null,
    nextVisitTime: nextTime ?? null,
    updatedAt: now,
  };

  await putRecord(updated);
  return updated;
}

// ─── 사후 수정 (사유 포함) ───

export async function updateRecordFields(
  id: string,
  changes: Partial<LedgerRecord>
): Promise<{ before: LedgerRecord; after: LedgerRecord } | null> {
  const record = await getRecord(id);
  if (!record) return null;

  const before = { ...record };
  const after: LedgerRecord = {
    ...record,
    ...changes,
    id: record.id, // ID는 변경 불가
    createdAt: record.createdAt, // 생성일은 변경 불가
    updatedAt: new Date().toISOString(),
  };

  await putRecord(after);
  return { before, after };
}
