import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("guide_completed_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ completed: false });
  }

  return NextResponse.json({ completed: !!data.guide_completed_at });
}
