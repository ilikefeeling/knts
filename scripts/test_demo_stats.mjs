import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDemoStats() {
  console.log("Logging in as demo@knts.co.kr...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'demo@knts.co.kr',
    password: 'demoPassword123!',
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }

  const user = authData.user;
  console.log("Login successful! User ID:", user.id);

  console.log("\n--- Checking Task Ledger Stats ---");
  const { data: taskLedgers, error: taskError } = await supabase
    .from('task_ledger')
    .select('id, current_status')
    .eq('admin_id', user.id);

  if (taskError) {
    console.error("Task ledger error:", taskError);
  } else {
    console.log(`Found ${taskLedgers.length} task ledgers for demo admin.`);
    const statusCounts = { unassigned: 0, assigned: 0, pending: 0, completed: 0 };
    taskLedgers.forEach(t => {
      switch (t.current_status) {
        case "UNASSIGNED": statusCounts.unassigned++; break;
        case "ASSIGNED": statusCounts.assigned++; break;
        case "PENDING_ACCEPT": statusCounts.pending++; break;
        case "COMPLETED": statusCounts.completed++; break;
      }
    });
    console.log("Status counts:", statusCounts);
  }

  console.log("\n--- Checking Recent Activities (Assignment Logs) ---");
  const { data: workers, error: workersErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('admin_id', user.id)
    .eq('role', 'WORKER');
  
  const workerIds = workers?.map(w => w.id) || [];
  console.log(`Found ${workerIds.length} workers for demo admin.`);

  if (workerIds.length > 0) {
    const { data: logs, error: logsError } = await supabase
      .from('assignment_logs')
      .select('id, action_type')
      .in('worker_id', workerIds);
    
    if (logsError) {
       console.error("Logs error:", logsError);
    } else {
       console.log(`Found ${logs.length} assignment logs.`);
       if (logs.length > 0) {
          console.log(logs.slice(0, 5));
       }
    }
  } else {
    console.log("No workers found, skipping assignment logs check.");
  }

  console.log("\n--- Checking Notice Filtering ---");
  const { data: notices, error: noticeErr } = await supabase
    .from('notices')
    .select('title')
    .eq('admin_id', user.id);
    
  if (noticeErr) {
    console.error("Notices error:", noticeErr);
  } else {
    console.log(`Found ${notices.length} notices for demo admin:`, notices.map(n => n.title));
  }
}

testDemoStats();
