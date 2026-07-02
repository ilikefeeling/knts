import React from "react";

type AdminGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminGuideModal({ isOpen, onClose }: AdminGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", padding: "32px", borderRadius: "16px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#1e293b", fontSize: "20px" }}>📖 관리자 가이드: Control Tower 사용법</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <section>
            <h3 style={{ fontSize: "16px", color: "#3b82f6", marginBottom: "8px" }}>1. 마스터 PIN 설정 및 보안 배포 (중요)</h3>
            <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.6" }}>
              최초 접속 시 설정한 <strong>6자리 마스터 PIN</strong>은 시스템 내 모든 개인정보를 암호화하고 복호화하는 유일한 열쇠입니다.<br/>
              사이드바의 <strong>[보안 관리 센터]</strong> 메뉴에서 <strong>일괄 문자(SMS) 배포 기능</strong>을 사용하여 보조원들에게 간편하게 PIN을 전송해 주세요. (해당 PIN을 모르면 보조원이 명단을 해독할 수 없습니다.)<br/>
              또한, 보안 강화를 위해 주기적으로 <strong>마스터 PIN 재설정 기능</strong>을 사용하여 전체 시스템의 암호키를 갱신(Re-encryption)할 수 있습니다.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: "16px", color: "#3b82f6", marginBottom: "8px" }}>2. 캠페인 및 배정 관리 (일괄 배정)</h3>
            <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.6" }}>
              사이드바의 <strong>[캠페인 및 배정 관리]</strong>에서 일일/주간 캠페인을 생성하고 엑셀 명단을 업로드할 수 있습니다.<br />
              이때, 업로드되는 데이터는 마스터 PIN을 통해 <strong>종단간 암호화(E2EE)</strong> 되어 안전하게 중앙 서버에 저장됩니다.<br />
              다수의 대상을 한 번에 배정하려면 <strong>&quot;📍 동선 기반 스마트 배정&quot;</strong> 버튼을 눌러 최적화된 일괄 배정을 진행하세요.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: "16px", color: "#3b82f6", marginBottom: "8px" }}>3. 대상자 원장 조회 및 집중관리(악성) 지정</h3>
            <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.6" }}>
              사이드바의 <strong>[캠페인 대상자 원장]</strong> 메뉴에서 전체 누적 대상자 풀(Pool)을 검색할 수 있습니다.<br />
              지속적인 납부 독촉이 필요한 악성 체납자의 경우 <strong>[🚨 선택 집중관리 지정]</strong> 버튼을 눌러 '집중관리대상'으로 분류하여 캠페인 배정 시 우선 타겟팅할 수 있습니다.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: "16px", color: "#3b82f6", marginBottom: "8px" }}>4. 종합 상황판 (긴급 알림 및 회수율)</h3>
            <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.6" }}>
              사이드바 메뉴의 <strong>[대시보드 홈]</strong>에서 총 체납액 대비 회수액의 <strong>회수율(Recovery Rate)</strong>을 한눈에 확인할 수 있습니다.<br />
              또한 방문 실패가 3회 이상이거나 악성 민원인 경우 <strong>긴급 대응반(SLA Alerts)</strong>에 표시되며, 즉시 보조원에게 푸시 알림을 발송할 수 있습니다.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: "16px", color: "#3b82f6", marginBottom: "8px" }}>5. 보조원 실적 통계 확인</h3>
            <p style={{ margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.6" }}>
              사이드바 메뉴의 <strong>[실적 및 분석 통계]</strong>로 이동하시면 보조원별 할당된 체납액과 실제 회수액, 회수율 통계를 확인할 수 있어 공정한 성과 평가가 가능합니다.
            </p>
          </section>
        </div>

        <button 
          onClick={onClose} 
          style={{ width: "100%", padding: "16px", background: "#0f172a", color: "white", borderRadius: "8px", border: "none", fontSize: "16px", fontWeight: "bold", marginTop: "32px", cursor: "pointer" }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
