# 2026-05-31 Phase 1 빌드 스펙: Expo 앱 골격 (샘플 모드)

> 상태: 진행 시작
> 기준 문서: `03_Working/PRD.md`, `03_Working/roadmap.md`(Phase 1), `01_Idea/2026-05-31_idea_review.md`(정답 JSON 우선 원칙)
> 슬라이스 범위: 이 문서는 "앱 골격 + 샘플 모드" 한 덩어리만 다룬다. 서버/OCR/AI는 다음 슬라이스.

## 목적

이미지를 실제로 분석하지 않고 **로컬 샘플 JSON을 결과로 렌더**해서, `홈 → 이미지 선택 → 분석 중 → 결과` 전체 UX 흐름을 폰에서 돌게 한다. 서버·API 키 불필요. 서버를 붙일 때 데이터 소스만 API 호출로 교체한다.

## 코드 위치

`04_App/mobile/` (계획 문서 01~03과 분리. 다음 슬라이스에서 `04_App/server/` 추가)

## 기술 선택

| 항목 | 선택 | 이유 |
|---|---|---|
| 네비게이션 | Expo Router (파일 기반) | idea_.md 18절 구조와 동일, Expo 기본값 |
| 언어 | TypeScript | 데이터 구조 명확화 |
| 스타일 | 순수 StyleSheet | 추가 의존성 없이 시작 (초보 팀) |
| 추가 패키지 | `expo-image-picker` | 갤러리 선택용 |
| 데이터 | 로컬 `data/sampleAnalysis.ts` | 서버 붙이면 이 부분만 교체 |

## 파일 구조

```
04_App/mobile/
  app/
    _layout.tsx     Stack 네비게이터
    index.tsx       홈
    select.tsx      이미지 선택 + 미리보기
    loading.tsx     단계 메시지 시뮬레이션 → result 이동
    result.tsx      결과(요약/주의조항/언어탭/고지)
  components/
    SummaryCard.tsx
    CautionCard.tsx
    LanguageTabs.tsx
  data/
    sampleAnalysis.ts   샘플 JSON + 타입
  constants/
    labels.ts           UI 라벨 ko/en/vi
```

## 데이터 모델 (PRD 8절 + idea_review 반영)

`cautionItems` / `level: check|review|info` 사용 (riskItems·high 아님).

```ts
type Level = "check" | "review" | "info";
type AnalysisResult = {
  ocrText: string;
  summary: { salary; workHours; holiday; contractPeriod; deduction };
  cautionItems: {
    level: Level; title; originalText;
    explanationKo; explanationEn; explanationVi;
  }[];
  notice: string;
};
```

언어탭(ko/en/vi)은 주의조항 설명과 UI 라벨을 전환. 샘플엔 3개 언어 모두 채워 데모 가능하게 한다.

## 화면 동작

- **index**: 서비스명 + "계약서 분석 시작" 버튼 → select
- **select**: `expo-image-picker` 갤러리 선택 + 미리보기 + "분석하기" → loading. (카메라는 P1, 이번 제외)
- **loading**: 4단계 메시지(업로드/OCR/AI/정리) 타이머로 순차 표시 → result. (실제 분석 아님, 샘플)
- **result**: SummaryCard + CautionCard 목록 + LanguageTabs(ko/en/vi) + notice 고지. 탭으로 설명 언어 전환.

## 빌드 순서 (= 실행 계획)

1. Expo 프로젝트 생성 (TS, expo-router) → verify: Expo Go/웹에서 첫 화면 실행
2. `data/sampleAnalysis.ts` 작성 (타입 + 데모 샘플) → verify: `tsc --noEmit` 통과
3. `index` 홈 화면 → verify: 시작 버튼, select 이동
4. `select` 이미지 선택 → verify: 갤러리 선택+미리보기, 분석하기로 loading 이동
5. `loading` 단계 시뮬레이션 → verify: 메시지 순차 표시 후 result 자동 이동
6. components 3종 + `result` → verify: 카드/탭/고지 표시, 언어 전환 동작
7. 전체 흐름 1회 통과 → verify: 아래 완료 기준 충족

## 완료 기준

- `npx expo start` → Expo Go(폰) 또는 웹에서 앱 실행
- 홈 → 이미지 선택+미리보기 → 분석 중(단계 메시지) → 결과 카드까지 끊김 없이 이동
- 결과에 요약/주의조항 카드 + ko/en/vi 탭 동작 + 법률자문아님 고지 표시
- 전부 로컬 샘플 기반, 서버/키 불필요

## 범위 밖 (이번 슬라이스 제외)

카메라 촬영(P1), 서버/업로드, 실제 OCR/AI, APK 빌드, 다국어 번역 품질 검수.

## 안전 / TODO

- 샘플 계약서·정답 JSON은 데모용. `TODO: 실제 표준근로계약서 출처 + 사람이 검증한 정답 JSON으로 교체`
- 결과 화면 `notice`(법률 자문 아님) 항상 노출
- "위험/불법/무효/확정" 단정 표현 금지, "확인 필요" 톤 유지
