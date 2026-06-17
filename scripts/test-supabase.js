const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjvvzdfwboonmdonqpqt.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdnZ6ZGZ3Ym9vbm1kb25xcHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDIzOTAsImV4cCI6MjA5Njg3ODM5MH0.GmOvhCsFjyYwgesmxoAYActzxQIGZxfHqMtbO42XIJo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';

  console.log('Signing up user:', email);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Sign up failed:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log('Signed up! User ID:', userId);

  const id = 'test_' + Date.now();
  console.log('Inserting row with id:', id);
  const { data: insertData, error: insertError } = await supabase
    .from('shared_texts')
    .insert({ id, text: 'Hello RLS', user_id: userId })
    .select()
    .single();

  if (insertError) {
    console.error('Insert failed:', insertError);
  } else {
    console.log('Insert succeeded! Data:', insertData);
  }

  console.log('Selecting row with id:', id);
  const { data: selectData, error: selectError } = await supabase
    .from('shared_texts')
    .select('*')
    .eq('id', id)
    .single();

  if (selectError) {
    console.error('Select failed:', selectError);
  } else {
    console.log('Select succeeded! Data:', selectData);
  }
}

run().catch(console.error);
