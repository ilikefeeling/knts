// TODO: Vercel 배포 완료 후 실제 도메인으로 교체
export const APP_URL = "https://knts.vercel.app";

export const RESULT_OPTIONS = [
  "방문예정",
  "예약",
  "접촉성공",
  "부재중",
  "연락두절",
  "납부협의",
  "거부",
  "폐업확인",
  "재방문필요",
] as const;

export type ResultOption = (typeof RESULT_OPTIONS)[number];

// ─── 문자 템플릿 ───

export const SMS_TEMPLATES = [
  {
    label: "방문 예정 통보",
    body: "안녕하세요, 현장조사 관리팀입니다. {날짜} {시간}에 방문 예정임을 알려드립니다.",
  },
  {
    label: "납부 안내",
    body: "안녕하세요, 현장조사 관리팀입니다. 미납금 납부 안내드립니다. 문의사항은 연락 부탁드립니다.",
  },
  {
    label: "재방문 일정 통보",
    body: "안녕하세요, 현장조사 관리팀입니다. {날짜} {시간}에 재방문 예정입니다. 확인 부탁드립니다.",
  },
  {
    label: "직접 작성",
    body: "",
  },
] as const;

// ─── 변경 사유 카테고리 ───

export const CHANGE_REASON_CATEGORIES = [
  "문자 통보 후 일정 변경",
  "체납자 요청에 의한 변경",
  "담당 공무원 지시",
  "현장 확인 결과 정정",
  "기타 (직접 입력)",
] as const;

export type ChangeReasonCategory = (typeof CHANGE_REASON_CATEGORIES)[number];

// ─── 재방문 예약 시간 옵션 (30분 단위) ───

export const VISIT_TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 18; h++) {
  VISIT_TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 18) VISIT_TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}
