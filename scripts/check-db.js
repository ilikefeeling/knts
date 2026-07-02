const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: workers } = await supabase.from('profiles').select('*').eq('role', 'WORKER');
  console.log("WORKERS:", workers);

  const { data: ledgers } = await supabase.from('task_ledger').select('*');
  console.log("LEDGERS:", ledgers);
}

check();
