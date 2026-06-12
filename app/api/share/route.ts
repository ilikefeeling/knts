import { NextRequest, NextResponse } from "next/server";
import { saveShareText, getShareText } from "@/lib/shareStore";

// iOS 단축어(Shortcuts) 2차 구현 시 사용:
// 1) 단축어가 텍스트를 이 엔드포인트로 POST -> { id } 응답
// 2) 단축어가 https://.../share-receiver?id=xxx 를 Safari/PWA로 오픈 (GET)
export async function POST(req: NextRequest) {
  let text = "";

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    text = (body?.text as string) || "";
  } else {
    const formData = await req.formData();
    text = (formData.get("text") as string) || "";
  }

  if (!text.trim()) {
    return NextResponse.json({ error: "text가 비어 있습니다." }, { status: 400 });
  }

  const id = saveShareText(text.trim());
  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id 파라미터가 필요합니다." }, { status: 400 });
  }

  const text = getShareText(id);
  if (text === null) {
    return NextResponse.json(
      { error: "만료되었거나 존재하지 않는 항목입니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ text });
}
