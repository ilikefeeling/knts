import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31m❌ Supabase environment variables missing.\x1b[0m');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

async function verifyDatabase() {
  console.log(`${YELLOW}Running Database Integrity Checks...${RESET}`);
  let hasError = false;

  try {
    // 1. Check connection
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error(`${RED}❌ Failed to connect to Supabase: ${error.message}${RESET}`);
      hasError = true;
    } else {
      console.log(`   ${GREEN}✓ Supabase connection successful.${RESET}`);
    }

    // 2. Check pin_audit_logs for invalid event_types
    const { data: pinLogs, error: pinError } = await supabase.from('pin_audit_logs').select('event_type');
    if (pinError) {
      console.error(`${RED}❌ Failed to query pin_audit_logs: ${pinError.message}${RESET}`);
      hasError = true;
    } else if (pinLogs) {
      const invalidLogs = pinLogs.filter(log => !log.event_type || log.event_type.trim() === '');
      if (invalidLogs.length > 0) {
        console.error(`${RED}❌ Found ${invalidLogs.length} pin_audit_logs with empty/null event_type.${RESET}`);
        hasError = true;
      } else {
        console.log(`   ${GREEN}✓ pin_audit_logs data integrity intact (Checked ${pinLogs.length} logs).${RESET}`);
      }
    }

  } catch (err) {
    console.error(`${RED}❌ Unexpected error during DB verification:${RESET}`, err);
    hasError = true;
  }

  if (hasError) {
    console.error(`${RED}Database Verification Failed.${RESET}`);
    process.exit(1);
  } else {
    console.log(`${GREEN}✅ Database Verification Passed!${RESET}`);
  }
}

verifyDatabase();
