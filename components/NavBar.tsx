"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { hasUnreadNotices } from "@/lib/noticeDb";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // 관리자 페이지나 로그인 페이지에서는 알림 확인 안 함
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) return;
    
    hasUnreadNotices()
      .then(setHasUnread)
      .catch(console.error);
  }, [pathname]);

  const getPageTitle = (path: string | null) => {
    if (!path || path === "/") return "Field-Master";
    if (path.startsWith("/ios-guide")) return "iOS 안내";
    if (path.startsWith("/ledger")) return "방문 관리";
    if (path.startsWith("/guide")) return "사용 가이드";
    if (path.startsWith("/login")) return "로그인";
    if (path.startsWith("/notices")) return "공지사항";
    if (path.startsWith("/mypage")) return "비밀번호 수정";
    if (path.startsWith("/settings")) return "설정";
    if (path.startsWith("/share-receiver")) return "데이터 공유";
    if (path.startsWith("/admin")) return "관리자";
    if (path.startsWith("/start")) return "시작하기";
    if (path.startsWith("/worker")) return "현장 방문록";
    if (path.startsWith("/signup")) return "회원가입";
    return "Field-Master";
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {!isHome ? (
          <button className="nav-back" onClick={() => router.back()}>
            ← 뒤로
          </button>
        ) : (
          <span className="nav-logo">FM</span>
        )}
      </div>
      <div className="navbar-center">
        {getPageTitle(pathname)}
      </div>
      <div className="navbar-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <a href="/notices" className="nav-icon" style={{ position: 'relative', fontSize: '20px', textDecoration: 'none' }}>
          🔔
          {hasUnread && (
            <span style={{
              position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px',
              backgroundColor: '#ef4444', borderRadius: '50%'
            }} />
          )}
        </a>
        <a href="/settings" className="nav-icon" style={{ fontSize: '20px', textDecoration: 'none' }}>
          ⚙️
        </a>
        {!isHome && (
          <a className="nav-home" href="/" style={{ fontSize: '20px', textDecoration: 'none' }}>
            🏠
          </a>
        )}
      </div>
    </nav>
  );
}
