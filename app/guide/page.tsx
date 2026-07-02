"use client";

import { useState, useEffect, createContext, useContext } from "react";
import "./guide.css";

const GuideContext = createContext<{
  openSection: number | null;
  toggleSection: (num: number) => void;
  checkedItems: Record<string, boolean>;
  toggleCheck: (id: string) => void;
  sectionStatus: Record<number, boolean>;
}>({ openSection: 0, toggleSection: () => {}, checkedItems: {}, toggleCheck: () => {}, sectionStatus: {} });

type SectionProps = {
  number: number;
  title: string;
  children: React.ReactNode;
  itemIds: string[]; // List of CheckItem IDs in this section
};

function Section({ number, title, children, itemIds }: SectionProps) {
  const { openSection, toggleSection, checkedItems, sectionStatus } = useContext(GuideContext);
  const isOpen = openSection === number;
  
  const isCompleted = sectionStatus[number];

  return (
    <div id={`section-${number}`} className={"guide-section" + (isOpen ? " open" : "")}>
      <button className="guide-section-header" onClick={() => toggleSection(number)}>
        <span className="guide-section-number">{number}</span>
        <span className="guide-section-title">{title}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {isCompleted && <span style={{ fontSize: "14px", color: "var(--color-primary)" }}>✅ 완료</span>}
          <span className="guide-section-arrow">▼</span>
        </div>
      </button>
      <div className="guide-section-body">
        {children}
        <div style={{ marginTop: "24px", padding: "16px", background: isCompleted ? "rgba(46, 204, 113, 0.1)" : "#f8f9fa", borderRadius: "8px", border: isCompleted ? "1px solid var(--color-primary)" : "1px solid #ddd", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.3s" }}>
          <input type="checkbox" checked={isCompleted} readOnly style={{ width: "20px", height: "20px", accentColor: "var(--color-primary)" }} />
          <span style={{ fontWeight: isCompleted ? "bold" : "normal", color: isCompleted ? "var(--color-primary)" : "#666" }}>
            {isCompleted ? "위의 세부 항목들을 모두 확인 했습니다." : "위의 세부 항목들을 모두 체크해주세요."}
          </span>
        </div>
      </div>
    </div>
  );
}

type StepProps = { num: number; children: React.ReactNode; checkId: string };

function Step({ num, children, checkId }: StepProps) {
  const { checkedItems, toggleCheck } = useContext(GuideContext);
  const isChecked = checkedItems[checkId] || false;

  return (
    <div className="guide-step" style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div className="guide-step-label" style={{ marginTop: "2px" }}>
          <span className="step-num">{num}</span>
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "12px", background: isChecked ? "rgba(46, 204, 113, 0.05)" : "#f8f9fa", borderRadius: "8px", cursor: "pointer", border: isChecked ? "1px solid rgba(46, 204, 113, 0.3)" : "1px solid transparent", transition: "all 0.2s" }}>
        <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(checkId)} style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }} />
        <span style={{ fontSize: "14px", fontWeight: isChecked ? "bold" : "normal", color: isChecked ? "var(--color-primary)" : "#444" }}>위 내용을 확인했습니다.</span>
      </label>
    </div>
  );
}

function FaqItem({ q, a, checkId }: { q: string; a: React.ReactNode; checkId: string }) {
  const { checkedItems, toggleCheck } = useContext(GuideContext);
  const isChecked = checkedItems[checkId] || false;

  return (
    <div className="guide-faq-item" style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "16px", marginBottom: "16px" }}>
      <p className="guide-faq-q">{q}</p>
      <div className="guide-faq-a">{a}</div>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "12px", background: isChecked ? "rgba(46, 204, 113, 0.05)" : "#f8f9fa", borderRadius: "8px", cursor: "pointer", border: isChecked ? "1px solid rgba(46, 204, 113, 0.3)" : "1px solid transparent", transition: "all 0.2s" }}>
        <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(checkId)} style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }} />
        <span style={{ fontSize: "14px", fontWeight: isChecked ? "bold" : "normal", color: isChecked ? "var(--color-primary)" : "#444" }}>이해했습니다.</span>
      </label>
    </div>
  );
}

const SECTION_DATA = [
  { id: 0, items: ["s0-1", "s0-2", "s0-3"] },
  { id: 1, items: ["s1-1", "s1-2", "s1-3"] },
  { id: 2, items: ["s2-1", "s2-2", "s2-3", "s2-4", "s2-5"] },
  { id: 3, items: ["s3-1", "s3-2"] },
  { id: 4, items: ["s4-1", "s4-2"] },
  { id: 5, items: ["s5-1", "s5-2", "s5-3"] },
];

