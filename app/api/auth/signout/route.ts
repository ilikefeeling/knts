import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const redirectToParam = url.searchParams.get("redirect_to");
  
  let targetPath = "/login";
  if (redirectToParam) {
    targetPath = redirectToParam;
  } else {
    const referer = request.headers.get("referer") || "";
    if (referer.includes("/admin")) {
      targetPath = "/admin/login";
    }
  }

  // AJAX 요청인 경우 JSON 응답 반환
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true, targetPath });
  }

  return NextResponse.redirect(new URL(targetPath, request.url), {
    status: 302,
  });
}
