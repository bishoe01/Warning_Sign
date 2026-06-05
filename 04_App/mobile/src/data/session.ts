// 화면 간 임시 전달용(영속화 아님 — 그건 historyStore).
import { sampleAnalysis, type AnalysisResult } from '@/data/sampleAnalysis';

let pendingImages: string[] = [];
let lastResult: AnalysisResult = sampleAnalysis;
let lastIsSample = true;
let lastError: string | null = null;

export const session = {
  setImages(uris: string[]) { pendingImages = uris; },
  getImages(): string[] { return pendingImages; },
  setResult(result: AnalysisResult, meta: { isSample?: boolean; error?: string | null } = {}) {
    lastResult = result;
    lastIsSample = meta.isSample ?? !!result.isSample;
    lastError = meta.error ?? null;
  },
  replaceResult(result: AnalysisResult) {
    lastResult = result;
    lastIsSample = lastIsSample || !!result.isSample;
  },
  getResult(): AnalysisResult { return lastResult; },
  getResultMeta() { return { isSample: lastIsSample, error: lastError }; },
};
