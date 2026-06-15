import Link from "next/link";

function Step({ no, title, children }: { no: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "16px" }}>
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: "var(--color-primary)" }}>
        STEP {no} — {title}
      </div>
      <div style={{ fontSize: 15, color: "var(--color-text)", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

export default function IosGuidePage() {
  return (
    <div style={{ paddingBottom: "40px" }}>
      <h1 style={{ marginBottom: "8px" }}>아이폰 단축어 설정</h1>
      <p style={{ fontSize: 15, color: "var(--color-text-muted)", marginBottom: "24px" }}>
        Field-Master 연결 기능을 단계별 설명드립니다.
      </p>

      <h2>📱 사전 준비 확인</h2>
      <div className="card card-muted" style={{ marginBottom: "24px" }}>
        <p style={{ marginBottom: "12px", fontSize: 15 }}>시작 전에 아래 앱이 설치되어 있는지 확인하세요.</p>
        <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: 15, lineHeight: 1.6 }}>
          <li><strong>클로바노트:</strong> App Store에서 검색 → 설치 여부 확인</li>
          <li><strong>단축어 (Shortcuts):</strong> 아이폰 기본 앱 (삭제했다면 App Store에서 재설치)</li>
          <li><strong>Field-Master:</strong> 설치 및 로그인 완료 상태</li>
        </ul>
      </div>

      <h2>단축어 만들기 (최초 1회)</h2>

      <Step no={1} title="단축어 앱 열기">
        <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
          <li style={{ marginBottom: 4 }}>홈 화면에서 <strong>&quot;단축어&quot;</strong> 앱을 찾아 탭합니다 (색색의 정사각형 모양).</li>
          <li>못 찾겠다면 홈 화면을 아래로 쓸어내려 &quot;단축어&quot;를 검색하세요.</li>
          <li style={{ marginTop: 4 }}>앱이 열리면 우측 상단 <strong>[+] 버튼</strong>을 탭합니다.</li>
        </ol>
      </Step>

      <Step no={2} title="새 단축어 만들기">
        <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
          <li style={{ marginBottom: 4 }}><strong>&quot;동작 추가&quot;</strong> 버튼이 보이는 새 화면이 열립니다.</li>
          <li style={{ marginBottom: 4 }}>상단 검색창에 <strong>&quot;클립보드&quot;</strong>를 입력합니다.</li>
          <li>목록에서 <strong>&quot;클립보드 가져오기 (Get Clipboard)&quot;</strong>를 선택합니다.</li>
        </ol>
        <div style={{ marginTop: 12, padding: "8px 12px", backgroundColor: "#e3f2fd", color: "#0d47a1", borderRadius: "6px", fontSize: 14 }}>
          ✅ <strong>안내:</strong> 이 단계는 클로바노트에서 복사한 텍스트를 받아오는 역할입니다.
        </div>
      </Step>

      <Step no={3} title="Field-Master로 전달하는 동작 추가">
        <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
          <li style={{ marginBottom: 4 }}>하단 검색창을 위로 쓸어올려 <strong>&quot;URL 열기&quot;</strong>를 검색합니다.</li>
          <li style={{ marginBottom: 4 }}><strong>&quot;URL 열기 (Open URLs)&quot;</strong>를 선택합니다.</li>
          <li style={{ marginBottom: 4 }}>URL 입력란에 아래를 입력합니다:</li>
        </ol>
        <div style={{ margin: "12px 0", padding: "12px", backgroundColor: "var(--color-bg-muted)", borderRadius: "6px", fontFamily: "monospace", fontSize: 14, wordBreak: "break-all" }}>
          fieldmaster://import?text=[클립보드]
        </div>
        <div style={{ padding: "12px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "6px", fontSize: 14 }}>
          ⚠️ <strong>[클립보드] 부분은 직접 입력하지 마세요!</strong><br/>
          - URL 입력란 안을 탭하고 키보드 상단의 변수 목록에서 <strong>&quot;클립보드&quot;</strong>를 선택하면 자동으로 삽입됩니다.
        </div>
      </Step>

      <Step no={4} title="단축어 이름 저장">
        <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
          <li style={{ marginBottom: 4 }}>상단 <strong>&quot;단축어 이름&quot;</strong> 탭 (또는 점 세 개 메뉴 …)</li>
          <li style={{ marginBottom: 4 }}>이름을 <strong>&quot;클로바 → Field-Master&quot;</strong>로 입력</li>
          <li style={{ marginBottom: 4 }}>아이콘과 색상은 원하는 대로 설정</li>
          <li><strong>&quot;완료&quot;</strong> 탭</li>
        </ol>
      </Step>

      <Step no={5} title="홈 화면에 추가 (선택 / 강력 권장)">
        <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
          <li style={{ marginBottom: 4 }}>방금 만든 단축어를 길게 누릅니다.</li>
          <li style={{ marginBottom: 4 }}><strong>&quot;홈 화면에 추가&quot;</strong> 선택</li>
          <li style={{ marginBottom: 4 }}>이름 확인 후 <strong>&quot;추가&quot;</strong> 탭</li>
          <li>홈 화면에 바로가기 아이콘이 생성됩니다.</li>
        </ol>
      </Step>

      <h2>💡 실제 사용 방법 (매일 쓰는 순서)</h2>
      <div className="card card-muted" style={{ marginBottom: "24px" }}>
        <div style={{ padding: "16px", backgroundColor: "var(--color-bg)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
          <div style={{ marginBottom: 8 }}>① 클로바노트 앱 열기</div>
          <div style={{ textAlign: "center", color: "var(--color-text-muted)", marginBottom: 8 }}>↓</div>
          <div style={{ marginBottom: 8 }}>② 원하는 노트 전체 선택 → 복사<br/> <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>(길게 누르기 → 전체 선택 → 복사)</span></div>
          <div style={{ textAlign: "center", color: "var(--color-text-muted)", marginBottom: 8 }}>↓</div>
          <div style={{ marginBottom: 8 }}>③ 홈 화면의 "클로바 → Field-Master" 단축어 탭</div>
          <div style={{ textAlign: "center", color: "var(--color-text-muted)", marginBottom: 8 }}>↓</div>
          <div>④ Field-Master가 자동으로 열리며 내용이 전달됨</div>
        </div>
      </div>



      <Link href="/" className="btn btn-primary" style={{ display: "inline-block" }}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
