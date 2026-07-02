"use client";

import React, { useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";

export default function ManualPage() {
  const router = useRouter();

  useEffect(() => {
    const savedPin = sessionStorage.getItem("workspace_pin");
    if (!savedPin) {
      router.push("/admin");
    }
  }, [router]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Pretendard', sans-serif" }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: "32px", overflowY: "auto", color: "white" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", background: "#1e293b", padding: "40px", borderRadius: "16px", border: "1px solid #334155" }}>
          
          <h1 style={{ fontSize: "28px", borderBottom: "2px solid #334155", paddingBottom: "16px", marginBottom: "24px" }}>
            국세외수입 체납관리단 시스템 - 업무 플로우 및 앱 사용 설명서
          </h1>
          
          <div style={{ background: "rgba(59, 130, 246, 0.1)", borderLeft: "4px solid #3b82f6", padding: "16px", marginBottom: "32px", borderRadius: "0 8px 8px 0" }}>
            <p style={{ margin: 0, color: "#93c5fd" }}>
              본 문서는 체납 데이터의 무결성을 유지하면서, 누구나 시스템을 쉽게 사용하고 업무를 수행할 수 있도록 작성된 '업무 절차 겸 앱 사용 설명서(매뉴얼)' 입니다.
            </p>
          </div>

          <h2 style={{ fontSize: "22px", color: "#38bdf8", marginTop: "40px", marginBottom: "20px" }}>1. 관리자(사령탑) 업무 가이드 및 사용법</h2>

          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "12px" }}>[1단계] 방문 명단 업로드 및 업무 지시 (방문 배정)</h3>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}><strong>목적:</strong> 엑셀 명단(체납자 방문 대상자 목록)을 업로드하여 현장에 지시를 내리고, 동시에 체납자 원장을 자동으로 구축함</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "16px", background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>방문 업무 단위(폴더) 생성 및 엑셀 업로드</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [방문 배정 관리]</span>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>- <strong>사용법:</strong> [새 방문 배정 생성] 버튼 클릭 ➔ 배정명(예: '6월 강남구 실태조사') 입력 ➔ 체납자 방문 대상자 목록(엑셀 명단) 파일 첨부 ➔ [저장] 클릭</span>
                <span style={{ color: "#64748b", fontSize: "14px" }}>* 설명: 엑셀을 업로드하는 이 작업 자체가 곧 실태확인원들에게 지시를 내리기 위한 '작업 폴더'를 생성하는 행위입니다.</span>
              </li>
              <li style={{ background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>담당자 할당(배정)</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [방문 배정 관리] 내 생성된 배정 상세 페이지</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 업로드되어 표시된 체납자 목록 중 배정할 사람의 체크박스 선택 ➔ 상단의 담당자 선택 드롭다운에서 '실태확인원 이름' 선택 ➔ [배정하기] 클릭 (배정 즉시 해당 직원의 모바일로 대상자 정보가 전송됨)</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "12px" }}>[2단계] 시스템 보안 및 인프라 구축 (※ 배정 전 필수 진행)</h3>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}><strong>목적:</strong> 시스템 보호 및 현장에 투입될 인력 세팅</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "16px", background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>실태확인원 등록</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [실태확인원 등록/관리]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> [실태확인원 등록] 버튼 클릭 ➔ 현장에 나갈 직원의 이름과 연락처 입력 후 저장 ➔ 등록된 인원 목록 확인</span>
              </li>
              <li style={{ background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>마스터 PIN 설정</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [핀번호생성관리]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 좌측 사이드바에서 메뉴 클릭 ➔ 6자리 보안 숫자 입력 ➔ [생성/저장] 버튼 클릭</span>
              </li>
              <li style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", padding: "16px", borderRadius: "8px", marginTop: "16px" }}>
                <strong style={{ color: "#f59e0b", display: "block", marginBottom: "8px" }}>🚨 앱 접속 안내 문자 발송 (관리자 필수 의무)</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [핀번호생성관리]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 핀 번호 생성 완료 후 화면 하단에 나타나는 <strong>[단체 문자(SMS) 보내기]</strong> 또는 <strong>[안내 문구 복사]</strong> 기능을 활용해 현장 요원들에게 <strong>앱 접속 주소(URL)와 마스터 PIN 번호를 반드시 전송</strong>해야 합니다. (안내 문자를 보내지 않으면 요원들이 업무 앱에 접속할 수 없습니다.)</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "12px" }}>[3단계] 체납자 원장 조회 및 집중 관리</h3>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}><strong>목적:</strong> 2단계에서 배정용 엑셀을 올릴 때 백그라운드에서 자동 누적된 통합 데이터베이스(원장)를 조회하고 관리함</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "16px", background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>원장 누적 및 업데이트 (시스템 자동)</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> 시스템 백그라운드 자동 처리</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>작동 원리:</strong> 별도 추가 작업 불필요. 2단계에서 엑셀을 올리면 시스템이 신규 체납자는 원장에 새로 추가하고, 기존 체납자는 최신 연락처/주소로 갱신하며, 새로운 세부 체납 내역은 이력에 개별 누적시킵니다.</span>
              </li>
              <li style={{ background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>원장 조회 및 집중관리대상 지정</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [체납자 원장]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 자연스럽게 누적된 전체 체납자 명단 검색 및 열람 ➔ 악성 체납자 체크 ➔ [집중관리 지정] 버튼을 눌러 다음 배정 시 우선 고려 대상으로 표시</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "48px" }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "12px" }}>[4단계] 실적 분석 및 최종 결과 추출</h3>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}><strong>목적:</strong> 현장의 진행 상황을 실시간 모니터링하고 엑셀로 최종 결과를 보고함</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "16px", background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>실시간 관제</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [대시보드 홈] & [실적 및 분석 통계]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 로그인 첫 화면(대시보드)에서 전체 업무 진행률, 체납 회수 실적, 실태확인원들의 동선 현황(지도) 등을 실시간 그래프로 확인.</span>
              </li>
              <li style={{ background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>결과 추출 및 보고</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [방문 완료 보고서]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 현장 방문이 완료된 건들을 날짜/담당자별로 조회 ➔ 우측 상단의 [엑셀 다운로드] 버튼 클릭 ➔ 상위 기관(국세청 등) 제출용 파일 획득</span>
              </li>
            </ul>
          </div>

          <h2 style={{ fontSize: "22px", color: "#10b981", borderTop: "2px solid #334155", paddingTop: "32px", marginBottom: "20px" }}>2. 실태확인원(현장 요원) 업무 가이드 및 사용법</h2>

          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "12px" }}>[현장 업무 1] 앱 접속 및 안전/보안 가이드 수료 (★필수 의무)</h3>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}><strong>목적:</strong> 현장 투입 전 필수 안전 수칙 및 법적 보안 규정 숙지</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "#10b981", display: "block", marginBottom: "8px" }}>초기 접속 및 가이드 숙지 체크</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [로그인 ➔ 업무 전 가이드 페이지]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 관리자에게 받은 문자의 링크로 앱에 접속하여 전화번호와 PIN 번호로 로그인합니다. 로그인 직후 나타나는 <strong>가이드 및 보안 규정을 끝까지 읽고 하단의 '숙지 확인' 체크박스를 눌러 수료</strong>를 완료해야만 방문 업무 앱을 사용할 수 있습니다.</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "12px" }}>[현장 업무 2] 방문 배정 내역 확인 및 동선 파악</h3>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}><strong>목적:</strong> 관리자가 자신에게 지시한 오늘의 방문 대상자 정보 획득</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>로그인 및 업무 확인</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [스마트폰 모바일 앱 - 로그인 / 내 배정 목록]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 스마트폰으로 앱 접속 ➔ 관리자가 사전 등록해 둔 본인의 '전화번호'와 '마스터 PIN' 입력 ➔ 홈 화면에서 [나의 방문 배정 목록] 클릭하여 오늘의 타겟(이름, 주소, 연락처) 확인</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "12px" }}>[현장 업무 3] 현장 실태 파악 및 결과 보고</h3>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}><strong>목적:</strong> 체납자 거주지 방문 결과를 시스템에 기록 (이 기록은 체납자 원장 이력으로 영구 연동됨)</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ background: "#0f172a", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "white", display: "block", marginBottom: "8px" }}>현장 보고서 작성</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [스마트폰 모바일 앱 - 대상자 상세 / 현장 보고서 작성]</span>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "8px" }}>- <strong>사용법:</strong></span>
                <ol style={{ color: "#94a3b8", margin: 0, paddingLeft: "20px" }}>
                  <li style={{ marginBottom: "4px" }}>방문 대상자 이름을 터치하여 상세 진입</li>
                  <li style={{ marginBottom: "4px" }}>[현장 사진 촬영] 버튼을 눌러 증빙 사진 업로드</li>
                  <li style={{ marginBottom: "4px" }}>실태 파악 결과(부재중, 거주지 불명, 납부 약속 등) 선택</li>
                  <li style={{ marginBottom: "4px" }}>체납자와의 상세 상담 메모 입력</li>
                  <li>[보고서 제출 및 완료] 버튼 터치 (제출된 내용은 즉시 관리자 대시보드와 체납자 원장 히스토리에 반영됩니다)</li>
                </ol>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "12px" }}>[현장 업무 4] 하루 일과 종료 (★보안 필수)</h3>
            <p style={{ color: "#94a3b8", marginBottom: "16px" }}><strong>목적:</strong> 불필요한 백그라운드 구동 방지 및 민감한 데이터 보안 강화</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", padding: "16px", borderRadius: "8px" }}>
                <strong style={{ color: "#ef4444", display: "block", marginBottom: "8px" }}>일과 종료 및 접속 해제(로그아웃) 의무</strong>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>- <strong>메뉴:</strong> [스마트폰 모바일 앱 - 하루 일과 종료 버튼]</span>
                <span style={{ color: "#94a3b8", display: "block" }}>- <strong>사용법:</strong> 당일 할당된 방문/보고 업무가 모두 끝나면 반드시 화면의 <strong>[하루 일과 종료]</strong> 버튼을 눌러 앱 접속을 해제해야 합니다. 이를 지키지 않고 앱을 켜두면 백그라운드에서 시스템 자원이 지속적으로 소모될 수 있습니다. 무엇보다 이는 휴대폰 분실 시 개인정보 유출 등 중대한 보안 사고예방을 위한 필수 조치입니다. (※ 일과 종료 후에도 필요시 언제든 동일한 PIN으로 다시 로그인하여 접속할 수 있습니다.)</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
