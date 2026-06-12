import { NextRequest, NextResponse } from "next/server";
import { saveShareText } from "@/lib/shareStore";

// 안드로이드 PWA Share Target (manifest.json의 share_target.action)
// 클로바노트/삼성 녹음 등에서 "공유" 선택 시 이 엔드포인트로 POST 요청이 들어옴.
export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const text = (formData.get("text") as string) || "";
  const title = (formData.get("title") as string) || "";
  const url = (formData.get("url") as string) || "";

  // 일부 앱은 본문을 title 또는 url 필드에 담아 보낼 수 있어 폴백 처리
  const sharedText = [text, title, url].filter(Boolean).join("\n").trim();

  if (!sharedText) {
    return NextResponse.redirect(
      new URL("/share-receiver?error=empty", req.url),
      303
    );
  }

  const id = saveShareText(sharedText);

  // 공유 후 사용자에게 보여줄 화면으로 리다이렉트 (303: POST -> GET)
  return NextResponse.redirect(
    new URL(`/share-receiver?id=${id}`, req.url),
    303
  );
}
