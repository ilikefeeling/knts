// ─── 사용량/구독 상태 (로컬 저장) ───
// AI 자동분류(/api/classify) 호출은 비용이 발생하므로,
// Free 사용자는 월 FREE_MONTHLY_LIMIT 건까지만 자동분류를 사용할 수 있습니다.
// Pro 사용자는 무제한입니다.
//
// TODO: 실제 결제(토스페이먼츠 등) 연동 시, setProUser()를 결제 성공 콜백에서
// 호출하도록 교체하고, 구독 상태도 서버/DB 기준으로 검증하도록 변경 필요.
// 현재는 클라이언트 로컬 저장 기반의 데모/MVP 구현입니다.

const USAGE_KEY = "knts_usage_v1";
const PRO_KEY = "knts_pro_v1";

export const FREE_MONTHLY_LIMIT = 15;
export const PRO_PRICE_KRW = 4900;

export type UsageState = {
  yearMonth: string; // "YYYY-MM"
  count: number;
};

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getUsage(): UsageState {
  const ym = currentYearMonth();
  if (typeof window === "undefined") return { yearMonth: ym, count: 0 };

  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { yearMonth: ym, count: 0 };

    const parsed = JSON.parse(raw) as UsageState;
    // 월이 바뀌면 자동 초기화
    if (parsed.yearMonth !== ym) return { yearMonth: ym, count: 0 };
    return parsed;
  } catch {
    return { yearMonth: ym, count: 0 };
  }
}

export function incrementUsage(): UsageState {
  const next = getUsage();
  next.count += 1;
  if (typeof window !== "undefined") {
    localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function isProUser(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PRO_KEY) === "true";
}

export function setProUser(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRO_KEY, value ? "true" : "false");
}

export function getRemainingFree(): number {
  return Math.max(0, FREE_MONTHLY_LIMIT - getUsage().count);
}

// 이번 호출에서 AI 자동분류를 사용할 수 있는지 (Pro이거나 무료 한도 내)
export function canUseAutoClassify(): boolean {
  return isProUser() || getRemainingFree() > 0;
}
