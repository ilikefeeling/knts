import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // `profiles` 테이블에서 유저 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phone, role')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ 
      user: {
        id: user.id,
        name: profile?.name || '',
        phone: profile?.phone || '',
        role: profile?.role || 'worker'
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
