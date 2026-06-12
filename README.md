# Field-Master (knts) - 1단계 MVP

국세외수입 체납관리단 실태확인원을 위한 방문 작업 관리 PWA, 1단계(안드로이드 Share Target 경로) 구현체입니다.

## 포함된 기능

1. **PWA 기본 골격**: `manifest.json`, `sw.js`, 홈화면 설치 안내(`InstallPrompt`)
2. **Android Share Target (POST)**: 클로바노트 등에서 "공유" → Field-Master 선택 시
   `/api/share-target`(POST)로 텍스트 수신 → 임시 저장 → `/share-receiver?id=...`로 이동
3. **공유 텍스트 임시 저장 API** (`/api/share`): iOS 단축어(2차) 연동 시 재사용 예정
   (POST로 텍스트 저장 → id 발급, GET으로 id 조회)
4. **3단계 화면** (`/share-receiver`):
   - 1단계: 공유받은 텍스트 확인
   - 2단계: 오늘 방문명단(현재는 샘플 데이터)에서 대상자 선택
   - 3단계: AI 자동분류(방문결과/특이사항) 결과 확인·수정 + "다시 분석"(1회 제한) + 원본 텍스트 보기 + 저장
5. **자동분류 API** (`/api/classify`): Anthropic API(Claude Haiku) 호출, 비용 최소화를 위해
   입력 4,000자 제한 / 출력 200토큰 제한

## 실행 방법

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속

## 환경변수

`.env.local` 파일 생성 후:

```
ANTHROPIC_API_KEY=sk-ant-...
```

(자동분류 기능에만 사용됩니다. 키가 없으면 `/api/classify`가 500 에러를 반환하지만,
사용자는 화면에서 직접 방문결과/특이사항을 입력할 수 있어 핵심 흐름은 동작합니다.)

## Android Share Target 실단말 테스트 방법

Web Share Target은 **HTTPS + PWA 설치(홈화면 추가)** 상태에서만 동작하므로,
로컬(`localhost`)이 아닌 **Vercel 등에 배포 후** 갤럭시 단말에서 아래 순서로 확인합니다.

1. 배포 URL을 크롬으로 접속 → "홈 화면에 추가"
2. 클로바노트 앱에서 변환된 텍스트 화면 → "공유" 버튼
3. 공유 대상 목록에 "Field-Master"가 표시되는지 확인 → 선택
4. Field-Master가 실행되며 1단계 화면에 텍스트가 채워지는지 확인

> 참고: 앱마다 공유 데이터가 `text`/`title`/`url` 중 어느 필드로 오는지 다를 수 있어,
> `/api/share-target`은 세 필드를 모두 합쳐서 사용하도록 처리해두었습니다.
> 실제 클로바노트 테스트 후 필요 시 보정이 필요할 수 있습니다.

## iOS 단축어 안내

`/ios-guide` 페이지에 단축어 설정 방법을 단계별로 안내합니다. 단축어는
1) `/api/share`(POST)로 텍스트를 보내 id를 받고, 2) `/share-receiver?id=...`를
Safari로 열어 안드로이드와 동일한 화면 흐름을 사용합니다.

> 주의: `lib/constants.ts`의 `APP_URL`은 현재 `https://knts.vercel.app`로
> 임시 설정되어 있습니다. **실제 배포 도메인으로 반드시 교체**해야 안내 페이지의
> 주소가 정확하게 표시됩니다. 실제 아이폰에서 단축어를 만들어 테스트하기 전까지는
> 동작을 보장할 수 없으므로, 5번(안드로이드 검증)과 함께 6번도 실단말 테스트가
> 필요합니다.

## 다음 단계 (협의된 작업 분해 기준)

- [x] 1. PWA 매니페스트/서비스워커 + 설치 유도 화면
- [x] 2. `/share-receiver` 라우트 + 임시저장 API (POST→ID, GET 조회)
- [x] 3. 화면 1~3단계 + "다시 분석" 버튼
- [x] 4. LLM 자동분류 API 연동
- [ ] 5. 안드로이드 + 클로바노트 실단말 검증
- [x] 6. (2차) iOS 단축어 제작 + 설치 가이드 (`/ios-guide` 페이지)
- [ ] (별도) 1단계 엑셀 업로드 → 오늘의 방문명단을 실데이터로 연동 (`lib/constants.ts`의 `SAMPLE_VISITS` 교체)
- [ ] (별도) "저장하기" 결과를 실제 엑셀(`2.현장기록(작성)` 시트) 또는 DB와 연동

## 알려진 이슈

- 임시 저장소(`lib/shareStore.ts`)는 인메모리(Map) 방식이라 서버 재시작/다중 인스턴스
  환경에서는 데이터가 유지되지 않습니다. 운영 전환 시 Redis/Supabase 등으로 교체 필요.
- `npm audit` 기준 Next.js 14.2.x에 알려진 보안 권고가 다수 있습니다(주로 이미지 최적화,
  미들웨어, RSC 캐시 관련). 본 MVP는 해당 기능을 사용하지 않지만, 운영 배포 전
  Next.js 버전 업그레이드 검토를 권장합니다.
