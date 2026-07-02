const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mjvvzdfwboonmdonqpqt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdnZ6ZGZ3Ym9vbm1kb25xcHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDIzOTAsImV4cCI6MjA5Njg3ODM5MH0.GmOvhCsFjyYwgesmxoAYActzxQIGZxfHqMtbO42XIJo'
);

async function test() {
  const { data, error } = await supabase.from('target_ledger').insert({
    name: 'test',
    phone: '010-0000-0000',
    address: 'test',
    detail_address: 'test',
    current_status: 'UNASSIGNED'
  });
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
