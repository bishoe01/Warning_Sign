// 화면 간 임시 전달용(영속화 아님 — 그건 historyStore).
import { sampleAnalysis, type AnalysisResult } from '@/data/sampleAnalysis';

let pendingImages: string[] = [];
let lastResult: AnalysisResult = sampleAnalysis;

export const session = {
  setImages(uris: string[]) { pendingImages = uris; },
  getImages(): string[] { return pendingImages; },
  setResult(result: AnalysisResult) { lastResult = result; },
  getResult(): AnalysisResult { return lastResult; },
};
