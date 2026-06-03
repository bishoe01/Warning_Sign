import { API_BASE_URL } from '@/constants/config';
import type { AnalysisResult, Language } from '@/data/sampleAnalysis';

const HEALTH_TIMEOUT_MS = 6000;
const ANALYZE_TIMEOUT_MS = 65000;

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function assertBackendReachable(): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/health`,
    { method: 'GET', headers: { Accept: 'application/json' } },
    HEALTH_TIMEOUT_MS,
  );
  if (!res.ok) {
    throw new Error(`backend health check failed: ${res.status}`);
  }
}

// 선택한 이미지를 백엔드로 업로드하고 분석 결과를 받는다.
// 실패하면 throw 하고, 호출하는 쪽(loading 화면)에서 더미 결과 대신 오류를 보여준다.
export async function analyzeContract(
  imageUris: string[],
  language: Language,
): Promise<AnalysisResult> {
  await assertBackendReachable();

  const form = new FormData();
  form.append('language', language);
  imageUris.forEach((uri, i) => {
    form.append('files', {
      uri,
      name: `page-${i + 1}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  });

  const res = await fetchWithTimeout(
    `${API_BASE_URL}/analyze-contract`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form,
    },
    ANALYZE_TIMEOUT_MS,
  );
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = typeof body.detail === 'string' ? `: ${body.detail}` : '';
    } catch {
      detail = '';
    }
    throw new Error(`server responded ${res.status}${detail}`);
  }
  return (await res.json()) as AnalysisResult;
}
