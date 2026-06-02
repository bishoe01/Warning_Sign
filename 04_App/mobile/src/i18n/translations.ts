import type { CautionLevel } from '@/data/sampleAnalysis';
import type { AppLanguage } from '@/i18n/languages';

export type Translation = {
  common: {
    appName: string;
    cancel: string;
    delete: string;
    clearAll: string;
    settings: string;
    history: string;
    localOnly: string;
    legalNotice: string;
  };
  home: {
    headline: string;
    sub: string;
    start: string;
    recentTitle: string;
    viewAll: string;
    recentEmpty: string;
    recentRecord: string;
    pages: (count: number) => string;
    cautions: (count: number) => string;
  };
  select: {
    title: string;
    permissionTitle: string;
    permissionDesc: string;
    allowCamera: string;
    gallery: string;
    review: (count: number) => string;
    reviewHint: (count: number) => string;
    emptyHint: string;
    addedHint: (count: number) => string;
    tip: string;
    camera: string;
    cameraPermission: string;
    analyze: (count: number) => string;
  };
  loading: {
    upload: string;
    ocrSingle: string;
    ocrMulti: (count: number) => string;
    analyze: string;
    simplify: string;
  };
  result: {
    title: string;
    saved: string;
    summaryTitle: string;
    cautionTitle: string;
    original: string;
    noticeLabel: string;
    originalImages: (count: number) => string;
    deleteTitle: string;
    deleteMessage: string;
    sampleTitle: string;
    sampleDesc: string;
    fields: {
      salary: string;
      workHours: string;
      holiday: string;
      contractPeriod: string;
      deduction: string;
    };
    levels: Record<CautionLevel, string>;
  };
  history: {
    title: string;
    empty: string;
    start: string;
    privacy: string;
    clearTitle: string;
    clearMessage: string;
    sample: string;
    pages: (count: number) => string;
    cautions: (count: number) => string;
  };
  settings: {
    title: string;
    languageTitle: string;
    languageDesc: string;
    recordsTitle: string;
    recordsDesc: string;
    privacyTitle: string;
    privacyDesc: string;
    noticeTitle: string;
    noticeDesc: string;
  };
};

