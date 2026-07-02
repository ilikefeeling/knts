import React from "react";

export default function SecurityDocModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: "white", padding: "30px", borderRadius: "12px",
        maxWidth: "800px", width: "100%", maxHeight: "90vh", overflowY: "auto",
        lineHeight: "1.6", color: "#333", boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "2px solid #1e293b", paddingBottom: "10px" }}>
          <div>
            <h2 style={{ margin: 0, color: "#1e293b", fontSize: "22px" }}>KNTS Enterprise Control Tower 보안 아키텍처 명세서</h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontWeight: "bold" }}>부제: 종단간 암호화(E2EE) 및 이중 접근 통제 기반의 개인정보 보호 방안</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
        </div>

        <section style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>1. 개요</h3>
          <p style={{ margin: 0 }}>
            본 문서는 현장 체납 조사 및 행정 지원 업무를 수행하는 보조원 시스템의 보안 안정성을 증명하기 위해 작성되었습니다. 공공 데이터(시민의 개인정보, 체납 내역 등)가 외부망을 통해 모바일 기기로 전달되는 과정에서 발생할 수 있는 데이터 유출 위험을 원천적으로 차단하는 <strong>Zero-Trust 기반의 설계 원칙</strong>을 설명합니다.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>2. 핵심 보안 기술: 종단간 암호화 (E2EE)</h3>
          <p style={{ margin: "0 0 8px" }}>가장 핵심적인 보안 장치는 <strong>종단간 암호화(End-to-End Encryption)</strong>입니다.</p>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}><strong>서버 통제 불가 원칙:</strong> 엑셀로 업로드된 모든 민감한 데이터(이름, 주소, 전화번호 등)는 관리자의 PC에서 '마스터 PIN'을 통해 즉시 암호화(AES-256 등)된 후 서버로 전송됩니다.</li>
            <li><strong>데이터베이스 유출 무력화:</strong> 클라우드 서버(DB)에는 복호화가 불가능한 난수 문자열(예: <code>U2FsdGVkX1...</code>) 형태로만 저장됩니다. 따라서 해커가 서버를 직접 해킹하거나 내부 개발자가 데이터베이스를 탈취하더라도 시민의 개인정보는 절대 읽을 수 없습니다.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>3. 이중 잠금(Dual-Layer) 기반의 접근 통제</h3>
          <p style={{ margin: "0 0 12px" }}>데이터에 접근하기 위해서는 반드시 두 가지 관문을 모두 통과해야만 하는 <strong>이중 잠금 구조</strong>를 채택했습니다.</p>
          
          <h4 style={{ color: "#334155", margin: "0 0 8px" }}>[제 1관문] 시스템 접근 권한 (RLS 기반 데이터 필터링)</h4>
          <ul style={{ margin: "0 0 16px", paddingLeft: "20px" }}>
            <li style={{ marginBottom: "4px" }}>관리자에 의해 공식적으로 시스템에 등록되고, 활성화된 상태의 '보조원 계정'으로 정상 로그인해야 합니다.</li>
            <li><strong>RLS(Row Level Security) 적용:</strong> 데이터베이스 자체 보안 정책에 따라, 보조원이 시스템에 로그인하더라도 <strong>'자신에게 명시적으로 배정된 대상자'</strong>의 암호화된 데이터만 서버로부터 다운로드할 수 있습니다. 전체 누적 원장에 대한 접근은 데이터베이스 단에서 물리적으로 차단됩니다.</li>
          </ul>

          <h4 style={{ color: "#334155", margin: "0 0 8px" }}>[제 2관문] 마스터 PIN을 통한 클라이언트 해독</h4>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li>서버에서 본인의 업무 데이터를 다운로드 받았더라도, 화면에 한글로 표시(해독)하기 위해서는 관리자가 부여한 <strong>'마스터 암호화 PIN'</strong>을 기기에 입력해야만 합니다.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>4. 마스터 PIN 로테이션 및 무결성 검증 아키텍처</h3>
          <p style={{ margin: "0 0 8px" }}>초기 고정형 시스템을 고도화하여, 주기적인 보안 갱신과 시스템 무결성을 보장하는 <strong>PIN 로테이션 및 재암호화 아키텍처</strong>를 도입했습니다.</p>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}><strong>브라우저단 완전 재암호화 (Re-encryption):</strong> 관리자가 새로운 마스터 PIN으로 변경할 경우, 서버가 아닌 관리자의 브라우저 내에서 기존 데이터를 모두 복호화한 후 새 PIN으로 다시 암호화하여 서버에 덮어씌웁니다. 서버는 여전히 암호키를 알지 못하는 Zero-Knowledge 원칙을 철저히 유지합니다.</li>
            <li style={{ marginBottom: "8px" }}><strong>단방향 해시를 통한 입력 무결성 검증:</strong> 마스터 PIN 자체는 서버에 저장되지 않지만, PIN의 <strong>SHA-256 단방향 해시값</strong>을 보관합니다. 보조원 기기에서 PIN을 입력하는 즉시 서버의 해시값과 비교하여 오입력을 원천 차단함으로써, 데이터가 외계어로 깨져 보이거나 잘못된 암호문이 저장되는 데이터 오염 사고를 완벽히 방지합니다.</li>
            <li><strong>안전한 PIN 생성 규칙 (Anti-Pattern):</strong> 111111, 123456과 같은 연속되거나 반복되는 유추하기 쉬운 숫자 배열의 사용을 알고리즘으로 차단하여 암호화의 복잡성을 최소한으로 보장합니다.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>5. 기기 내 데이터 파기 원칙 (Zero-Data) 및 분실 대응</h3>
          <p style={{ margin: "0 0 8px" }}>공공 현장 업무에서 가장 빈번하게 발생하는 기기 분실 및 퇴사 위협에 대한 완벽한 대응 시나리오를 갖추고 있습니다.</p>
          <ol style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={{ marginBottom: "8px" }}><strong>업무 종료 시 데이터 즉시 잠금 (Zero-Data):</strong> 보조원이 업무를 마치고 홈 화면의 <strong>'업무 종료 (데이터 잠금)'</strong> 버튼을 누르면 기기(브라우저 메모리)에 저장된 마스터 PIN이 즉시 영구 삭제됩니다. 이 순간 기기 내 모든 현장 데이터는 다시 해독 불가 상태(암호문)로 전환되어 기기를 분실하더라도 정보 유출을 원천 차단합니다.</li>
            <li style={{ marginBottom: "8px" }}><strong>보조원 기기 분실(미잠금) 및 퇴사 시:</strong> 만약 보조원이 '업무 종료'를 누르지 않고 기기를 분실했거나 퇴사한 경우, 관리자가 즉시 해당 계정을 '비활성화' 처리합니다. 계정이 비활성화되면 제 1관문(접근 권한)이 닫혀 누군가 폰을 열어보더라도 서버에서 어떠한 새로운 데이터도 다운로드할 수 없으며, 앱 연결 시 기존 화면도 접근이 차단됩니다.</li>
          </ol>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginBottom: "12px" }}>6. 결론</h3>
          <p style={{ margin: 0, background: "#f8fafc", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
            본 시스템은 공공 데이터의 민감성을 최우선으로 고려하여, <strong>"서버 관리자조차 데이터를 볼 수 없는 구조(E2EE)"</strong>와 <strong>"엄격한 권한 분리를 통한 최소 권한 부여(RLS)"</strong> 원칙을 엄격하게 준수하여 설계되었습니다. 이를 통해 공무원(관리자)은 보안 사고의 위험 부담 없이, 안전하고 효율적으로 현장 업무를 지휘 및 통제할 수 있습니다.
          </p>
        </section>

        <div style={{ textAlign: "right", marginTop: "30px" }}>
          <button 
            onClick={onClose}
            style={{ padding: "10px 24px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            확인 (닫기)
          </button>
        </div>
      </div>
    </div>
  );
}
