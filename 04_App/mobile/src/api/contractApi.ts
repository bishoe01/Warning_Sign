import { API_BASE_URL } from '@/constants/config';
import type { AnalysisResult, Language } from '@/data/sampleAnalysis';

// 선택한 이미지를 백엔드로 업로드하고 분석 결과를 받는다.
// 실패하면 throw 하고, 호출하는 쪽(loading 화면)에서 로컬 샘플로 폴백한다.
export async function analyzeContract(
  imageUri: string,
  language: Language,
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append('language', language);
  // React Native 의 FormData 파일 파트 형식
  form.append('file', {
    uri: imageUri,
    name: 'contract.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/analyze-contract`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`server responded ${res.status}`);
  }
  return (await res.json()) as AnalysisResult;
}
