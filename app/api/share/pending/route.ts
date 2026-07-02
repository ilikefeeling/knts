import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ pending: [] });
    }

    const { data, error } = await supabase
      .from("shared_texts")
      .select("id, text, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      // shared_texts 테이블이 미존재하거나 컬럼 에러 등 모든 DB 에러 시 빈 배열 반환
      console.warn("[/api/share/pending] DB error (graceful fallback):", error.message);
      return NextResponse.json({ pending: [] });
    }

    return NextResponse.json({ pending: data || [] });
  } catch (error: any) {
    console.warn("[/api/share/pending] Unexpected error (graceful fallback):", error.message);
    return NextResponse.json({ pending: [] });
  }
}