const en: Translation = {
  common: {
    appName: 'Contract Helper',
    cancel: 'Cancel',
    delete: 'Delete',
    clearAll: 'Delete all',
    settings: 'Settings',
    history: 'My records',
    localOnly: 'Saved only on this device',
    legalNotice: 'For reference only, not legal advice',
  },
  home: {
    headline: 'See key contract terms at a glance',
    sub: 'Check wages, work hours, holidays, and clauses that need attention.',
    start: 'Start contract analysis',
    recentTitle: 'Recent analysis',
    viewAll: 'View all',
    recentEmpty: 'Your saved analyses will appear here',
    recentRecord: 'Latest saved contract',
    pages: (count) => `${count} page${count === 1 ? '' : 's'}`,
    cautions: (count) => `${count} item${count === 1 ? '' : 's'} to check`,
  },
  select: {
    title: 'Capture contract',
    permissionTitle: 'Camera permission needed',
    permissionDesc: 'Allow camera access to photograph and analyze your contract.',
    allowCamera: 'Allow camera',
    gallery: 'Gallery',
    review: (count) => `Review ${count}`,
    reviewHint: (count) => `${count} page${count === 1 ? '' : 's'} · swipe to review`,
    emptyHint: 'Fit the contract inside the frame',
    addedHint: (count) => `${count} page${count === 1 ? '' : 's'} added · capture or review more`,
    tip: 'Keep the text clear and avoid shadows',
    camera: 'Camera',
    cameraPermission: 'Camera permission',
    analyze: (count) => `Analyze (${count} page${count === 1 ? '' : 's'})`,
  },
  loading: {
    upload: 'Uploading contract images.',
    ocrSingle: 'Reading the contract text with OCR.',
    ocrMulti: (count) => `Reading ${count} pages. This may take a little longer.`,
    analyze: 'AI is checking wage, work hours, and holiday terms.',
    simplify: 'Writing clauses that need attention in simple words.',
  },
  result: {
    title: 'Analysis result',
    saved: 'Saved on this device. You can reopen it from My records.',
    summaryTitle: 'Key working conditions',
    cautionTitle: 'Clauses to check',
    original: 'Original contract text',
    noticeLabel: 'Notice',
    originalImages: (count) => `Original contract images (${count})`,
    deleteTitle: 'Delete',
    deleteMessage: 'Delete this analysis record?',
    sampleTitle: 'Sample result',
    sampleDesc: 'The server request failed or sample mode was used. This is not the uploaded contract analysis.',
    fields: {
      salary: 'Wage',
      workHours: 'Work hours',
      holiday: 'Holiday',
      contractPeriod: 'Contract period',
      deduction: 'Deductions',
    },
    levels: { check: 'Please check', review: 'Review advised', info: 'For info' },
  },
  history: {
    title: 'My analysis records',
    empty: 'No saved analyses yet',
    start: 'Start contract analysis',
    privacy: 'These records are saved only on this device',
    clearTitle: 'Delete all',
    clearMessage: 'Delete all saved analysis records?',
    sample: 'Sample',
    pages: (count) => `${count} page${count === 1 ? '' : 's'}`,
    cautions: (count) => `${count} item${count === 1 ? '' : 's'} to check`,
  },
  settings: {
    title: 'My settings',
    languageTitle: 'Language',
    languageDesc: 'Choose the language used across the app and analysis results.',
    recordsTitle: 'My records',
    recordsDesc: 'Reopen saved contract analyses.',
    privacyTitle: 'Privacy',
    privacyDesc: 'Contract images and analysis records stay on this device.',
    noticeTitle: 'Reference only',
    noticeDesc: 'This service helps you understand a contract. It is not legal advice.',
  },
};

type SimpleCopy = {
  appName: string;
  cancel: string;
  delete: string;
  clearAll: string;
  settings: string;
  history: string;
  localOnly: string;
  legalNotice: string;
  headline: string;
  sub: string;
  start: string;
  recentTitle: string;
  viewAll: string;
  recentEmpty: string;
  recentRecord: string;
  pageWord: string;
  cautionWord: string;
  selectTitle: string;
  permissionTitle: string;
  permissionDesc: string;
  allowCamera: string;
  gallery: string;
  reviewWord: string;
  reviewHint: string;
  emptyHint: string;
  addedHint: string;
  tip: string;
  camera: string;
  cameraPermission: string;
  analyzeWord: string;
  upload: string;
  ocrSingle: string;
  ocrMulti: string;
  analyzeLoading: string;
  simplify: string;
  resultTitle: string;
  saved: string;
  summaryTitle: string;
  cautionTitle: string;
  original: string;
  noticeLabel: string;
  originalImages: string;
  deleteTitle: string;
  deleteMessage: string;
  sampleTitle: string;
  sampleDesc: string;
  salary: string;
  workHours: string;
  holiday: string;
  contractPeriod: string;
  deduction: string;
  check: string;
  review: string;
  info: string;
  historyTitle: string;
  historyEmpty: string;
  historyPrivacy: string;
  clearTitle: string;
  clearMessage: string;
  sample: string;
  languageTitle: string;
  languageDesc: string;
  recordsTitle: string;
  recordsDesc: string;
  privacyTitle: string;
  privacyDesc: string;
  noticeTitle: string;
  noticeDesc: string;
};

