// ─── 변경이력(Audit Log) — IndexedDB append-only ───
// 원장의 모든 변경을 자동 기록합니다.
// 이력은 삭제·수정 불가(append-only)이며, 감사 시 증거로 활용됩니다.

const DB_NAME = "fieldmaster_audit";
const DB_VERSION = 1;
const STORE_NAME = "logs";

export type AuditAction =
  | "RECORD_CREATED"
  | "RECORD_UPDATED_EXCEL"
  | "VISIT_RECORDED"
  | "REVISIT_SCHEDULED"
  | "RECORD_MODIFIED"
  | "SMS_SENT";

export type AuditLog = {
  logId: string;
  recordId: string;
  recordName: string;
  action: AuditAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  reason: string | null;
  reasonCategory: string | null;
  timestamp: string; // ISO 8601
};

function openAuditDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "logId" });
        store.createIndex("recordId", "recordId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("action", "action", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function generateLogId(): string {
  return "log_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── 이력 추가 (삭제·수정 함수는 의도적으로 미제공) ───

export async function addLog(
  params: Omit<AuditLog, "logId" | "timestamp">
): Promise<AuditLog> {
  const db = await openAuditDB();
  const log: AuditLog = {
    ...params,
    logId: generateLogId(),
    timestamp: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add(log);
    tx.oncomplete = () => resolve(log);
    tx.onerror = () => reject(tx.error);
  });
}

// ─── 특정 체납자의 전체 이력 조회 ───

export async function getLogsByRecord(recordId: string): Promise<AuditLog[]> {
  const db = await openAuditDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("recordId");
    const req = index.getAll(recordId);
    req.onsuccess = () => {
      const logs = (req.result as AuditLog[]).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(logs);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── 전체 이력 조회 ───

export async function getAllLogs(): Promise<AuditLog[]> {
  const db = await openAuditDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const logs = (req.result as AuditLog[]).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(logs);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── 이력의 action 한글 라벨 ───

export function actionLabel(action: AuditAction): string {
  switch (action) {
    case "RECORD_CREATED": return "엑셀 업로드로 등록";
    case "RECORD_UPDATED_EXCEL": return "엑셀 업로드로 갱신";
    case "VISIT_RECORDED": return "현장 방문 기록";
    case "REVISIT_SCHEDULED": return "재방문 예약 설정";
    case "RECORD_MODIFIED": return "수정";
    case "SMS_SENT": return "문자 발송";
    default: return action;
  }
}

// ─── 타임스탬프 포맷 ───

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${h}:${min}`;
}
