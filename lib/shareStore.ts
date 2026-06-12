type ShareEntry = {
  text: string;
  createdAt: number;
};

const TTL_MS = 60 * 60 * 1000; // 1시간

declare global {
  // eslint-disable-next-line no-var
  var __knts_share_store: Map<string, ShareEntry> | undefined;
}

function getStore(): Map<string, ShareEntry> {
  if (!global.__knts_share_store) {
    global.__knts_share_store = new Map();
  }
  return global.__knts_share_store;
}

function cleanup(store: Map<string, ShareEntry>) {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(id);
    }
  }
}

export function saveShareText(text: string): string {
  const store = getStore();
  cleanup(store);
  const id = Math.random().toString(36).slice(2, 10);
  store.set(id, { text, createdAt: Date.now() });
  return id;
}

export function getShareText(id: string): string | null {
  const store = getStore();
  cleanup(store);
  const entry = store.get(id);
  return entry ? entry.text : null;
}

// 참고(MVP -> 운영 전환 시):
// 서버 재시작/다중 인스턴스 환경에서는 인메모리 Map이 유지되지 않으므로,
// Redis 또는 DB(예: Supabase) 기반 임시 저장소로 교체 필요. TTL 1시간 정책은 동일하게 유지.
