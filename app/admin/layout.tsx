import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  // /admin/login 페이지는 레이아웃의 인증 체크 및 [관] 뱃지 예외 처리
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxWidth: "500px" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "15px", color: "#ef4444" }}>접근 권한이 없습니다</h2>
          <p style={{ color: "#475569", marginBottom: "10px", lineHeight: "1.5" }}>
            현재 <b>실태확인원(WORKER)</b> 계정으로 로그인되어 있어<br/>
            관리자 대시보드에 접근할 수 없습니다.
          </p>
          <p style={{ color: "#475569", marginBottom: "30px", fontSize: "14px", lineHeight: "1.5" }}>
            * 목록에 본인 이름만 나오는 것은 데이터베이스 보안 정책(RLS)이<br/>
            정상적으로 작동하여 타인의 정보를 차단하고 있기 때문입니다.
          </p>
          
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <form action="/api/auth/signout" method="post">
              <button type="submit" style={{ padding: "12px 24px", background: "#0f172a", color: "white", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>
                로그아웃 후 관리자로 로그인
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isDemoUser = user.email === 'demo@knts.co.kr';

  return (
    <>
      {isDemoUser && (
        <div style={{ background: '#3b82f6', color: 'white', padding: '12px 20px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', zIndex: 9999, position: 'sticky', top: 0 }}>
          🚀 [체험 모드] 가상의 데이터로 기능을 테스트 중입니다. 실제 업무에 적용하시려면 
          <a href="https://www.caretrend.co.kr" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline', marginLeft: '8px', background: '#2563eb', padding: '4px 12px', borderRadius: '4px' }}>정식 시작하기(무료)</a>
        </div>
      )}
      {/* 개발/사용자 혼선 방지용 [관리자] 뱃지 */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", background: "#ef4444", color: "white", padding: "8px 12px", borderRadius: "99px", fontWeight: "bold", fontSize: "14px", zIndex: 9999, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", pointerEvents: "none" }}>
        [관] 관리자
      </div>
      {children}
    </>
  );
}
