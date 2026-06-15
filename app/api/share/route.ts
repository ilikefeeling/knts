import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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

  const supabase = await createClient();
  const id = Math.random().toString(36).slice(2, 10);

  const { error } = await supabase
    .from("shared_texts")
    .insert({ id, text: text.trim() });

  if (error) {
    console.error("Failed to save shared text:", error);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id 파라미터가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shared_texts")
    .select("text, createdAt")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "만료되었거나 존재하지 않는 항목입니다." },
      { status: 404 }
    );
  }

  // 1시간 TTL 체크
  const createdAtMs = new Date(data.createdAt).getTime();
  if (Date.now() - createdAtMs > 60 * 60 * 1000) {
    // 만료된 항목은 삭제
    await supabase.from("shared_texts").delete().eq("id", id);
    return NextResponse.json(
      { error: "만료되었거나 존재하지 않는 항목입니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ text: data.text });
}