export default function GuidePage() {
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [sectionStatus, setSectionStatus] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Load state and check completion
  useEffect(() => {
    // Check if already completed from DB or local
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/worker/guide-status");
        if (res.ok) {
          const data = await res.json();
          if (data.completed) {
            setIsCompleted(true);
            // Auto check everything for completed users
            const allChecked: Record<string, boolean> = {};
            SECTION_DATA.forEach(sec => sec.items.forEach(item => allChecked[item] = true));
            setCheckedItems(allChecked);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStatus();

    const handleHashChange = () => {
      const match = window.location.hash.match(/#section-(\d+)/);
      if (match) {
        setOpenSection(parseInt(match[1], 10));
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    }
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update section status when items are checked
  useEffect(() => {
    const newSectionStatus: Record<number, boolean> = {};
    let newlyCompletedSection: number | null = null;

    SECTION_DATA.forEach(sec => {
      const isSecComplete = sec.items.every(item => checkedItems[item]);
      newSectionStatus[sec.id] = isSecComplete;
      
      // Auto-advance logic: if this section just became complete, open the next one
      if (isSecComplete && !sectionStatus[sec.id]) {
        newlyCompletedSection = sec.id;
      }
    });

    setSectionStatus(newSectionStatus);

    if (newlyCompletedSection !== null && newlyCompletedSection < 5) {
      // Small delay to allow user to see the checkmark before closing
      setTimeout(() => {
        setOpenSection(newlyCompletedSection! + 1);
        window.location.hash = `#section-${newlyCompletedSection! + 1}`;
      }, 400);
    }
  }, [checkedItems]);

  const toggleSection = (num: number) => {
    setOpenSection(prev => (prev === num ? null : num));
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allCompleted = SECTION_DATA.every(sec => sectionStatus[sec.id]);

  const handleSubmit = async () => {
    if (!allCompleted) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/worker/guide-complete", { method: "POST" });
      if (res.ok) {
        setIsCompleted(true);
        alert("가이드 숙지 확인이 완료되었습니다. 감사합니다.");
        window.location.href = "/worker"; // Go to worker dashboard
      } else {
        alert("오류가 발생했습니다. 다시 시도해주세요.");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GuideContext.Provider value={{ openSection, toggleSection, checkedItems, toggleCheck, sectionStatus }}>
      <div className="guide-page">
        {/* ── 상단 ── */}
      <div className="guide-hero">
        <h1>사용 가이드</h1>
        <p>
          Field-Master를 처음 사용하시나요?<br />
          아래 내용을 모두 읽고 각 항목의 체크박스를 선택해주세요.
        </p>
        {isCompleted && (
          <div style={{ background: "rgba(46, 204, 113, 0.1)", color: "var(--color-primary)", padding: "12px", borderRadius: "8px", marginTop: "16px", fontWeight: "bold" }}>
            ✅ 이미 가이드 숙지를 완료하셨습니다.
          </div>
        )}
      </div>

      {/* ── 0장: 로그인 ── */}
      <Section number={0} title="로그인 및 보안 접속" itemIds={SECTION_DATA[0].items}>
        <div className="guide-info">
          Field-Master는 <strong>보안형 폐쇄 업무 시스템</strong>입니다. 관리자가 발급한 계정으로만 접속할 수 있습니다.
        </div>
        <Step num={1} checkId="s0-1">
          <p>
            <strong>작업자 계정 발급 받기</strong><br/>
            소속 기관의 관리자가 발급하여 전달합니다.<br/>
            필요시 소속 기관의 관리자에게 본인의 전화번호를 등록해 달라고 요청하세요.
          </p>
        </Step>
        <Step num={2} checkId="s0-2">
          <p>
            <strong>로그인 하기</strong><br/>
            앱에 접속하여 본인의 <strong>전화번호</strong>와 관리자가 발급해 준 <strong>초기 비밀번호</strong>를 입력하여 로그인합니다.
          </p>
        </Step>
        <Step num={3} checkId="s0-3">
          <p>
            <strong>보안 PIN 입력 (E2EE 암호해독)</strong><br/>
            로그인 직후 <strong>[Workspace 보안 접속]</strong> 화면이 나옵니다.<br/>
            관리자에게 전달받은 <strong>업무용 PIN 번호(숫자 6자리)</strong>를 입력해야만 현장 데이터가 복호화되어 화면에 나타납니다.
          </p>
        </Step>
      </Section>

      {/* ── 1장: 설치 ── */}
      <Section number={1} title="앱 설치하기 (처음 한 번만)" itemIds={SECTION_DATA[1].items}>
        <div className="guide-info">
          Field-Master는 별도의 앱스토어 다운로드 없이, <strong>크롬(Chrome) 브라우저</strong>에서 바로 휴대폰 앱으로 설치하실 수 있습니다.
        </div>
        <Step num={1} checkId="s1-1">
          <p>
            휴대폰의 <strong>크롬(Chrome) 브라우저</strong>를 열고,
            관리자에게 전달받은 주소를 입력하세요.
          </p>
        </Step>
        <Step num={2} checkId="s1-2">
          <p>
            화면에 <strong>&quot;휴대폰 홈화면에 추가가 필요해요&quot;</strong>라는 안내가 보입니다.
            크롬 오른쪽 위의 <strong>메뉴(⋮)</strong>를 누른 뒤,
            <strong> &quot;홈 화면에 추가&quot;</strong>를 선택해주세요.
          </p>
        </Step>
        <Step num={3} checkId="s1-3">
          <p>
            홈 화면에 <strong>FM</strong> 아이콘이 생기면 설치 완료입니다!<br />
            이제 클로바노트에서 <strong>&quot;공유&quot;</strong> 버튼을 누르면
            Field-Master를 바로 선택할 수 있습니다.
          </p>
        </Step>
      </Section>

      {/* ── 2장: 실전 따라하기 ── */}
      <Section number={2} title="실무자용: 현장 방문 A to Z" itemIds={SECTION_DATA[2].items}>
        <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>
          실태확인원이 앱을 어떻게 사용하는지 핵심 업무 흐름을 파악해 보세요.
        </p>

        <Step num={1} checkId="s2-1">
          <p>
            <strong>[출발 전] 배정된 명단 확인</strong><br />
            앱에 로그인하여 홈 화면의 &apos;오늘 배정된 방문 명단&apos;을 확인합니다.
          </p>
        </Step>
        <Step num={2} checkId="s2-2">
          <p>
            <strong>[현장 도착] 앱 내에서 체납자 터치 후 사진 촬영</strong><br />
            방문 장소에 도착하면 해당 <strong>체납자를 터치하여 열리는 팝업</strong>에서 <strong>[사진 등록]</strong>을 눌러 현장 도착 증빙 사진(문패, 건물 전경 등)을 촬영해 둡니다. (임시 보관됨)
          </p>
        </Step>
        <Step num={3} checkId="s2-3">
          <p>
            <strong>[상담 진행] 클로바노트 실행 또는 부재중 보고</strong><br />
            사진 촬영 후 체납자가 있으면 <strong>[🎙️ 녹음(클로바노트 실행)]</strong> 버튼을 눌러 대화를 녹음합니다.<br />
            만약 체납자가 부재중이라면 바로 아래의 <strong>[🚫 부재중 (바로 보고하기)]</strong> 버튼을 눌러 클로바노트를 거치지 않고 즉시 보고 화면으로 이동할 수 있습니다.
          </p>
        </Step>
        <Step num={4} checkId="s2-4">
          <p>
            <strong>[결과 보고] 기록 공유 및 자동 매핑 확인</strong><br />
            녹음 종료 후 클로바노트에서 텍스트 공유를 선택해 Field-Master 앱으로 돌아옵니다.<br />
            아까 <strong>미리 찍어둔 사진이 자동으로 보고서에 첨부되어 나타납니다.</strong><br />
            내용을 확인하고 하단의 <strong>[📤 방문내용 보고하기]</strong> 버튼을 누르면 사진과 데이터가 서버로 전송되고 업무가 마감됩니다.
          </p>
        </Step>
        <Step num={5} checkId="s2-5">
          <p>
            <strong>[업무 종료] 보안 잠금</strong><br />
            모든 현장 업무가 끝나면, 홈 화면 우측 상단의 <strong>[🔒 업무 종료 (데이터 잠금)]</strong> 버튼을 반드시 눌러 기기 내 민감 정보를 안전하게 지워줍니다.
          </p>
        </Step>
      </Section>

      {/* ── 3장: 미정리 상담 내용 ── */}
      <Section number={3} title="미정리 상담 보관함" itemIds={SECTION_DATA[3].items}>
        <Step num={1} checkId="s3-1">
          <p>
            <strong>미정리 상담 보관이란?</strong><br />
            현장에서 클로바노트로 내용을 전송했지만, 결과 보고를 마무리하지 못했거나 실수로 창을 닫아버린 경우 해당 기록이 앱 내에 임시 보관됩니다.
          </p>
        </Step>
        <Step num={2} checkId="s3-2">
          <p>
            <strong>나중에 정리하는 방법</strong><br />
            홈 화면 상단의 알림바나, <strong>&quot;✨ 미정리 상담 (○건)&quot;</strong> 버튼을 눌러 목록을 엽니다.<br />
            <strong>[정리하러 가기]</strong> 버튼을 클릭하면 즉시 매칭 화면으로 연결되어 밀린 보고를 이어서 완료할 수 있습니다.
          </p>
        </Step>
      </Section>

      {/* ── 4장: 부가 기능 ── */}
      <Section number={4} title="부가 기능 (재방문 예약 및 문자 발송)" itemIds={SECTION_DATA[4].items}>
        <Step num={1} checkId="s4-1">
          <p>
            <strong>📅 재방문 예약하기</strong><br />
            방문내용 보고 화면에서 방문결과를 <strong>&quot;재방문필요&quot;</strong>로 선택하면 하단에 예약 영역이 나타납니다. 예약 날짜와 시간을 지정하여 보고하면, 해당 날짜에 명단 최상단에 우선 표시됩니다.
          </p>
        </Step>
        <Step num={2} checkId="s4-2">
          <p>
            <strong>📱 사전/안내 문자 발송하기</strong><br />
            홈 화면의 방문 카드 오른쪽에 있는 <strong>[📱 문자 아이콘]</strong>을 누르면 체납자의 이름과 정보가 채워진 <strong>안내 문자 템플릿</strong>이 뜹니다. 내용을 확인하고 발송할 수 있습니다.
          </p>
        </Step>
      </Section>

      {/* ── 5장: FAQ ── */}
      <Section number={5} title="자주 묻는 질문 (FAQ)" itemIds={SECTION_DATA[5].items}>
        <FaqItem checkId="s5-1" q="Q. 앱에 접속했는데 아무 명단도 없어요." a={<p>관리자(공무원)가 아직 오늘의 업무를 선생님(실태확인원)에게 배정하지 않은 상태입니다. 관리자에게 배정을 요청해 주세요.</p>} />
        <FaqItem checkId="s5-2" q="Q. 클로바노트에서 &quot;공유&quot;를 눌러도 Field-Master가 안 보여요" a={<p>홈 화면에 앱이 설치되어 있어야 합니다. 크롬 메뉴(⋮)에서 &quot;홈 화면에 추가&quot;를 진행해 주세요. 아이폰(iOS)의 경우 별도의 단축어 세팅이 필요할 수 있습니다.</p>} />
        <FaqItem checkId="s5-3" q="Q. 데이터 유출 위험은 없나요?" a={<p>모든 데이터는 <strong>종단간 암호화(E2EE)</strong>로 강력하게 보호되며 <strong>이중 잠금(2-Factor) 체계</strong>가 적용되어 있습니다. 1차 로그인 비밀번호, 2차 PIN 번호가 모두 있어야 합니다. 기기 분실 시 관리자님이 즉시 계정을 원격 차단할 수 있습니다.</p>} />
      </Section>

      {/* ── 서명 영역 ── */}
      <div style={{ padding: "30px 20px", background: "#fff", borderTop: "1px solid #ddd", marginTop: "40px", textAlign: "center" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "16px", color: allCompleted ? "var(--color-primary)" : "#333" }}>가이드 숙지 확인</h3>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          위의 6개 섹션(총 18개 항목)의 체크박스를 모두 확인해야 제출이 가능합니다.
        </p>
        <button 
          onClick={handleSubmit}
          disabled={!allCompleted || isSubmitting || isCompleted}
          style={{
            width: "100%", maxWidth: "400px", padding: "16px", borderRadius: "12px",
            fontSize: "16px", fontWeight: "bold", border: "none",
            background: isCompleted ? "var(--color-primary)" : (allCompleted ? "var(--color-primary)" : "#ddd"),
            color: allCompleted || isCompleted ? "#fff" : "#999",
            cursor: allCompleted && !isCompleted && !isSubmitting ? "pointer" : "not-allowed",
            transition: "all 0.3s"
          }}
        >
          {isCompleted ? "✅ 수료 완료" : (isSubmitting ? "제출 중..." : "본인은 위 가이드 및 보안 규정을 숙지하였습니다")}
        </button>
      </div>

      {/* ── 홈으로 ── */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px", flexDirection: "column", alignItems: "center" }}>
        <a className="btn btn-primary" href="/ios-guide" style={{ background: "#000", borderColor: "#000", width: "100%", maxWidth: "300px" }}>
           아이폰(iOS) 전용 가이드 보기
        </a>
        <a className="btn btn-ghost" href="/worker" style={{ border: "1px solid var(--color-border)", width: "100%", maxWidth: "300px" }}>
          홈으로 돌아가기
        </a>
      </div>
    </div>
    </GuideContext.Provider>
  );
}
