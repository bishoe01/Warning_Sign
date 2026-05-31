// 앱 전역 디자인 토큰. 색/간격/라운드/그림자/타이포를 한곳에서 관리한다.
// 톤: Toss 스타일(넓은 여백 · 큰 볼드 타이포 · 단색 베이스 + 포인트 컬러 하나).
// 색상 팔레트는 03_Working/2026-06-01_UI리디자인_결정.md 기준. (최종 색은 추후 조정 TODO)
import { Platform, type ViewStyle } from 'react-native';

import type { CautionLevel } from '@/data/sampleAnalysis';

export const colors = {
  // 포인트 컬러 (토스블루 계열)
  primary: '#3182F6',
  primaryPressed: '#1B64DA',
  primarySoft: '#E7F1FF',

  // 텍스트 (토스 그레이스케일)
  text: '#191F28',
  textSecondary: '#4E5968',
  textTertiary: '#8B95A1',

  // 배경 / 표면
  bg: '#F2F4F6',
  bgElevated: '#F9FAFB',
  surface: '#FFFFFF',
  white: '#FFFFFF',

  // 경계선
  border: '#E5E8EB',
  borderStrong: '#D1D6DB',

  // 카메라(다크) 화면
  cameraBg: '#0B1118',
  cameraSurface: '#1B2B3A',
  cameraField: '#10202D',
  cameraTextDim: '#C9D2DC',
} as const;

// 확인 필요 조항 레벨별 색 (check=빨강 / review=주황 / info=파랑)
export const levelColors: Record<CautionLevel, { fg: string; bg: string }> = {
  check: { fg: '#E03131', bg: '#FEECEC' },
  review: { fg: '#E8590C', bg: '#FFF4E6' },
  info: { fg: '#3182F6', bg: '#E7F1FF' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const shadow: Record<'card' | 'button' | 'float', ViewStyle> = {
  card: Platform.select({
    ios: { shadowColor: '#101828', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  button: Platform.select({
    ios: { shadowColor: colors.primary, shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  float: Platform.select({
    ios: { shadowColor: '#101828', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
};
