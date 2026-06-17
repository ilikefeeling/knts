"use client";

import { useState, useEffect } from "react";
import "./guide.css";

type SectionProps = {
  number: number;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function Section({ number, title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === `#section-${number}`) {
        setOpen(true);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    // 첫 로드 시 체크
    if (window.location.hash === `#section-${number}`) {
      setOpen(true);
    }
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [number]);

  return (
    <div id={`section-${number}`} className={"guide-section" + (open ? " open" : "")}>
      <button className="guide-section-header" onClick={() => setOpen(!open)}>
        <span className="guide-section-number">{number}</span>
        <span className="guide-section-title">{title}</span>
        <span className="guide-section-arrow">▼</span>
      </button>
      <div className="guide-section-body">{children}</div>
    </div>
  );
}

type StepProps = { num: number; children: React.ReactNode };

function Step({ num, children }: StepProps) {
  return (
    <div className="guide-step">
      <div className="guide-step-label">
        <span className="step-num">{num}</span>
      </div>
      {children}
    </div>
  );
}

function Screenshot({ src, alt }: { src: string; alt: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="guide-screenshot" src={src} alt={alt} />
      <p className="guide-screenshot-caption">▲ {alt}</p>
    </>
  );
}

export default function GuidePage() {
  return (
    <div className="guide-page">
      {/* ── 상단 ── */}
      <div className="guide-hero">
        <h1>📖 사용 가이드</h1>
        <p>
          Field-Master를 처음 사용하시나요?<br />
          아래 순서대로 따라 하시면 됩니다.
        </p>
      </div>

      {/* ── 실전 따라하기 ── */}
      <Section number={0} title="🔥 실무자용: 현장 방문 A to Z" defaultOpen>
        <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
          실제 업무 순서대로 앱을 어떻게 사용하는지 흐름을 파악해 보세요.
        </p>

        <Step num={1}>
          <p>
            <strong>[출발 전] 명단 준비하기</strong><br />
            사무실에서 엑셀로 오늘 방문할 명단을 업로드합니다.
          </p>
          <div style={{ marginTop: 4 }}>
            <a href="#section-2" style={{ color: "var(--color-primary)", fontSize: 14, textDecoration: "none" }}>자세히 ➔</a>
          </div>
        </Step>
        <Step num={2}>
          <p>
            <strong>[현장 도착] 방문 대상 확인</strong><br />
            앱을 켜고 &apos;오늘의 방문 명단&apos;에서 방문 대상을 누른 뒤 <strong>[🎙️ 클로바노트 앱 실행하기(현장 사진찍기)]</strong>를 누릅니다.
          </p>
          <div style={{ marginTop: 4 }}>
            <a href="#section-3" style={{ color: "var(--color-primary)", fontSize: 14, textDecoration: "none" }}>자세히 ➔</a>
          </div>
        </Step>
        <Step num={3}>
          <p>
            <strong>[방문 및 사진/녹음] 현장 작업 진행</strong><br />
            클로바노트가 실행되면 상담 내용을 녹음합니다. 현장에서 필요한 사진도 휴대폰 카메라로 함께 촬영합니다.<br />
            (부재중일 경우 &quot;아무도 안 계시네요, 안내문 부착하겠습니다&quot;라고 말해 녹음합니다.)
          </p>
          <div style={{ marginTop: 4 }}>
            <a href="#section-4" style={{ color: "var(--color-primary)", fontSize: 14, textDecoration: "none" }}>자세히 ➔</a>
          </div>
        </Step>
        <Step num={4}>
          <p>
            <strong>[기록 공유 & 사진 등록]</strong><br />
            상담 종료 후, 클로바노트에서 텍스트로 변환하고 <strong>Field-Master로 공유</strong>합니다.<br />
            앱이 열리면 <strong>1:1 매칭된 대상자를 확인 후 선택</strong>하고, <strong>[📸 현장 사진]</strong> 영역에서 아까 찍어둔 사진을 등록한 뒤 함께 저장합니다.
          </p>
          <div style={{ marginTop: 4 }}>
            <a href="#section-5" style={{ color: "var(--color-primary)", fontSize: 14, textDecoration: "none" }}>자세히 ➔</a>
          </div>
        </Step>
        <Step num={5}>
          <p>
            <strong>[사후 조치] 예약 및 문자 발송</strong><br />
            저장을 완료한 뒤, 필요하다면 바로 다음 재방문 날짜를 예약하거나 안내 문자를 발송합니다.
          </p>
          <div style={{ marginTop: 4 }}>
            <a href="#section-6" style={{ color: "var(--color-primary)", fontSize: 14, textDecoration: "none" }}>자세히 ➔</a>
          </div>
        </Step>
      </Section>

      {/* ── 1장: 설치 ── */}
      <Section number={1} title="설치하기 (처음 한 번만)" defaultOpen>
        <div className="guide-info">
          Field-Master는 별도의 앱스토어 다운로드 없이, <strong>크롬 브라우저</strong>에서 바로 설치하실 수 있습니다.
        </div>

        <h3 style={{ fontSize: 17, margin: "16px 0 12px" }}>📱 휴대폰에서 설치하기</h3>
        <Step num={1}>
          <p>
            휴대폰의 <strong>크롬(Chrome) 브라우저</strong>를 열고,
            관리자에게 전달받은 주소를 입력하세요.
          </p>
        </Step>
        <Step num={2}>
          <p>
            화면에 <strong>&quot;휴대폰 홈화면에 추가가 필요해요&quot;</strong>라는
            안내가 보입니다.
            크롬 오른쪽 위의 <strong>메뉴(⋮)</strong>를 누른 뒤,
            <strong> &quot;홈 화면에 추가&quot;</strong>를 선택해주세요.
          </p>
        </Step>
        <Step num={3}>
          <p>
            홈 화면에 <strong>FM</strong> 아이콘이 생기면 설치 완료입니다!<br />
            이제 클로바노트에서 <strong>&quot;공유&quot;</strong> 버튼을 누르면
            Field-Master를 바로 선택할 수 있습니다.
          </p>
        </Step>

        <h3 style={{ fontSize: 17, margin: "20px 0 12px" }}>💻 PC에서 설치하기 (선택)</h3>
        <Step num={1}>
          <p>
            PC의 크롬 브라우저로 접속하면 아래와 같이
            <strong> &quot;PC에서 보고 계시네요&quot;</strong> 안내가 나타납니다.
          </p>
          <Screenshot src="/guide/home-full.png" alt="PC에서 접속한 홈 화면" />
        </Step>
        <Step num={2}>
          <p>
            크롬 주소창 오른쪽의 <strong>설치 아이콘(⊕)</strong>을 클릭하면
            PC에도 설치할 수 있습니다. 명단 관리나 문자 발송을 PC에서
            더 넓은 화면으로 편하게 하실 수 있습니다.
          </p>
        </Step>

        <div className="guide-warning">
          클로바노트 &quot;공유&quot;로 현장기록을 보내는 기능은
          <strong> 휴대폰에서만</strong> 동작합니다.
          현장기록은 휴대폰으로, 명단 관리·문자 발송은 PC에서도
          동일하게 사용하실 수 있습니다.
        </div>
      </Section>

      {/* ── 2장: 엑셀 업로드 ── */}
      <Section number={2} title="엑셀 명단 업로드하기">
        <Step num={1}>
          <p>
            홈 화면에서 <strong>&quot;📥 방문명단 샘플 엑셀 양식 다운로드&quot;</strong> 버튼을
            눌러 양식 파일을 받으세요.
          </p>
          <Screenshot src="/guide/upload-hover.png" alt="엑셀 업로드 영역" />
        </Step>
        <Step num={2}>
          <p>
            다운로드한 엑셀 파일을 열면 <strong>&quot;방문명단&quot;</strong> 시트와
            <strong> &quot;작성예시&quot;</strong> 시트가 있습니다.
            &quot;방문명단&quot; 시트의 <strong>1행(헤더)은 그대로 두고</strong>,
            2행부터 대상자 정보를 채워주세요.
          </p>
          <div className="guide-tip">
            엑셀 열 순서: 연번, 성명, 연락처, 주소, 체납액, 체납기간, 비고(특이사항)
          </div>
        </Step>
        <Step num={3}>
          <p>
            작성이 끝나면 홈 화면의 <strong>&quot;➕ 엑셀 명단 추가하기&quot;</strong>를
            눌러 파일을 선택하세요. 화면에 미리보기 표가 나타납니다.
          </p>
        </Step>
        <Step num={4}>
          <p>
            <strong>방문 예정일</strong>을 확인하고
            <strong> &quot;원장에 반영하기 →&quot;</strong> 버튼을 누르면 완료!<br />
            &quot;신규 ○건 추가, 기존 ○건 업데이트&quot; 결과가 표시됩니다.
          </p>
        </Step>
        <Step num={5}>
          <p>
            만약 파일을 잘못 올렸다면, <strong>&quot;🗑️ 잘못 올린 파일 삭제&quot;</strong> 버튼을 눌러
            해당 일자의 명단을 초기화하고 새 파일을 다시 올릴 수 있습니다.
          </p>
        </Step>

        <div className="guide-tip">
          같은 이름+주소의 대상자가 이미 있으면 자동으로 기존 정보를 업데이트합니다.<br />
          명단을 추가로 더 올리고 싶을 때도 <strong>&quot;➕ 엑셀 명단 추가하기&quot;</strong>를 눌러 이어서 올릴 수 있습니다.
        </div>
      </Section>

      {/* ── 3장: 오늘의 방문 명단 ── */}
      <Section number={3} title="오늘의 방문 명단 확인하기">
        <Step num={1}>
          <p>
            엑셀을 업로드하면 홈 화면 아래쪽에
            <strong> &quot;오늘의 방문 명단&quot;</strong>이 나타납니다.
            각 카드에는 <strong>이름, 주소, 방문 회차</strong>가 표시됩니다.
          </p>
        </Step>
        <Step num={2}>
          <p>
            재방문 예약이 있는 분은 카드에 <strong>🕐 예약 시간</strong>이
            표시되고, 목록 맨 위에 우선 정렬됩니다.
          </p>
        </Step>
        <Step num={3}>
          <p>
            카드 오른쪽의 <strong>📱</strong> 버튼을 누르면
            바로 문자 발송 화면이 열립니다.
          </p>
        </Step>
      </Section>

      {/* ── 4장: 클로바노트 공유 ── */}
      <Section number={4} title="현장 상담 녹취 → 공유하기">
        <div className="guide-info">
          이 기능은 <strong>휴대폰</strong>에서만 사용할 수 있습니다.
        </div>

        <Step num={1}>
          <p>
            홈 화면 명단에서 대상자를 선택하고 <strong>클로바노트 앱 실행하기(현장 사진찍기)</strong> 버튼을 눌러 앱을 실행합니다. 현장 사진이 필요하면 휴대폰 카메라로 함께 촬영합니다.
          </p>
        </Step>
        <Step num={2}>
          <p>
            현장에서 상담할 때 <strong>클로바노트</strong>로 대화 내용을 녹음합니다.
            녹음이 끝나면 <strong>텍스트로 변환</strong>합니다.
            변환이 완료되면 화면에 상담 내용이 글자로 표시됩니다.
          </p>
        </Step>
        <Step num={3}>
          <p>
            텍스트 화면에서 <strong>&quot;공유&quot;</strong> 버튼을 누르고,
            앱 목록에서 <strong>&quot;Field-Master&quot;</strong>를 선택하세요.<br />
            (처음에 목록에 안 보이면 &quot;더보기&quot;를 누르세요.)
          </p>
        </Step>

        <div className="guide-tip">
          공유를 누르면 자동으로 Field-Master가 열리면서
          다음 단계(AI 자동분류)로 넘어갑니다.
        </div>
      </Section>

      {/* ── 5장: AI 자동분류 ── */}
      <Section number={5} title="AI 자동분류 & 저장하기">
        <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
          클로바노트에서 공유하면 <strong>2단계</strong>를 거쳐 현장기록이
          자동으로 정리·저장됩니다.
        </p>

        <Step num={1}>
          <p>
            <strong>1단계 — 1:1 자동 매칭 및 대상 확인</strong><br />
            공유받은 텍스트와 함께 <strong>앱이 직전 방문 기록과 내용을 분석하여 찾아낸 최적의 방문 대상 1개</strong>가 화면에 제시됩니다.<br />
            대상을 눈으로 확인하고 <strong>터치하여 선택</strong>한 뒤, 하단의 <strong>&quot;선택한 대상으로 자동 정리하기&quot;</strong>를 누르세요.
          </p>
          <div className="guide-tip" style={{ marginTop: 8 }}>
            앱이 찾은 대상이 틀렸다면, 아래의 <strong>&quot;목록에 찾는 대상이 없나요? 전체 명단 보기&quot;</strong> 버튼을 눌러 직접 고르실 수도 있습니다.
          </div>
        </Step>
        <Step num={2}>
          <p>
            <strong>2단계 — AI 정리 결과 확인 & 저장</strong><br />
            AI가 상담 내용을 분석하여 <strong>방문결과</strong>와
            <strong> 특이사항</strong>을 자동으로 채워줍니다.
          </p>
          <p>
            <strong>📸 현장 사진</strong> 영역의 <strong>&quot;+ 사진 촬영&quot;</strong> 버튼을 눌러
            현장 방문 증빙 사진을 바로 찍거나 앨범에서 추가할 수 있습니다. (최대 5장)
          </p>
          <p>
            내용이 맞으면 그대로 <strong>&quot;✓ 저장하기&quot;</strong>를 누르세요.
            수정이 필요하면 직접 고친 뒤 저장하시면 됩니다.
          </p>
        </Step>

        <div className="guide-tip">
          AI 분석 결과가 마음에 들지 않으면
          <strong> &quot;↻ 다시 분석하기&quot;</strong>를 한 번 더 누를 수 있습니다.
          (1회 추가 사용 가능)
        </div>

        <div className="guide-warning">
          <strong>주의:</strong> 저장하기 전에 뒤로 가기를 누르거나 새로고침하면 다시 진행해야 합니다.
          다시 진입하여 1단계에서 &quot;자동 정리하기&quot;를 누르면 AI 분석 한도가 차감될 수 있으니 주의하세요.
        </div>
      </Section>

      {/* ── 6장: 미정리 상담 내용 ── */}
      <Section number={6} title="미정리 상담 내용 (나중에 정리하기)">
        <Step num={1}>
          <p>
            현장에서 클로바노트로 공유했지만, 바빠서 저장을 마무리하지 못했거나 실수로 창을 닫아버린 경우 <strong>&quot;미정리 상담 내용&quot;</strong>으로 홈 화면에 안전하게 보관됩니다.
          </p>
        </Step>
        <Step num={2}>
          <p>
            홈 화면 상단의 <strong>&quot;⚠️ 처리하지 않은 현장기록이 ○건 있습니다&quot;</strong> 알림바나, <strong>&quot;✨ 미정리 상담 (○건)&quot;</strong> 버튼을 누르면 보관된 목록을 볼 수 있습니다.
          </p>
        </Step>
        <Step num={3}>
          <p>
            항목의 <strong>[정리하러 가기]</strong> 영역을 클릭하면 <strong>1:1 자동 매칭 화면</strong>으로 바로 연결되어 밀린 정리를 즉시 완료할 수 있습니다.<br />
            만약 테스트로 보냈거나 더 이상 필요 없는 기록이라면, 항목 오른쪽의 <strong>&quot;🗑️ (휴지통)&quot;</strong> 아이콘을 눌러 즉각 삭제할 수 있습니다.
          </p>
        </Step>
      </Section>

      {/* ── 7장: 재방문 예약 ── */}
      <Section number={7} title="재방문 예약하기">
        <Step num={1}>
          <p>
            AI 정리 결과 화면(2단계)에서 방문결과를 <strong>&quot;재방문필요&quot;</strong>로
            선택하면, 아래에 <strong>📅 재방문 예약</strong> 영역이 나타납니다.
          </p>
        </Step>
        <Step num={2}>
          <p>
            <strong>예약 날짜</strong>를 달력에서 선택하고,
            <strong> 예약 시간</strong>을 드롭다운(09:00~18:00, 30분 단위)에서
            골라주세요. 기본값은 1주 뒤 10:00입니다.
          </p>
        </Step>
        <Step num={3}>
          <p>
            <strong>&quot;✓ 저장하기&quot;</strong>를 누르면 예약 정보가 함께
            저장됩니다. 해당 날짜가 되면 홈 화면 &quot;오늘의 방문 명단&quot;에
            <strong> 🕐 예약 시간</strong>과 함께 맨 위에 표시됩니다.
          </p>
        </Step>
      </Section>

      {/* ── 8장: 방문 관리 ── */}
      <Section number={8} title="방문 관리 (원장) 사용하기">
        <Step num={1}>
          <p>
            홈 화면에서 <strong>&quot;📋 방문 관리&quot;</strong> 버튼을 누르면
            전체 대상자 원장 화면으로 이동합니다.
          </p>
          <Screenshot src="/guide/ledger-full.png" alt="방문 관리(원장) 화면" />
        </Step>
        <Step num={2}>
          <p>
            상단 <strong>검색창</strong>에 이름이나 주소를 입력하면
            해당 대상자만 필터링됩니다.
            <strong> 방문결과</strong> 필터로 &quot;재방문필요&quot;만
            모아볼 수도 있습니다.
          </p>
        </Step>
        <Step num={3}>
          <p>
            대상자를 터치하면 <strong>상세 정보</strong>(방문 이력,
            재방문 예약, 특이사항)를 확인할 수 있습니다.
          </p>
        </Step>
      </Section>

      {/* ── 9장: 문자 발송 ── */}
      <Section number={9} title="문자 발송하기">
        <Step num={1}>
          <p>
            홈 화면의 방문 카드 오른쪽에 있는 <strong>📱 버튼</strong>을
            누르면 문자 발송 화면이 열립니다.
          </p>
        </Step>
        <Step num={2}>
          <p>
            미리 작성된 <strong>문자 템플릿</strong>에 대상자의 이름과
            정보가 자동으로 채워집니다.
            내용을 확인하고 <strong>&quot;발송&quot;</strong>을 누르세요.
          </p>
        </Step>

        <div className="guide-tip">
          문자 발송은 휴대폰의 기본 문자 앱을 통해 이루어집니다.
          별도의 문자 요금이 발생할 수 있습니다.
        </div>
      </Section>

      {/* ── 10장: 요금제 ── */}
      <Section number={10} title="요금제 & AI 사용 한도">
        <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
          엑셀 업로드, 원장 관리, 문자 발송은 <strong>모두 무료</strong>입니다.
          AI 자동분류 기능만 아래와 같이 한도가 있습니다.
        </p>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>무료 (Free)</div>
          <p style={{ margin: 0, fontSize: 15, color: "var(--color-text-muted)" }}>
            AI 자동분류 <strong>월 15건</strong>까지 무료<br />
            한도를 넘으면 방문결과와 특이사항을 직접 입력하시면 됩니다.
          </p>
        </div>

        <div className="card" style={{ background: "var(--color-primary-bg)", border: "none", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, color: "var(--color-primary)" }}>Pro — 월 4,900원</div>
          <p style={{ margin: 0, fontSize: 15, color: "var(--color-text-muted)" }}>
            AI 자동분류 <strong>무제한</strong><br />
            (추후) 재방문 예약 알림, 클라우드 백업 등 추가 기능 제공 예정
          </p>
        </div>

        <Screenshot src="/guide/pricing-full.png" alt="요금제 페이지" />

        <div className="guide-info">
          이번 달 AI 사용량은 홈 화면 → <strong>&quot;✨ 요금제&quot;</strong>에서
          확인하실 수 있습니다.
        </div>
      </Section>

      {/* ── 11장: FAQ ── */}
      <Section number={11} title="자주 묻는 질문 (FAQ)">
        <div className="guide-faq-item">
          <p className="guide-faq-q">
            Q. 클로바노트에서 &quot;공유&quot;를 눌러도 Field-Master가 안 보여요
          </p>
          <p className="guide-faq-a">
            홈 화면에 앱이 설치되어 있어야 합니다.
            1장 &quot;설치하기&quot;를 참고하여 크롬 → 메뉴(⋮) →
            &quot;홈 화면에 추가&quot;를 해주세요.
          </p>
        </div>

        <div className="guide-faq-item">
          <p className="guide-faq-q">
            Q. 엑셀을 올렸는데 0건으로 나와요
          </p>
          <p className="guide-faq-a">
            1행(헤더)만 있고 데이터가 없거나,
            &quot;성명&quot;과 &quot;주소&quot; 열이 비어 있으면 0건으로 처리됩니다.
            샘플 양식의 &quot;작성예시&quot; 시트를 참고해서 작성해주세요.
          </p>
        </div>

        <div className="guide-faq-item">
          <p className="guide-faq-q">
            Q. AI 자동분류가 갑자기 안 돼요
          </p>
          <p className="guide-faq-a">
            무료 사용자는 한 달에 15건까지만 AI 자동분류를 사용할 수 있습니다.
            한도를 넘으면 방문결과와 특이사항을 직접 선택/입력하시면 됩니다.
            매월 1일에 자동으로 초기화됩니다.
          </p>
        </div>

        <div className="guide-faq-item">
          <p className="guide-faq-q">
            Q. PC에서 클로바노트 공유를 쓸 수 있나요?
          </p>
          <p className="guide-faq-a">
            클로바노트의 &quot;공유&quot; 기능은 휴대폰에서만 동작합니다.
            PC에서는 홈 화면에서 대상자 카드를 클릭하면 나오는
            &quot;현장 작업 모달&quot; 하단의 &quot;텍스트 직접 입력&quot;으로
            동일한 AI 분석을 사용하실 수 있습니다.
          </p>
        </div>

        <div className="guide-faq-item">
          <p className="guide-faq-q">
            Q. 재방문 예약 알림이 오나요?
          </p>
          <p className="guide-faq-a">
            현재 알림 기능은 준비 중입니다.
            예약한 날짜가 되면 홈 화면 &quot;오늘의 방문 명단&quot;에
            우선 표시되므로, 매일 앱을 열어 확인해주세요.
          </p>
        </div>

        <div className="guide-faq-item">
          <p className="guide-faq-q">
            Q. 데이터가 다른 기기에서 안 보여요
          </p>
          <p className="guide-faq-a">
            현재 데이터는 각 기기(브라우저)에 저장됩니다.
            다른 기기에서 보시려면 같은 기기·같은 브라우저로 접속해주세요.
            기기 간 동기화 기능은 추후 Pro에서 제공 예정입니다.
          </p>
        </div>

        <div className="guide-faq-item">
          <p className="guide-faq-q">
            Q. 2단계 저장 전에 실수로 나갔는데 어떻게 하나요?
          </p>
          <p className="guide-faq-a">
            걱정하지 마세요! 스마트폰에서 실수로 창을 닫았거나 뒤로 가기를 눌렀더라도, 데이터는 날아가지 않습니다. 홈 화면으로 가시면 <strong>&quot;미정리 상담 내용&quot;</strong>에 안전하게 보관되어 있습니다. 목록에서 다시 클릭하여 언제든 정리를 이어서 진행할 수 있습니다.
          </p>
        </div>
      </Section>

      {/* ── 하단 ── */}
      <div className="guide-footer">
        <p>Field-Master v0.1.0 · 사용 가이드</p>
      </div>

      {/* ── 홈으로 ── */}
      <a
        className="btn btn-ghost"
        href="/"
        style={{
          justifyContent: "center",
          border: "1px solid var(--color-border)",
          marginTop: 12,
        }}
      >
        홈으로 돌아가기
      </a>
    </div>
  );
}
