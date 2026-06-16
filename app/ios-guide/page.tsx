"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

function IosShortcutsMockup({ fullUrl }: { fullUrl: string }) {
  return (
    <div style={{
      width: "100%", maxWidth: "375px", margin: "32px auto",
      backgroundColor: "#f2f2f7", borderRadius: "38px", border: "10px solid #000",
      overflow: "hidden", position: "relative", height: "820px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
    }}>
      {/* 상태바 (Status Bar) */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px", fontSize: "15px", fontWeight: 600 }}>
        <span>6:09</span>
        <span style={{ letterSpacing: "1px" }}>📶 🔋</span>
      </div>

      {/* 헤더 (Header) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 16px", position: "relative" }}>
        <div style={{ position: "absolute", left: "16px", width: "32px", height: "32px", borderRadius: "16px", backgroundColor: "#e5e5ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold", color: "#000" }}>
          &lt;
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", fontSize: "17px" }}>
          <div style={{ width: "24px", height: "24px", backgroundColor: "#ff3b30", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "white", borderRadius: "2px", position: "relative" }}>
              <div style={{ position: "absolute", top: "-2px", left: 0, width: "100%", height: "4px", backgroundColor: "#ff3b30" }} />
            </div>
          </div>
          FM으로 보내기
          <div style={{ fontSize: "10px", color: "#8e8e93", backgroundColor: "#e5e5ea", borderRadius: "10px", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "2px" }}>▼</div>
        </div>
      </div>

      {/* 블록 영역 */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto", height: "calc(100% - 150px)" }}>
        
        {/* 블록 1: 클립보드 가져오기 */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "6px", backgroundColor: "#e5f0ff", color: "#007aff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📋</div>
            <span style={{ fontSize: "17px", fontWeight: 500 }}>클립보드 가져오기</span>
          </div>
          <div style={{ width: "24px", height: "24px", borderRadius: "12px", backgroundColor: "#e5e5ea", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>×</div>
        </div>

        {/* 연결 선 */}
        <div style={{ width: "2px", height: "16px", backgroundColor: "#c6c6c8" }} />

        {/* 블록 2: URL */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "6px", backgroundColor: "#e5f0ff", color: "#007aff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0, transform: "rotate(45deg)" }}>🔗</div>
              <div suppressHydrationWarning style={{ fontSize: "15px", color: "#007aff", wordBreak: "break-all", lineHeight: 1.4, marginTop: "4px" }}>
                {fullUrl}
                <span style={{ backgroundColor: "#e5f0ff", color: "#007aff", padding: "2px 8px", borderRadius: "6px", marginLeft: "4px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                  <span style={{ fontSize: "12px" }}>📋</span> 클립보드
                </span>
              </div>
            </div>
            <div style={{ width: "24px", height: "24px", borderRadius: "12px", backgroundColor: "#e5e5ea", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", flexShrink: 0, marginLeft: "8px", marginTop: "4px" }}>×</div>
          </div>
        </div>

        {/* 연결 선 */}
        <div style={{ width: "2px", height: "16px", backgroundColor: "#c6c6c8" }} />

        {/* 블록 3: URL 콘텐츠 가져오기 */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "6px", backgroundColor: "#e5ffd9", color: "#34c759", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🌐</div>
              <div style={{ fontSize: "17px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ backgroundColor: "#e5f0ff", color: "#007aff", padding: "2px 8px", borderRadius: "6px", fontSize: "15px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ transform: "rotate(45deg)", fontSize: "14px" }}>🔗</span> URL
                </span>
                콘텐츠 가져오기
              </div>
            </div>
            <div style={{ width: "24px", height: "24px", borderRadius: "12px", backgroundColor: "#e5e5ea", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>×</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "42px", marginTop: "4px" }}>
            <span style={{ color: "#007aff", fontSize: "15px" }}>자세히 보기</span>
            <div style={{ width: "20px", height: "20px", borderRadius: "10px", backgroundColor: "#e5e5ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#8e8e93" }}>&gt;</div>
          </div>
        </div>

        {/* 연결 선 */}
        <div style={{ width: "2px", height: "16px", backgroundColor: "#c6c6c8" }} />

        {/* 블록 4: 알림 보기 */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", width: "100%", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "6px", backgroundColor: "#ffe5e5", color: "#ff3b30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>💬</div>
              <div style={{ fontSize: "17px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                "✅ Field Master에 전송되었습니다" 알림 보기
              </div>
            </div>
            <div style={{ width: "24px", height: "24px", borderRadius: "12px", backgroundColor: "#e5e5ea", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>×</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "42px", marginTop: "4px" }}>
            <span style={{ color: "#007aff", fontSize: "15px" }}>자세히 보기</span>
            <div style={{ width: "20px", height: "20px", borderRadius: "10px", backgroundColor: "#e5e5ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#8e8e93" }}>&gt;</div>
          </div>
        </div>

      </div>

      {/* 하단 검색창 및 툴바 */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#f2f2f7", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", padding: "12px 16px 32px 16px" }}>
        <div style={{ width: "40px", height: "5px", backgroundColor: "#c6c6c8", borderRadius: "3px", margin: "0 auto 16px auto" }} />
        
        {/* 동작 검색창 */}
        <div style={{ backgroundColor: "#e5e5ea", borderRadius: "14px", height: "48px", display: "flex", alignItems: "center", padding: "0 14px", color: "#8e8e93", fontSize: "17px", marginBottom: "20px" }}>
          <span style={{ marginRight: "8px", fontSize: "20px", color: "#000", fontWeight: "bold" }}>🔍</span>
          <span style={{ flex: 1, color: "#3c3c43", opacity: 0.6 }}>동작 검색</span>
          <span style={{ fontSize: "20px", color: "#000" }}>🎤</span>
        </div>

        {/* 하단 아이콘 툴바 */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px", color: "#000", fontSize: "24px" }}>
          <span style={{ transform: "scaleX(-1)" }}>↪️</span>
          <span style={{ color: "#c6c6c8" }}>↪️</span>
          <span>ⓘ</span>
          <span>📤</span>
          <span>▶️</span>
        </div>
      </div>
    </div>
  );
}

function Step({ no, title, children }: { no: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "24px", borderTop: "4px solid var(--color-primary)", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ backgroundColor: "var(--color-primary)", color: "white", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", fontSize: "14px" }}>{no}</span>
        {title}
      </div>
      <div style={{ fontSize: 15, color: "var(--color-text)", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

export default function IosGuidePage() {
  const [fullUrl, setFullUrl] = useState("https://현재도메인/api/share-target?bg=1&token=유저토큰&text=");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadToken() {
      if (typeof window !== "undefined") {
        const hostUrl = window.location.origin;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setFullUrl(`${hostUrl}/api/share-target?bg=1&token=${user.id}&text=`);
        } else {
          setFullUrl(`${hostUrl}/api/share-target?bg=1&token=로그인필요&text=`);
        }
      }
    }
    loadToken();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ paddingBottom: "60px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "8px", fontSize: "28px", fontWeight: "bold", textAlign: "center" }}>아이폰 단축어 설정 안내 (v2)</h1>
      <p style={{ fontSize: 16, color: "var(--color-text-muted)", marginBottom: "32px", textAlign: "center", wordBreak: "keep-all" }}>
        클로바노트의 텍스트를 Safari를 열지 않고 <strong>백그라운드에서 조용히</strong> Field Master로 전송합니다.<br/>
        기존에 쓰던 방식과 달리 아이콘이 여러 개 생기거나 세션이 분리되는 문제를 해결했습니다.
      </p>

      <h2>📱 사전 준비</h2>
      <div className="card card-muted" style={{ marginBottom: "32px", borderRadius: "12px" }}>
        <p style={{ marginBottom: "12px", fontSize: 15 }}>시작 전에 아래 앱이 모두 설치되어 있는지 확인해 주세요.</p>
        <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: 15, lineHeight: 1.6 }}>
          <li><strong>클로바노트</strong>: 텍스트를 복사할 앱입니다.</li>
          <li><strong>단축어 (Shortcuts)</strong>: 아이폰 기본 앱입니다. (지웠다면 App Store에서 설치)</li>
          <li><strong>Field Master</strong>: 로그인까지 완료된 상태여야 합니다.</li>
        </ul>
      </div>

      <h2 style={{ borderBottom: "2px solid #eaeaea", paddingBottom: "8px", marginBottom: "20px" }}>단축어 만들기 (최초 1회만 설정)</h2>

      <Step no={1} title="단축어 앱 열기 및 추가">
        <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
          <li style={{ marginBottom: 4 }}>홈 화면에서 <strong>단축어</strong> 앱을 찾아 실행합니다.</li>
          <li>우측 상단의 <strong>[ + ] 버튼</strong>을 눌러 새로운 단축어를 만듭니다.</li>
        </ol>
      </Step>

      <Step no={2} title="동작 추가 1: 클립보드 가져오기">
        <p style={{ marginBottom: "16px" }}>
          <strong>화면 맨 아래</strong>에 있는 둥근 검색창(🔍 동작 검색)을 터치하여 <strong>"클립보드"</strong>를 검색하고, <strong>"클립보드 가져오기"</strong> 동작을 추가하세요.
        </p>
      </Step>

      <Step no={3} title="동작 추가 2: 나만의 개인 URL 구성하기">
        <p style={{ marginBottom: "16px", wordBreak: "keep-all" }}>
          다시 <strong>화면 맨 아래 검색창</strong>에서 <strong>"URL"</strong>(단어만)을 검색하여 <strong>지구본 모양 아이콘</strong>이 있는 항목을 추가합니다.
        </p>

        <div style={{ padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6", marginBottom: "16px", wordBreak: "break-all" }}>
          <strong style={{ display: "block", marginBottom: 8, color: "var(--color-primary)" }}>나의 고유 전송 주소:</strong>
          <code style={{ display: "block", padding: "8px", backgroundColor: "#e9ecef", borderRadius: "4px", marginBottom: "8px", userSelect: "all" }}>
            {fullUrl}
          </code>
          <button className="btn btn-primary" onClick={handleCopy} style={{ padding: "8px 16px", fontSize: "14px", width: "100%" }}>
            {copied ? "✅ 복사 완료!" : "주소 복사하기"}
          </button>
        </div>

        <div style={{ padding: "16px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "8px", fontSize: 14, border: "1px solid #ffeeba", marginBottom: "16px" }}>
          ⚠️ <strong>입력 플로우 따라하기</strong><br/>
          <ol style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
            <li style={{ marginBottom: "6px" }}>현재 <strong>FM 앱(가이드 화면)으로 돌아와서</strong> 위의 [주소 복사하기] 버튼을 누릅니다.</li>
            <li style={{ marginBottom: "6px" }}>다시 <strong>단축어 앱으로 돌아가서</strong> 추가된 URL 입력칸에 주소를 붙여넣습니다.</li>
            <li>주소 맨 끝에 커서를 두고, 키보드 위쪽 변수 목록에서 <strong>[클립보드]</strong>를 터치하여 변수를 삽입합니다.</li>
          </ol>
        </div>
      </Step>

      <Step no={4} title="동작 추가 3: URL 콘텐츠 가져오기">
        <ol style={{ margin: "0", paddingLeft: "1.2rem", fontSize: 15, lineHeight: 1.6 }}>
          <li style={{ marginBottom: "8px" }}>화면 맨 아래 검색창 우측에 있는 <strong>[ X ]</strong>를 터치하여 이전 검색어("URL")를 지워줍니다.</li>
          <li style={{ marginBottom: "8px" }}>새롭게 <strong>"URL 콘텐츠 가져오기"</strong>를 검색하고 선택하여 추가합니다.</li>
        </ol>
        <div style={{ padding: "12px 16px", backgroundColor: "#e3f2fd", color: "#0d47a1", borderRadius: "8px", fontSize: 14, marginTop: "12px" }}>
          💡 <strong>핵심!</strong> 이 동작이 Safari를 켜지 않고 백그라운드에서 데이터를 몰래 전송해 줍니다.
        </div>
      </Step>

      <Step no={5} title="동작 추가 4: 알림 보기 및 테스트 실행">
        <ol style={{ margin: "0", paddingLeft: "1.2rem", fontSize: 15, lineHeight: 1.6 }}>
          <li style={{ marginBottom: "8px" }}>검색창의 [ X ]를 누른 뒤 <strong>"알림"</strong>을 검색하여 <strong>"알림 보기"</strong>를 추가합니다. 문구는 "✅ 전송 성공" 등으로 적어줍니다.</li>
          <li style={{ marginBottom: "8px" }}>화면 <strong>우측 하단의 삼각형(▶️) 버튼</strong>을 터치하여 단축어가 정상적으로 실행되는지 테스트합니다.</li>
          <li style={{ marginBottom: "8px" }}>문제가 없다면 단축어 설정을 완료하고, 공유(내보내기) 버튼을 눌러 <strong>홈 화면에 추가</strong>를 선택한 뒤 이름을 <strong>"FM"</strong>으로 설정합니다.</li>
        </ol>
        
        <div style={{ textAlign: "center", marginBottom: "8px", fontSize: "18px", color: "#333", fontWeight: "bold", marginTop: 32 }}>
          ✨ 최종 완성된 단축어 아이폰 화면 예시 ✨
        </div>
        <p style={{ textAlign: "center", fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          아래 4개의 블록이 순서대로 잘 연결되어 있는지 확인하세요!
        </p>
        
        {/* 실제 아이폰 단축어 화면 모형 렌더링 */}
        <IosShortcutsMockup fullUrl={fullUrl} />
      </Step>

      <h2 style={{ borderBottom: "2px solid #eaeaea", paddingBottom: "8px", marginBottom: "20px", marginTop: "40px" }}>💡 매일 사용하는 방법</h2>
      <div className="card card-muted" style={{ marginBottom: "40px", borderRadius: "12px" }}>
        <div style={{ padding: "20px", backgroundColor: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "16px" }}>
          <div style={{ marginBottom: 16 }}><strong>1.</strong> 클로바노트에서 기록된 텍스트 전체를 <strong>[ 복사 ]</strong> 합니다.</div>
          <div style={{ textAlign: "center", color: "var(--color-primary)", marginBottom: 16, fontSize: "24px" }}>⬇</div>
          <div style={{ marginBottom: 16 }}><strong>2.</strong> 단축어를 실행합니다. (홈 화면 아이콘 클릭 또는 공유 시트에서 실행)</div>
          <div style={{ textAlign: "center", color: "var(--color-primary)", marginBottom: 16, fontSize: "24px" }}>⬇</div>
          <div style={{ marginBottom: 16 }}><strong>3.</strong> "전송되었습니다" 알림이 뜨면 성공입니다.</div>
          <div style={{ textAlign: "center", color: "var(--color-primary)", marginBottom: 16, fontSize: "24px" }}>⬇</div>
          <div><strong>4.</strong> 나중에 여유로울 때 <strong>Field Master 앱(PWA)</strong>을 열면, 미정리된 상담 내용들이 수신함(Inbox)에 쌓여 있습니다! 🚀</div>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <Link href="/" className="btn btn-primary" style={{ display: "inline-block", padding: "16px 32px", fontSize: "18px", borderRadius: "8px", fontWeight: "bold" }}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
