// 화면 간에 선택한 이미지와 분석 결과를 주고받는 가벼운 세션 저장소.
// (MVP 범위라 전역 상태 라이브러리 없이 모듈 변수로 충분)
import { sampleAnalysis, type AnalysisResult } from '@/data/sampleAnalysis';

let pendingImageUri: string | null = null;
let lastResult: AnalysisResult = sampleAnalysis;

export const session = {
  setImage(uri: string) {
    pendingImageUri = uri;
  },
  getImage(): string | null {
    return pendingImageUri;
  },
  setResult(result: AnalysisResult) {
    lastResult = result;
  },
  getResult(): AnalysisResult {
    return lastResult;
  },
};
