import { APP_URL } from "@/lib/constants";

function Step({
  no,
  title,
  children,
}: {
  no: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
        {no}. {title}
      </div>
      <div style={{ fontSize: 15, color: "var(--color-text-muted)" }}>
        {children}
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="original-text"
      style={{
        fontFamily: "monospace",
        fontSize: 14,
        wordBreak: "break-all",
        color: "var(--color-text)",
      }}
    >
      {children}
    </div>
  );
}

export default function IosGuidePage() {
  const shareApiUrl = `${APP_URL}/api/share`;
  const receiverBaseUrl = `${APP_URL}/share-receiver?id=`;

  return (
    <div>
      <h1>아이폰(iOS) 사용 안내</h1>
      <p style={{ fontSize: 15, color: "var(--color-text-muted)" }}>
        아이폰은 클로바노트에서 바로 &quot;Field-Master&quot;를 공유할 수
        없어서, &quot;단축어&quot; 앱으로 비슷한 기능을 만들어 드립니다.
        아래 순서대로 <strong>딱 한 번만</strong> 설정하면, 이후에는
        안드로이드와 거의 동일하게 사용할 수 있습니다.
      </p>

      <div className="card card-muted">
        <strong>준비물:</strong> 아이폰 기본 설치 앱인{" "}
        <strong>&quot;단축어(Shortcuts)&quot;</strong> 앱
      </div>

      <h2>설정 방법 (최초 1회)</h2>

      <Step no={1} title="단축어 앱에서 새 단축어 만들기">
        단축어 앱을 열고, 오른쪽 위 <strong>+</strong> 버튼을 눌러 새 단축어를
        만듭니다.
      </Step>

      <Step no={2} title="공유 시트에 표시되도록 설정">
        오른쪽 위 <strong>(i) 정보</strong> 버튼을 누르고{" "}
        <strong>&quot;공유 시트에서 표시&quot;</strong>를 켭니다. &quot;공유
        시트 입력&quot; 종류는 <strong>텍스트</strong>를 선택합니다.
      </Step>

      <Step no={3} title='"URL의 콘텐츠 가져오기" 동작 추가'>
        동작 추가 → <strong>URL의 콘텐츠 가져오기</strong> 검색 후 추가합니다.
        아래와 같이 설정합니다.
        <ul style={{ paddingLeft: "1.1rem", margin: "8px 0" }}>
          <li>URL:</li>
        </ul>
        <Code>{shareApiUrl}</Code>
        <ul style={{ paddingLeft: "1.1rem", margin: "8px 0" }}>
          <li>
            <strong>방법(메서드)</strong>: POST
          </li>
          <li>
            <strong>요청 본문</strong>: JSON
          </li>
          <li>
            JSON 항목 추가 → 키: <strong>text</strong>, 값:{" "}
            <strong>단축어 입력(Shortcut Input)</strong> 선택
            <br />
            (값 입력칸을 누르면 나오는 변수 목록에서 &quot;단축어
            입력&quot;을 고르면 됩니다)
          </li>
        </ul>
      </Step>

      <Step no={4} title='"사전에서 값 가져오기" 동작 추가'>
        동작 추가 → <strong>사전에서 값 가져오기</strong> 검색 후 추가합니다.
        <ul style={{ paddingLeft: "1.1rem", margin: "8px 0" }}>
          <li>
            <strong>키</strong>: id
          </li>
          <li>
            <strong>딕셔너리</strong>: 3번 동작의 결과(URL의 콘텐츠) 선택
          </li>
        </ul>
      </Step>

      <Step no={5} title='"텍스트" 동작으로 주소 만들기'>
        동작 추가 → <strong>텍스트</strong> 검색 후 추가합니다. 아래 주소를
        먼저 입력하고, 그 뒤에 4번 동작의 결과값(id)을 이어 붙입니다.
        <Code>{receiverBaseUrl}</Code>
        <p style={{ marginTop: 8, marginBottom: 0 }}>
          (텍스트 입력칸에 위 주소를 입력한 다음, 칸 끝을 눌러 변수 목록에서
          4번 동작 결과를 선택하면 뒤에 이어 붙습니다)
        </p>
      </Step>

      <Step no={6} title='"Safari로 열기" 동작 추가'>
        동작 추가 → <strong>Safari로 열기</strong>(또는 &quot;URL 열기&quot;)
        검색 후 추가하고, 5번에서 만든 텍스트를 입력값으로 선택합니다.
      </Step>

      <Step no={7} title="이름 정하고 저장">
        단축어 이름을{" "}
        <strong>&quot;Field-Master로 보내기&quot;</strong> 로 정하고 완료를
        누릅니다.
      </Step>

      <h2>사용 방법</h2>
      <div className="card card-muted">
        <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 15 }}>
          <li style={{ marginBottom: 8 }}>
            앱 홈 화면에서 <strong>클로바노트 앱 실행하기(현장 사진찍기)</strong> 버튼을 눌러 작업을 시작합니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            상담 내용 녹음 후 텍스트 변환 화면에서 <strong>공유</strong> 버튼을 누릅니다.
          </li>
          <li style={{ marginBottom: 8 }}>
            공유 목록에서 아래로 스크롤 → <strong>단축어</strong> →{" "}
            <strong>Field-Master로 보내기</strong>를 선택합니다.
          </li>
          <li>
            잠시 후 Safari가 열리면서 Field-Master 화면이
            나타납니다. (이후 흐름은 안드로이드와 동일)
          </li>
        </ol>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
        * 처음 1회만 설정하면 되며, 이후에는 매번 &quot;공유 → Field-Master로
        보내기&quot;만 누르면 됩니다.
      </p>

      <a className="btn btn-primary" href="/">
        홈으로 돌아가기
      </a>
    </div>
  );
}
