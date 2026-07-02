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
  const { data: { user } } = await supabase.auth.getUser();

  const id = Math.random().toString(36).slice(2, 10);

  const insertData: any = { id, text: text.trim() };
  if (user) {
    insertData.user_id = user.id;
  }
  
  console.log(`[POST /api/share] Inserting ${id} with user_id: ${user?.id || 'null'}`);

  const { error } = await supabase
    .from("shared_texts")
    .insert(insertData);

  if (error) {
    console.error("Failed to save shared text:", error);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }

  // DEBUG: Immediate SELECT to check RLS visibility
  const { data: testSelect, error: testSelectError } = await supabase
    .from("shared_texts")
    .select("*")
    .eq("id", id)
    .single();
    
  console.log(`[POST /api/share] Immediate SELECT after insert for ${id}:`, { testSelect, testSelectError });

  console.log(`[POST /api/share] Successfully inserted ${id}`);
  return NextResponse.json({ id });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id 파라미터가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  
  // Force token resolution/refresh before querying the database
  const { data: authData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("shared_texts")
    .select("id, text, createdAt")
    .eq("id", id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("GET /api/share DB Error:", error);
    return NextResponse.json({ error: "데이터베이스 조회 오류가 발생했습니다." }, { status: 500 });
  }

  if (!data) {
    console.error(`GET /api/share 404 Debug - id: ${id}, user_id: ${authData.user?.id}, error:`, error);
    return NextResponse.json(
      { error: "만료되었거나 존재하지 않는 항목입니다.", debug: { id, userId: authData.user?.id, dbError: error } },
      { status: 404 }
    );
  }

  // 사용자 기획에 따라 시간 경과에 따른 자동 만료/삭제(TTL) 로직을 제거했습니다.
  // 사용자가 명시적으로 정리를 완료하거나 직접 삭제하기 전까지는 항상 보존됩니다.
  
  return NextResponse.json({
    id: data.id,
    text: data.text,
    createdAt: data.createdAt,
  });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id 파라미터가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 삭제 요청 시 본인의 텍스트이거나 user_id가 없는 텍스트만 삭제 가능
  // (supabase_schema의 RLS 정책이 적용되지만, 명시적으로 필터 적용)
  const { error } = await supabase
    .from("shared_texts")
    .delete()
    .eq("id", id)
    .or(`user_id.eq.${user.id},user_id.is.null`);

  if (error) {
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
