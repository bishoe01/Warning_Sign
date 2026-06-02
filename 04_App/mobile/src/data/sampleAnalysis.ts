// 분석 결과 데이터 모델 (PRD 8절 응답 스키마 기준)
// idea_review 반영: riskItems/high 가 아니라 cautionItems + level(check|review|info) 사용

import type { AppLanguage } from '@/i18n/languages';
import type { LocalizedText } from '@/i18n/localized';

export type Language = AppLanguage;
export type CautionLevel = 'check' | 'review' | 'info';

export type Summary = {
  salary: LocalizedText;
  workHours: LocalizedText;
  holiday: LocalizedText;
  contractPeriod: LocalizedText;
  deduction: LocalizedText;
};

export type CautionItem = {
  level: CautionLevel;
  title: LocalizedText;
  originalText: string;
  explanation: LocalizedText;
};

export type AnalysisResult = {
  ocrText: string;
  summary: Summary;
  cautionItems: CautionItem[];
  notice: LocalizedText;
  isSample?: boolean;
};

// ⚠️ 데모용 샘플 데이터.
// TODO: 실제 표준근로계약서 출처를 확보하고, 사람이 검증한 정답 JSON으로 교체할 것.
//       서버 슬라이스에서는 이 값 대신 /analyze-contract 응답을 사용한다.
export const sampleAnalysis: AnalysisResult = {
  isSample: true,
  ocrText: [
    '표준근로계약서',
    '사업주(갑)와 근로자(을)는 다음과 같이 근로계약을 체결한다.',
    '1. 근로계약기간: 2026.06.01 ~ 2027.05.31 (수습기간 3개월)',
    '2. 근무장소: (주)한빛제조 김해공장',
    '3. 업무내용: 생산라인 보조',
    '4. 소정근로시간: 09:00 ~ 18:00 (휴게 12:00~13:00)',
    '5. 근무일/휴일: 주 5일 근무, 매주 일요일 휴무',
    '6. 임금: 월 2,060,740원 (기본급)',
    '7. 수습기간 중 임금: 수습기간(3개월) 동안 임금의 90%를 지급한다.',
    '8. 공제: 회사는 매월 임금에서 숙식비 200,000원을 공제한다.',
    '9. 연장근로: 업무상 필요 시 연장근로를 할 수 있다.',
    '10. 기타: 근로자가 1년 이내 퇴사할 경우 교육비 100만원을 반환한다.',
  ].join('\n'),
  summary: {
    salary: { ko: '월 2,060,740원 (기본급)', en: 'Monthly 2,060,740 KRW (base pay)' },
    workHours: { ko: '주 5일, 1일 8시간 (09:00~18:00, 휴게 1시간)', en: '5 days a week, 8 hours a day (09:00-18:00, 1 hour break)' },
    holiday: { ko: '매주 일요일 (주휴일)', en: 'Every Sunday (weekly holiday)' },
    contractPeriod: { ko: '2026.06.01 ~ 2027.05.31 (수습 3개월)', en: '2026.06.01 - 2027.05.31 (3-month probation)' },
    deduction: { ko: '숙식비 월 200,000원 공제', en: 'Monthly 200,000 KRW deduction for housing and meals' },
  },
  cautionItems: [
    {
      level: 'check',
      title: { ko: '퇴사 시 위약금 조항', en: 'Penalty clause for leaving work' },
      originalText: '근로자가 1년 이내 퇴사할 경우 교육비 100만원을 반환한다.',
      explanation: {
        ko: '정해진 기간 전에 일을 그만두면 돈을 내야 한다는 내용이에요. 이런 위약금 약정은 문제가 될 수 있으니, 서명 전에 꼭 확인하고 상담을 받아보세요.',
        en: 'This says you may have to pay money if you quit within a year. Penalty agreements like this can be a problem, so please check carefully and get advice before signing.',
      },
    },
    {
      level: 'review',
      title: { ko: '숙식비 공제', en: 'Housing and meal deduction' },
      originalText: '회사는 매월 임금에서 숙식비 200,000원을 공제한다.',
      explanation: {
        ko: '월급에서 숙소·식사 비용으로 매달 20만원을 빼요. 실제 제공되는 숙소·식사와 금액이 맞는지, 본인이 동의했는지 확인하세요.',
        en: '200,000 KRW is deducted from your monthly pay for housing and meals. Check whether the amount matches what is actually provided and whether you agreed to it.',
      },
    },
    {
      level: 'review',
      title: { ko: '수습기간 임금', en: 'Probation period wage' },
      originalText: '수습기간(3개월) 동안 임금의 90%를 지급한다.',
      explanation: {
        ko: '처음 3개월(수습) 동안에는 월급의 90%만 받아요. 수습기간 길이와 감액 비율이 맞는지 확인하세요.',
        en: 'During the first 3 months (probation), you receive only 90% of the wage. Check that the probation length and the reduced rate are correct.',
      },
    },
    {
      level: 'info',
      title: { ko: '연장근로 가능성', en: 'Possible overtime work' },
      originalText: '업무상 필요 시 연장근로를 할 수 있다.',
      explanation: {
        ko: '회사가 필요하면 추가 근무를 요청할 수 있다는 내용이에요. 연장근로를 하면 수당(통상임금의 1.5배)을 받는지 확인하세요.',
        en: 'The company may ask you to work overtime when needed. Make sure you receive overtime pay (1.5x your normal wage) for extra hours.',
      },
    },
  ],
  notice: {
    ko: '이 분석은 법률 자문이 아니라 참고용 안내입니다. 중요한 계약은 서명 전에 전문가 상담을 권장합니다.',
    en: 'This analysis is for reference only, not legal advice. For important contracts, getting professional advice before signing is recommended.',
  },
};
