"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // 모바일을 기본값으로(SSR/하이드레이션 직후 깜빡임 방지)

  useEffect(() => {
    // PWA가 이미 설치되어 standalone 모드로 실행 중인지 감지
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // 모바일 여부 판단 (Android/iOS UA 기준)
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  // 이미 설치되어 standalone으로 실행 중이면 배너 자체를 숨김
  if (isStandalone) {
    return null;
  }

  if (installed) {
    return (
      <div className="card" style={{ background: "var(--color-success-bg)", color: "var(--color-success)", border: "none" }}>
        설치가 완료되었습니다.{" "}
        {isMobile
          ? "이제 클로바노트 등에서 \"공유\" 시 Field-Master를 선택할 수 있습니다."
          : "PC에서는 원장/명단 관리 화면을 더 넓고 편하게 사용할 수 있습니다. (클로바노트 공유 기능은 휴대폰에서만 동작합니다)"}
      </div>
    );
  }

  if (!deferredPrompt) {
    if (isMobile) {
      return (
        <div className="card card-muted">
          <p style={{ marginBottom: 8, fontWeight: 700 }}>
            휴대폰 홈화면에 추가가 필요해요
          </p>
          <p style={{ fontSize: 15, color: "var(--color-text-muted)", margin: 0 }}>
            휴대폰의 브라우저(크롬) 오른쪽 위 메뉴(⋮) → &quot;홈 화면에
            추가&quot;를 눌러주세요. 홈화면에 추가하면 클로바노트에서 바로
            &quot;공유&quot;할 수 있습니다.
          </p>
        </div>
      );
    }

    return (
      <div className="card card-muted">
        <p style={{ marginBottom: 8, fontWeight: 700 }}>
          PC에서 보고 계시네요
        </p>
        <p style={{ fontSize: 15, color: "var(--color-text-muted)", margin: "0 0 8px" }}>
          크롬 주소창 오른쪽의 설치 아이콘(⊕) 또는 오른쪽 위 메뉴(⋮) →
          &quot;Field-Master 설치&quot;로 PC에도 설치할 수 있습니다.
        </p>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", margin: 0 }}>
          ⚠️ 단, 클로바노트 &quot;공유&quot;로 현장기록을 보내는 기능은{" "}
          <strong>휴대폰</strong>에서만 동작합니다. 현장기록 입력은
          휴대폰으로, 명단 업로드·원장 관리·문자 발송은 PC에서도 동일하게
          사용하실 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <button
      className="btn btn-primary"
      onClick={async () => {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      }}
    >
      {isMobile ? "📲 휴대폰 홈화면에 설치하기" : "💻 PC에 설치하기"}
    </button>
  );
}
