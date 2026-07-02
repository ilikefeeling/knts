import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

export async function POST() {
  const supabase = await createClient();

  // We sign in with the predefined demo account credentials
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@knts.co.kr',
    password: 'demoPassword123!',
  });

  if (error) {
    console.error('Demo login error:', error);
    if (error.message.includes('Invalid login credentials')) {
      return NextResponse.json({ error: 'Demo account not initialized. Please run setup-demo.js' }, { status: 500 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // --- 추가된 기능: 누구나 언제든 [1초 체험하기]를 눌러도 최신 상태의 데모를 경험할 수 있도록 데이터를 완전히 초기화합니다. ---
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (supabaseUrl && supabaseServiceKey) {
      const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey);
      const adminId = data.user.id;
      const pinHash = hashPin('159357');
      // 1. PIN 초기화 (1초 체험하기는 바로 대시보드를 봐야 하므로 임시 PIN 발급)
      await adminSupabase.from('profiles').update({ pin_hash: pinHash }).eq('id', adminId);

      // Get all worker IDs for this admin
      const { data: workers } = await adminSupabase.from('profiles').select('id').eq('admin_id', adminId).eq('role', 'WORKER');
      const workerIds = workers?.map(w => w.id) || [];

      const deleteHelper = async (query: any, name: string) => {
        try {
          const { error } = await query;
          if (error) {
             console.warn(`[Demo Reset] Skipped ${name} deletion: ${error.message} (Code: ${error.code})`);
          }
        } catch (e) {
          console.warn(`[Demo Reset] Exception on ${name} deletion:`, e);
        }
      }

      // 2. 기존 데이터 삭제 (타겟, 방문기록, 공지사항 등 모두 싹쓸이)
      await deleteHelper(adminSupabase.from('assignment_logs').delete().eq('admin_id', adminId), 'assignment_logs');
      await deleteHelper(adminSupabase.from('pin_audit_logs').delete().neq('event_type', 'NONE'), 'pin_audit_logs');
      await deleteHelper(adminSupabase.from('notices').delete().eq('admin_id', adminId), 'notices');
      
      const allUserIds = [adminId, ...workerIds];
      if (allUserIds.length > 0) {
          await deleteHelper(adminSupabase.from('shared_texts').delete().in('user_id', allUserIds), 'shared_texts');
      }

      if (workerIds.length > 0) {
          await deleteHelper(adminSupabase.from('visit_records').delete().in('worker_id', workerIds), 'visit_records');
          await deleteHelper(adminSupabase.from('target_ledger').delete().in('assigned_worker_id', workerIds), 'target_ledger');
      }
      
      await deleteHelper(adminSupabase.from('task_ledger').delete().eq('admin_id', adminId), 'task_ledger');
      await deleteHelper(adminSupabase.from('master_ledger').delete().eq('admin_id', adminId), 'master_ledger');
      await deleteHelper(adminSupabase.from('campaigns').delete().eq('admin_id', adminId), 'campaigns');

      // 3. 완벽한 백지상태를 위한 보조원 100% 삭제
      if (workers && workers.length > 0) {
        for (const w of workers) {
          await deleteHelper(adminSupabase.from('profiles').delete().eq('id', w.id), 'profiles');
          try {
            const { error: authError } = await adminSupabase.auth.admin.deleteUser(w.id);
            if (authError) console.warn(`[Demo Reset] Skipped auth delete for ${w.id}: ${authError.message}`);
          } catch (e) {
            console.warn(`[Demo Reset] Exception on auth delete for ${w.id}:`, e);
          }
        }
      }

      // 4. 캠페인 및 타겟 데이터 생성 삭제 (대표님 요청에 따라 타겟 0건의 완벽한 백지상태로 만듭니다)
      // - 이제 1초 체험하기는 기존 데이터를 청소하는 '완벽한 초기화(Reset)' 버튼의 역할을 합니다.

      // 5. 샘플 공지사항 및 기본 PIN 로그 추가
      await adminSupabase.from('notices').insert({
        admin_id: adminId,
        title: '🎉 1초 체험 (데모) 환경에 오신 것을 환영합니다!',
        content: '이곳은 가상의 작업 원장과 데이터로 구성된 데모 환경입니다.\n\n[체험 가이드]\n1. 보조원을 배정하고 현장 방문을 지시해보세요.\n2. 보조원의 위치와 상태를 실시간으로 모니터링해보세요.\n3. 긴급 푸시 알림과 단체 문자를 발송해보세요.\n\n본 시스템의 모든 데이터는 초기화 버튼 클릭 시 즉시 원상 복구됩니다. 자유롭게 모든 기능을 테스트해보세요!',
        is_important: true
      });

      // await adminSupabase.from('pin_audit_logs').insert({
      //   event_type: 'PIN_CREATED',
      //   description: '데모 환경 초기화 완료 (PIN 관리 이력 리셋)',
      //   is_distributed: false
      // });

    }
  } catch (err: any) {
    console.error("Demo reset error:", err);
    try {
      require('fs').writeFileSync('d:\\c-바탕화면\\knts\\demo_error.log', err.stack || err.toString());
    } catch(e) {}
    return NextResponse.json({ error: 'Failed to initialize demo data', details: err.toString() }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data.user });
}
