require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking profiles...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log(profiles);

  console.log("Checking auth.users...");
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (users && users.users) {
    users.users.forEach(u => {
      if (u.email.includes('9732')) {
        console.log("Found user in auth.users:", u.email, u.id);
      }
    });
  }
}
check();
