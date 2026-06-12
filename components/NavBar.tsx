"use client";

import { usePathname, useRouter } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {!isHome ? (
          <button className="nav-back" onClick={() => router.back()}>
            ← 돌아가기
          </button>
        ) : (
          <span className="nav-logo">FM</span>
        )}
      </div>
      <div className="navbar-center">
        {isHome
          ? "Field-Master"
          : pathname === "/ios-guide"
            ? "iOS 안내"
            : pathname === "/ledger"
              ? "방문 관리"
              : pathname === "/pricing"
                ? "요금제"
                : pathname === "/guide"
                  ? "사용 가이드"
                  : "상담 기록"}
      </div>
      <div className="navbar-right">
        {!isHome && (
          <a className="nav-home" href="/">
            🏠
          </a>
        )}
      </div>
    </nav>
  );
}
