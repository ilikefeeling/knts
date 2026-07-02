const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mjvvzdfwboonmdonqpqt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdnZ6ZGZ3Ym9vbm1kb25xcHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDIzOTAsImV4cCI6MjA5Njg3ODM5MH0.GmOvhCsFjyYwgesmxoAYActzxQIGZxfHqMtbO42XIJo'
);

async function test() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@knts.local',
    password: 'admin1234'
  });
  
  if (signInError) {
    console.error('Signin error:', signInError);
    return;
  }
  
  console.log('Logged in as:', signInData.user.id);
  
  const { data, error } = await supabase
    .from('target_ledger')
    .insert([
      {
        admin_id: signInData.user.id,
        name: 'A'.repeat(500),
        phone: 'B'.repeat(500),
        address: 'C'.repeat(500),
        detail_address: 'D'.repeat(500)
      }
    ]);

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success:', data);
  }
}

test();
