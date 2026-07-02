import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Checking workers...");
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "WORKER");

  if (profileErr) {
    console.error("Profile error:", profileErr);
  } else {
    console.log("Profiles:", profiles.length);
    console.log(profiles);
  }

  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) {
    console.error("User error:", userErr);
  } else {
    console.log("Users:", users.users.length);
  }
}

main();
