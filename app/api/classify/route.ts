import { NextRequest, NextResponse } from "next/server";

const RESULT_OPTIONS = [
  "접촉성공",
  "부재중",
  "연락두절",
  "납부협의",
  "거부",
  "폐업확인",
  "재방문필요",
] as const;

const SYSTEM_PROMPT = `당신은 국세외수입 체납관리단 실태확인원의 현장 상담 녹취록을 정리하는 보조 도구입니다.
입력된 텍스트(음성-텍스트 변환 결과)를 분석하여 아래 JSON 형식으로만 응답하세요.
다른 설명, 인사말, 마크다운 코드블록 없이 JSON 객체 하나만 출력합니다.

{
  "result": "${RESULT_OPTIONS.join(" | ")}" 중 하나,
  "summary": "특이사항 및 다음조치를 1~2문장으로 요약 (한국어, 최대 80자)"
}

판단 기준:
- "납부협의": 납부 일정, 금액 등에 대한 합의/약속이 언급된 경우
- "폐업확인": 폐업, 영업 종료가 확인된 경우
- "연락두절": 연락이 닿지 않거나 응답이 없었다는 내용인 경우
- "거부": 납부 의사가 없거나 조사에 비협조적인 경우
- "재방문필요": 추가 확인이나 재방문이 필요하다고 판단되는 경우
- "부재중": 방문했으나 사람이 없었던 경우
- "접촉성공": 위 항목에 명확히 해당하지 않으나 정상적으로 접촉/상담이 이루어진 경우`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const text = body?.text as string | undefined;

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "text가 비어 있습니다." }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text.slice(0, 4000) }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `LLM 호출 실패: ${res.status} ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const raw: string =
      data?.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const result = RESULT_OPTIONS.includes(parsed.result)
      ? parsed.result
      : "재방문필요";
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";

    return NextResponse.json({ result, summary });
  } catch (err) {
    return NextResponse.json(
      { error: `자동분류 처리 중 오류: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
