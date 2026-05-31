// 결과 화면 UI 라벨 (언어 탭으로 전환). 요약 값 자체는 계약서의 실제 한국어 값이라 번역하지 않는다.
import type { CautionLevel, Language } from '@/data/sampleAnalysis';

export type LabelSet = {
  summaryTitle: string;
  cautionTitle: string;
  fields: {
    salary: string;
    workHours: string;
    holiday: string;
    contractPeriod: string;
    deduction: string;
  };
  levels: Record<CautionLevel, string>;
  original: string;
  noticeLabel: string;
};

export const labels: Record<Language, LabelSet> = {
  ko: {
    summaryTitle: '핵심 근로조건',
    cautionTitle: '확인이 필요한 조항',
    fields: {
      salary: '임금',
      workHours: '근무시간',
      holiday: '휴일',
      contractPeriod: '계약기간',
      deduction: '공제',
    },
    levels: { check: '확인 필요', review: '검토 권장', info: '참고' },
    original: '계약서 원문',
    noticeLabel: '참고 안내',
  },
  en: {
    summaryTitle: 'Key working conditions',
    cautionTitle: 'Clauses to check',
    fields: {
      salary: 'Wage',
      workHours: 'Work hours',
      holiday: 'Holiday',
      contractPeriod: 'Contract period',
      deduction: 'Deductions',
    },
    levels: { check: 'Please check', review: 'Review advised', info: 'For info' },
    original: 'Original text',
    noticeLabel: 'Notice',
  },
  vi: {
    summaryTitle: 'Điều kiện làm việc chính',
    cautionTitle: 'Điều khoản cần kiểm tra',
    fields: {
      salary: 'Tiền lương',
      workHours: 'Giờ làm việc',
      holiday: 'Ngày nghỉ',
      contractPeriod: 'Thời hạn hợp đồng',
      deduction: 'Khoản khấu trừ',
    },
    levels: { check: 'Cần kiểm tra', review: 'Nên xem lại', info: 'Thông tin' },
    original: 'Văn bản gốc',
    noticeLabel: 'Lưu ý',
  },
};
