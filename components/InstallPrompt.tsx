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

  useEffect(() => {
    // PWA가 이미 설치되어 standalone 모드로 실행 중인지 감지
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

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
        설치가 완료되었습니다. 이제 클로바노트 등에서 &quot;공유&quot; 시
        Field-Master를 선택할 수 있습니다.
      </div>
    );
  }

  if (!deferredPrompt) {
    return (
      <div className="card card-muted">
        <p style={{ marginBottom: 8, fontWeight: 700 }}>
          홈화면에 추가가 필요해요
        </p>
        <p style={{ fontSize: 15, color: "var(--color-text-muted)", margin: 0 }}>
          브라우저(크롬) 오른쪽 위 메뉴(⋮) → &quot;홈 화면에 추가&quot;를
          눌러주세요. 홈화면에 추가하면 클로바노트에서 바로 &quot;공유&quot;할
          수 있습니다.
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
      📲 홈화면에 설치하기
    </button>
  );
}
