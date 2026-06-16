"use client";

import { useEffect, useState } from "react";

export default function InAppBrowserGuard() {
  const [isInApp, setIsInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 이미 홈 화면에 추가되어 PWA 모드로 실행 중인 경우 체크 스킵
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ua = navigator.userAgent.toLowerCase();
    
    // 대표적인 인앱 브라우저 키워드 목록
    const inAppRegex = /kakaotalk|naver|line|instagram|fban|fbav|daum|twitter|snapchat/i;
    const isKakao = /kakaotalk/i.test(ua);
    const isAndroid = /android/i.test(ua);

    if (inAppRegex.test(ua)) {
      setIsInApp(true);
      const targetUrl = window.location.href;

      if (isKakao) {
        // 카카오톡 전용 스킴으로 외부 브라우저 호출
        window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
      } else if (isAndroid) {
        // 안드로이드 크롬 인텐트 스킴으로 외부 브라우저 호출
        const urlWithoutProtocol = targetUrl.replace(/^https?:\/\//, "");
        window.location.href = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end;`;
      }
      // iOS에서 카카오톡이 아닌 경우 (네이버, 인스타그램 등)는 자동 스킴 호출이 보통 막혀있으므로
      // 상태를 isInApp = true로 유지하여 아래의 차단 UI를 보여줍니다.
    }
  }, []);

  if (!isInApp) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 클립보드 API가 지원되지 않는 구형 브라우저 대응
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "#ffffff",
      zIndex: 999999, // 다른 모든 UI보다 최상단
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ fontSize: "64px", marginBottom: "24px" }}>🚫</div>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px", color: "#333", wordBreak: "keep-all" }}>
        현재 화면에서는<br/>로그인이 불가능합니다
      </h2>
      
      <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "12px", marginBottom: "32px", width: "100%", maxWidth: "340px" }}>
        <p style={{ fontSize: "15px", color: "#555", margin: 0, lineHeight: 1.5, wordBreak: "keep-all" }}>
          카카오톡, 네이버 등 외부 앱 내부 화면에서는 보안상의 이유로 <strong>카카오 로그인</strong> 및 <strong>홈 화면 추가</strong>가 차단됩니다.
        </p>
      </div>

      <p style={{ fontSize: "16px", color: "#000", fontWeight: "bold", marginBottom: "16px", wordBreak: "keep-all" }}>
        👇 아래 버튼을 눌러 주소를 복사한 뒤,<br/>
        <span style={{ color: "#007aff" }}>Safari</span> 또는 <span style={{ color: "#34c759" }}>Chrome</span>에서 열어주세요!
      </p>

      <button 
        onClick={handleCopy}
        style={{
          width: "100%",
          maxWidth: "320px",
          padding: "16px",
          backgroundColor: copied ? "#34c759" : "#007aff",
          color: "#fff",
          fontSize: "18px",
          fontWeight: "bold",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          marginBottom: "16px",
          transition: "background-color 0.2s"
        }}
      >
        {copied ? "✅ 앱 주소 복사 완료!" : "🔗 앱 주소 복사하기"}
      </button>

      <p style={{ fontSize: "14px", color: "#8e8e93", marginTop: "16px", lineHeight: 1.5 }}>
        복사 후 바탕화면으로 나가서<br/>Safari나 Chrome 앱을 켜고 주소창에 붙여넣기 하세요.
      </p>
    </div>
  );
}