function makeSimple(c: SimpleCopy): Translation {
  return {
    common: {
      appName: c.appName,
      cancel: c.cancel,
      delete: c.delete,
      clearAll: c.clearAll,
      settings: c.settings,
      history: c.history,
      localOnly: c.localOnly,
      legalNotice: c.legalNotice,
    },
    home: {
      headline: c.headline,
      sub: c.sub,
      start: c.start,
      recentTitle: c.recentTitle,
      viewAll: c.viewAll,
      recentEmpty: c.recentEmpty,
      recentRecord: c.recentRecord,
      pages: (count) => `${count} ${c.pageWord}`,
      cautions: (count) => `${count} ${c.cautionWord}`,
    },
    select: {
      title: c.selectTitle,
      permissionTitle: c.permissionTitle,
      permissionDesc: c.permissionDesc,
      allowCamera: c.allowCamera,
      gallery: c.gallery,
      review: (count) => `${c.reviewWord} ${count}`,
      reviewHint: (count) => `${count} ${c.pageWord} · ${c.reviewHint}`,
      emptyHint: c.emptyHint,
      addedHint: (count) => `${count} ${c.pageWord} · ${c.addedHint}`,
      tip: c.tip,
      camera: c.camera,
      cameraPermission: c.cameraPermission,
      analyze: (count) => `${c.analyzeWord} (${count} ${c.pageWord})`,
    },
    loading: {
      upload: c.upload,
      ocrSingle: c.ocrSingle,
      ocrMulti: (count) => `${count} ${c.pageWord} ${c.ocrMulti}`,
      analyze: c.analyzeLoading,
      simplify: c.simplify,
    },
    result: {
      title: c.resultTitle,
      saved: c.saved,
      summaryTitle: c.summaryTitle,
      cautionTitle: c.cautionTitle,
      original: c.original,
      noticeLabel: c.noticeLabel,
      originalImages: (count) => `${c.originalImages} (${count})`,
      deleteTitle: c.deleteTitle,
      deleteMessage: c.deleteMessage,
      sampleTitle: c.sampleTitle,
      sampleDesc: c.sampleDesc,
      fields: {
        salary: c.salary,
        workHours: c.workHours,
        holiday: c.holiday,
        contractPeriod: c.contractPeriod,
        deduction: c.deduction,
      },
      levels: { check: c.check, review: c.review, info: c.info },
    },
    history: {
      title: c.historyTitle,
      empty: c.historyEmpty,
      start: c.start,
      privacy: c.historyPrivacy,
      clearTitle: c.clearTitle,
      clearMessage: c.clearMessage,
      sample: c.sample,
      pages: (count) => `${count} ${c.pageWord}`,
      cautions: (count) => `${count} ${c.cautionWord}`,
    },
    settings: {
      title: c.settings,
      languageTitle: c.languageTitle,
      languageDesc: c.languageDesc,
      recordsTitle: c.recordsTitle,
      recordsDesc: c.recordsDesc,
      privacyTitle: c.privacyTitle,
      privacyDesc: c.privacyDesc,
      noticeTitle: c.noticeTitle,
      noticeDesc: c.noticeDesc,
    },
  };
}

