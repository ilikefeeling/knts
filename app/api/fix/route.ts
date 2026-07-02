import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("target_ledger")
    .update({ current_status: "UNASSIGNED" })
    .eq("current_status", "PENDING");
  
  return NextResponse.json({ data, error });
}
