import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get all task_ledgers for this admin (all campaigns, all workers)
    const { data: ledgers } = await supabase
      .from("task_ledger")
      .select("id")
      .eq("admin_id", user.id);

    if (ledgers && ledgers.length > 0) {
      const ledgerIds = ledgers.map(l => l.id);

      // 2. Find any reports linked to these ledgers
      const { data: reports } = await supabase
        .from("task_reports")
        .select("id")
        .in("ledger_id", ledgerIds);

      if (reports && reports.length > 0) {
        const reportIds = reports.map(r => r.id);

        // 3. Find any photos linked to these reports
        const { data: photos } = await supabase
          .from("report_photos")
          .select("photo_url")
          .in("report_id", reportIds);

        // 4. Delete photos from Supabase Storage
        if (photos && photos.length > 0) {
          const photoPaths = photos
            .map(p => {
              try {
                const url = new URL(p.photo_url);
                const pathParts = url.pathname.split("/reports/");
                if (pathParts.length > 1) {
                  return pathParts[1];
                }
              } catch (e) {}
              return null;
            })
            .filter(Boolean) as string[];

          if (photoPaths.length > 0) {
            await supabase.storage.from("reports").remove(photoPaths);
          }
        }

        // 5. Delete photos from DB
        await supabase
          .from("report_photos")
          .delete()
          .in("report_id", reportIds);

        // 6. Delete reports from DB
        await supabase
          .from("task_reports")
          .delete()
          .in("ledger_id", ledgerIds);
      }
      
      // 6.5 Delete visit_records
      await supabase
        .from("visit_records")
        .delete()
        .in("ledger_id", ledgerIds);

      // 7. Reset task_ledgers back to ASSIGNED
      // Also reset collected amounts and dates
      await supabase
        .from("task_ledger")
        .update({ 
          current_status: "ASSIGNED", 
          visit_date: null, 
          visit_time: null, 
          amount_collected: 0, 
          payment_method: null 
        })
        .in("id", ledgerIds);
    }

    // 8. Reset guide_completed_at for ALL profiles (admin and all workers)
    // We can now filter by admin_id on profiles since we added it!
    await supabase
      .from("profiles")
      .update({ guide_completed_at: null })
      .eq("role", "WORKER")
      .eq("admin_id", user.id);

    await supabase
      .from("profiles")
      .update({ guide_completed_at: null, pin_hash: null })
      .eq("id", user.id);

    // 9. Delete PIN audit logs using service role (bypassing RLS)
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await adminSupabase
      .from("pin_audit_logs")
      .delete()
      .not("id", "is", null);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reset Test Data Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