const vi = makeSimple({
  appName: 'Trợ lý hợp đồng lao động',
  cancel: 'Hủy',
  delete: 'Xóa',
  clearAll: 'Xóa tất cả',
  settings: 'Cài đặt của tôi',
  history: 'Hồ sơ của tôi',
  localOnly: 'Chỉ lưu trên thiết bị này',
  legalNotice: 'Chỉ để tham khảo, không phải tư vấn pháp lý',
  headline: 'Chụp hợp đồng\nxem nhanh điều kiện chính',
  sub: 'Kiểm tra lương, giờ làm, ngày nghỉ\nvà điều khoản cần chú ý.',
  start: 'Bắt đầu phân tích hợp đồng',
  recentTitle: 'Phân tích gần đây',
  viewAll: 'Xem tất cả',
  recentEmpty: 'Phân tích đã lưu sẽ hiện ở đây',
  recentRecord: 'Hợp đồng đã lưu gần nhất',
  pageWord: 'trang',
  cautionWord: 'mục cần kiểm tra',
  selectTitle: 'Chụp hợp đồng',
  permissionTitle: 'Cần quyền camera',
  permissionDesc: 'Cho phép camera để chụp và phân tích hợp đồng.',
  allowCamera: 'Cho phép camera',
  gallery: 'Thư viện',
  reviewWord: 'Xem lại',
  reviewHint: 'vuốt để xem lại',
  emptyHint: 'Đặt hợp đồng vừa khung',
  addedHint: 'chụp thêm hoặc xem lại',
  tip: 'Giữ chữ rõ và tránh bóng',
  camera: 'Chụp',
  cameraPermission: 'Quyền camera',
  analyzeWord: 'Phân tích',
  upload: 'Đang tải ảnh hợp đồng lên.',
  ocrSingle: 'Đang đọc chữ trong hợp đồng bằng OCR.',
  ocrMulti: 'đang được đọc. Có thể mất thêm chút thời gian.',
  analyzeLoading: 'AI đang kiểm tra lương, giờ làm và ngày nghỉ.',
  simplify: 'Đang viết điều khoản cần chú ý bằng lời dễ hiểu.',
  resultTitle: 'Kết quả phân tích',
  saved: 'Đã lưu trên thiết bị này. Bạn có thể mở lại trong Hồ sơ.',
  summaryTitle: 'Điều kiện làm việc chính',
  cautionTitle: 'Điều khoản cần kiểm tra',
  original: 'Văn bản gốc hợp đồng',
  noticeLabel: 'Lưu ý',
  originalImages: 'Ảnh hợp đồng gốc',
  deleteTitle: 'Xóa',
  deleteMessage: 'Xóa hồ sơ phân tích này?',
  sampleTitle: 'Kết quả mẫu',
  sampleDesc: 'Yêu cầu máy chủ thất bại hoặc chế độ mẫu được dùng. Đây không phải kết quả phân tích hợp đồng đã tải lên.',
  salary: 'Lương',
  workHours: 'Giờ làm',
  holiday: 'Ngày nghỉ',
  contractPeriod: 'Thời hạn hợp đồng',
  deduction: 'Khấu trừ',
  check: 'Cần kiểm tra',
  review: 'Nên xem lại',
  info: 'Thông tin',
  historyTitle: 'Hồ sơ phân tích của tôi',
  historyEmpty: 'Chưa có phân tích đã lưu',
  historyPrivacy: 'Các hồ sơ này chỉ lưu trên thiết bị này',
  clearTitle: 'Xóa tất cả',
  clearMessage: 'Xóa tất cả hồ sơ phân tích đã lưu?',
  sample: 'Mẫu',
  languageTitle: 'Ngôn ngữ',
  languageDesc: 'Chọn ngôn ngữ dùng cho toàn bộ ứng dụng và kết quả.',
  recordsTitle: 'Hồ sơ của tôi',
  recordsDesc: 'Mở lại các phân tích hợp đồng đã lưu.',
  privacyTitle: 'Quyền riêng tư',
  privacyDesc: 'Ảnh hợp đồng và hồ sơ phân tích ở lại trên thiết bị này.',
  noticeTitle: 'Chỉ tham khảo',
  noticeDesc: 'Dịch vụ này giúp hiểu hợp đồng và không phải tư vấn pháp lý.',
});

