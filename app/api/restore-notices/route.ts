import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, message: 'Missing env vars' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
    if (userErr || !users || users.users.length === 0) {
      return NextResponse.json({ success: false, message: 'No users found' });
    }
    
    const admin = users.users.find(u => u.email?.includes('admin')) || users.users[0];
    
    const noticesToInsert = [
      { admin_id: admin.id, title: '📢 현장조사 관리 시스템 그랜드 오픈 (V2)', content: '안녕하세요! Field-Master 현장조사 관리 대시보드 V2 시스템이 정식 오픈되었습니다. 이제부터 보조원들에게 실시간으로 명단을 배정하고 결과를 확인할 수 있습니다.', is_important: true },
      { admin_id: admin.id, title: '[필독] 실태 조사 시 주의사항', content: '현장 방문 시 반드시 마스크를 착용해 주시고, 대상자와 마찰이 발생하지 않도록 주의 바랍니다. 특이사항 발생 시 즉시 시스템에 사진과 함께 보고해 주시기 바랍니다.', is_important: true },
      { admin_id: admin.id, title: '시스템 정기 점검 안내 (예정)', content: '이번 주 금요일 밤 12시부터 새벽 2시까지 시스템 정기 점검이 있을 예정입니다. 이 시간에는 앱 접속 및 결과 보고가 제한될 수 있으니 미리 보고를 완료해 주세요.', is_important: false }
    ];

    const { data, error } = await supabase.from('notices').insert(noticesToInsert).select();
    
    if (error) {
      return NextResponse.json({ success: false, message: error.message });
    }
    
    return NextResponse.json({ success: true, count: data.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}
