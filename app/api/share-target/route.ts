import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// 안드로이드 PWA Share Target (manifest.json의 share_target.action)
// 클로바노트/삼성 녹음 등에서 "공유" 선택 시 이 엔드포인트로 POST 요청이 들어옴.
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const text = (formData.get("text") as string) || "";
  const title = (formData.get("title") as string) || "";
  const url = (formData.get("url") as string) || "";

  // 일부 앱은 본문을 title 또는 url 필드에 담아 보낼 수 있어 폴백 처리
  const sharedText = [text, title, url].filter(Boolean).join("\n").trim();

  return await processSharedText(sharedText, req);
}

// iOS 단축어 등에서 웹 URL로 직접 접근하여 데이터를 넘길 때 사용 (GET 방식)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  
  const text = searchParams.get("text") || "";
  const title = searchParams.get("title") || "";
  const url = searchParams.get("url") || "";

  const sharedText = [text, title, url].filter(Boolean).join("\n").trim();

  return await processSharedText(sharedText, req);
}

// 공통 처리 로직
async function processSharedText(sharedText: string, req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const isBackground = searchParams.get("bg") === "1";
  const token = searchParams.get("token") || "";

  if (!sharedText) {
    if (isBackground) {
      return NextResponse.json({ error: "empty_text" }, { status: 400 });
    }
    return NextResponse.redirect(
      new URL("/share-receiver?error=empty", req.url),
      303
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = Math.random().toString(36).slice(2, 10);

  const insertData: any = { id, text: sharedText, status: 'pending' };
  if (user) {
    insertData.user_id = user.id;
  } else if (token) {
    insertData.user_id = token;
  }

  const { error } = await supabase
    .from("shared_texts")
    .insert(insertData);

  if (error) {
    console.error("Failed to save shared text:", error);
    if (isBackground) {
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
    return NextResponse.redirect(
      new URL("/share-receiver?error=save_failed", req.url),
      303
    );
  }

  // 백그라운드 전송이면 JSON 응답만 반환
  if (isBackground) {
    return NextResponse.json({ success: true, id });
  }

  // 공유 후 바로 처리 화면으로 리다이렉트 (안드로이드/기존 iOS 방식)
  return NextResponse.redirect(
    new URL(`/share-receiver?id=${id}`, req.url),
    303
  );
}