export const translations: Record<AppLanguage, Translation> = {
  ko: {
    common: {
      appName: '근로계약 도우미',
      cancel: '취소',
      delete: '삭제',
      clearAll: '전체 삭제',
      settings: '내 설정',
      history: '내 기록',
      localOnly: '이 기기에만 저장돼요',
      legalNotice: '법률 자문이 아닌 참고용 안내입니다',
    },
    home: {
      headline: '계약서 사진 한 장이면\n핵심 조건이 한눈에',
      sub: '임금·근무시간·휴일은 물론,\n놓치기 쉬운 위험 조항까지 쉽게 알려드려요',
      start: '계약서 분석 시작',
      recentTitle: '최근 분석',
      viewAll: '전체 보기',
      recentEmpty: '저장한 분석이 여기에 표시돼요',
      recentRecord: '최근 저장한 계약서',
      pages: (count) => `${count}장`,
      cautions: (count) => `확인 필요 ${count}개`,
    },
    select: {
      title: '계약서 촬영',
      permissionTitle: '카메라 권한이 필요해요',
      permissionDesc: '계약서를 촬영해 분석하려면 카메라 접근을 허용해 주세요.',
      allowCamera: '카메라 권한 허용',
      gallery: '갤러리',
      review: (count) => `검토 ${count}`,
      reviewHint: (count) => `${count}장 · 넘겨서 확인하세요`,
      emptyHint: '계약서를 네모 칸에 꽉 차게 맞춰 주세요',
      addedHint: (count) => `${count}장 추가됨 · 다음 장을 찍거나 검토하세요`,
      tip: '그림자 없이 글자가 또렷하게 나오도록 맞춰 주세요',
      camera: '촬영',
      cameraPermission: '촬영 권한',
      analyze: (count) => `분석하기 (${count}장)`,
    },
    loading: {
      upload: '계약서 이미지를 업로드하고 있어요.',
      ocrSingle: 'OCR로 계약서 문장을 읽고 있어요.',
      ocrMulti: (count) => `${count}장을 읽고 있어요. 장수가 많으면 조금 더 걸려요.`,
      analyze: 'AI가 임금·근무시간·휴일 조건을 분석하고 있어요.',
      simplify: '확인이 필요한 조항을 쉬운 문장으로 정리하고 있어요.',
    },
    result: {
      title: '분석 결과',
      saved: "이 기기에 저장됐어요 · 홈의 '내 기록'에서 다시 볼 수 있어요",
      summaryTitle: '핵심 근로조건',
      cautionTitle: '확인이 필요한 조항',
      original: '계약서 원문',
      noticeLabel: '참고 안내',
      originalImages: (count) => `계약서 원본 ${count}장`,
      deleteTitle: '삭제',
      deleteMessage: '이 분석 기록을 지울까요?',
      sampleTitle: '샘플 결과',
      sampleDesc: '서버 요청 실패 또는 샘플 모드로 표시된 결과입니다. 업로드한 계약서 분석 결과가 아닙니다.',
      fields: {
        salary: '임금',
        workHours: '근무시간',
        holiday: '휴일',
        contractPeriod: '계약기간',
        deduction: '공제',
      },
      levels: { check: '확인 필요', review: '검토 권장', info: '참고' },
    },
    history: {
      title: '내 분석 기록',
      empty: '아직 저장된 분석이 없어요',
      start: '계약서 분석 시작',
      privacy: '이 기록은 이 기기에만 저장돼요',
      clearTitle: '전체 삭제',
      clearMessage: '저장된 분석 기록을 모두 지울까요?',
      sample: '샘플',
      pages: (count) => `${count}장`,
      cautions: (count) => `주의 ${count}건`,
    },
    settings: {
      title: '내 설정',
      languageTitle: '언어',
      languageDesc: '앱 전체와 분석 결과에 사용할 언어를 선택하세요.',
      recordsTitle: '내 기록',
      recordsDesc: '저장한 계약서 분석을 다시 볼 수 있어요.',
      privacyTitle: '개인정보',
      privacyDesc: '계약서 이미지와 분석 기록은 이 기기에만 저장돼요.',
      noticeTitle: '참고용 안내',
      noticeDesc: '이 서비스는 계약 이해를 돕는 도구이며 법률 자문이 아닙니다.',
    },
  },
  en,
  ne: en,
  tet: en,
  ru: en,
  mn: en,
  my: en,
  bn: en,
  vi,
  uz: en,
  id: en,
  zh: en,
  km: en,
  ky: en,
  th: en,
  lo: en,
};
