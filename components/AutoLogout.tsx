"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AutoLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 30분 타임아웃 (밀리초)
  const TIMEOUT_MS = 30 * 60 * 1000;

  const performLogout = async () => {
    try {
      sessionStorage.clear();
      await fetch("/api/auth/signout", { 
        method: "POST",
        headers: {
          "Accept": "application/json"
        }
      });
    } catch (e) {
      console.error("Auto logout failed", e);
    } finally {
      alert("보안 및 데이터 절약을 위해 장시간 활동이 없어 자동으로 로그아웃 되었습니다.");
      router.push("/login?timeout=1");
    }
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(performLogout, TIMEOUT_MS);
  };

  useEffect(() => {
    // 로그인, 랜딩 페이지 등에서는 자동 로그아웃을 비활성화
    if (!pathname || pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // 초기 타이머 시작
    resetTimer();

    // 사용자의 활동 감지 이벤트
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      // passive: true 옵션으로 스크롤 성능 저하 방지
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [pathname]);

  return null;
}
