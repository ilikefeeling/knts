require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// 암호화 키를 위한 Node.js Crypto (클라이언트의 AES-GCM과 유사하게 단순화)
// 데모 스크립트에서는 암호화 모방 대신, 어차피 브라우저에서 복호화하므로
// 브라우저 측에서 사용하는 lib/crypto.ts 로직과 완벽히 호환되게 암호화해야 합니다.
// 하지만 Node.js 환경이므로, 단순히 암호화하지 않고 평문으로 넣은 뒤
// 프론트엔드에서 암호화를 생략할 순 없습니다.
// 가장 간단한 방법은: 데모 모드에서는 복호화 에러 시 평문을 그대로 반환하게 프론트를 살짝 고치거나,
// Node에서 Web Crypto API와 동일하게 암호화하는 것입니다.

async function encryptText(text, pin) {
  // 간단히 평문 반환 (프론트에서 try-catch로 평문 fallback하도록 수정할 예정)
  // 완벽한 AES-GCM 암호화를 Node에서 하려면 코드가 길어지므로 평문 Fallback 기법 사용
  return "DEMO_PLAIN:" + text; 
}

async function main() {
  console.log("Setting up Demo Account (demo@knts.co.kr)...");

  // 1. Create or Get User
  let { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  let demoUser = users?.find(u => u.email === 'demo@knts.co.kr');

  if (!demoUser) {
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: 'demo@knts.co.kr',
      password: 'demoPassword123!',
      email_confirm: true,
    });
    if (createError) throw createError;
    demoUser = userData.user;
    console.log("Created new demo user in auth.users");
  } else {
    // Ensure password is correct
    await supabase.auth.admin.updateUserById(demoUser.id, { password: 'demoPassword123!' });
    console.log("Updated password for existing demo user");
  }

  const adminId = demoUser.id;
  const pinHash = hashPin('159357');
  let worker1User = users?.find(u => u.email === 'worker1@knts.co.kr');
  if (!worker1User) {
    const { data: userData } = await supabase.auth.admin.createUser({ email: 'worker1@knts.co.kr', password: 'demoPassword123!', email_confirm: true });
    worker1User = userData.user;
  }
  const worker1Id = worker1User.id;

  let worker2User = users?.find(u => u.email === 'worker2@knts.co.kr');
  if (!worker2User) {
    const { data: userData } = await supabase.auth.admin.createUser({ email: 'worker2@knts.co.kr', password: 'demoPassword123!', email_confirm: true });
    worker2User = userData.user;
  }
  const worker2Id = worker2User.id;

  const profilesToUpsert = [
    {
      id: adminId,
      role: 'ADMIN',
      pin_hash: pinHash,
      status: 'ACTIVE',
      name: '데모 관리자'
    },
    {
      id: worker1Id,
      admin_id: adminId,
      role: 'WORKER',
      pin_hash: null,
      status: 'ACTIVE',
      name: '가상 보조원 A',
      phone: '010-1111-2222'
    },
    {
      id: worker2Id,
      admin_id: adminId,
      role: 'WORKER',
      pin_hash: null,
      status: 'ACTIVE',
      name: '가상 보조원 B',
      phone: '010-3333-4444'
    }
  ];

  const { error: profileError } = await supabase.from('profiles').upsert(profilesToUpsert);
  if (profileError) throw profileError;
  console.log("Upserted admin and dummy worker profiles");

  // 3. Clear existing demo data
  await supabase.from('master_ledger').delete().eq('admin_id', adminId);
  await supabase.from('visit_records').delete().eq('admin_id', adminId);
  await supabase.from('task_ledger').delete().eq('admin_id', adminId);

  // 3.5 Create a Demo Campaign
  const { data: campaignData, error: campError } = await supabase.from('campaigns').insert({
    admin_id: adminId,
    name: '1초 체험 가상 원장',
    description: '모든 기능을 체험할 수 있는 가상의 작업 원장입니다.',
    status: 'ACTIVE'
  }).select().single();
  if (campError) throw campError;
  const campaignId = campaignData.id;

  // 4. Seed Dummy Targets
  console.log("Seeding dummy targets...");
  const dummyTargets = [
    { name: "홍길동", address: "서울시 강남구 테헤란로 123", detail_address: "101동 202호", phone: "010-1234-5678" },
    { name: "김철수", address: "서울시 서초구 서초대로 456", detail_address: "2층 상가", phone: "010-9876-5432" },
    { name: "이영희", address: "서울시 송파구 올림픽로 789", detail_address: "305호", phone: "010-5555-4444" },
    { name: "박지민", address: "서울시 강동구 천호대로 321", detail_address: "빌라 401호", phone: "010-1111-2222" },
    { name: "최동석", address: "경기도 성남시 분당구 판교역로", detail_address: "오피스텔 708호", phone: "010-7777-8888" }
  ];

  const masterRows = dummyTargets.map(t => ({
    admin_id: adminId,
    name: "DEMO_PLAIN:" + t.name,
    address: "DEMO_PLAIN:" + t.address,
    detail_address: "DEMO_PLAIN:" + t.detail_address,
    phone: "DEMO_PLAIN:" + t.phone,
  }));

  const { data: insertedMaster, error: insertError } = await supabase.from('master_ledger').insert(masterRows).select();
  if (insertError) throw insertError;

  // Create Task Ledgers
  const taskRows = insertedMaster.map(m => ({
    campaign_id: campaignId,
    master_id: m.id,
    admin_id: adminId,
    assigned_worker_id: adminId, // Assign to self for demo
    current_status: "ASSIGNED"
  }));
  const { data: insertedTasks, error: taskError } = await supabase.from('task_ledger').insert(taskRows).select();
  if (taskError) throw taskError;

  // 5. Create some dummy visits
  if (insertedTasks && insertedTasks.length > 0) {
    console.log("Seeding dummy visits...");
    const visitRows = [
      {
        admin_id: adminId,
        target_id: insertedTasks[0].id,
        worker_id: adminId,
        photo_url: "https://via.placeholder.com/400x300.png?text=Demo+Photo+1",
        transcribed_text: "현장 방문 시 부재중이어서 우편함에 안내문 투입함.",
        summary_text: "부재중, 안내문 투입",
        sentiment: "부정적"
      },
      {
        admin_id: adminId,
        target_id: insertedTasks[2].id,
        worker_id: adminId,
        photo_url: "https://via.placeholder.com/400x300.png?text=Demo+Photo+2",
        transcribed_text: "본인과 통화 완료. 다음 주 금요일까지 절반을 우선 납부하기로 구두 협의함.",
        summary_text: "분납 약속 (다음 주 금요일)",
        sentiment: "긍정적"
      }
    ];
    await supabase.from('visit_records').insert(visitRows);
    
    // Update status for the ones with visits
    await supabase.from('task_ledger').update({ current_status: 'COMPLETED' }).eq('id', insertedTasks[0].id);
    await supabase.from('task_ledger').update({ current_status: 'COMPLETED' }).eq('id', insertedTasks[2].id);
  }

  console.log("✅ Demo account setup complete!");
}

main().catch(console.error);
