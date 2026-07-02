import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore in Server Component
            }
          },
        },
      }
    )
    
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && sessionData.user) {
      const user = sessionData.user;
      
      // 개발 및 테스트 편의를 위해 로그인하는 모든 사용자에게 임시 ADMIN 권한 부여
      let finalRedirect = next === '/' ? '/admin' : next; // 기본적으로 관리자 대시보드로 이동
      
      const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (!existingProfile || existingProfile.role !== 'ADMIN') {
        // 무료 체험용 ADMIN 프로필 생성
        await supabase.from('profiles').upsert({
          id: user.id,
          role: 'ADMIN',
          status: 'ACTIVE',
          phone: '000-0000-0000',
          name: '무료체험 관리자'
        });
        
        // 10일짜리 라이선스 발급
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 10);
        
        await supabase.from('admin_licenses').upsert({
          admin_id: user.id,
          total_slots: 3,
          valid_until: validUntil.toISOString()
        });
        
        finalRedirect = '/admin';
      } else if (existingProfile.role === 'ADMIN') {
        finalRedirect = '/admin';
      }

      return NextResponse.redirect(`${origin}${finalRedirect}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
