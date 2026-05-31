"""AI 분석. OpenAI Chat Completions(JSON 모드)로 OCR 텍스트를 구조화한다.
키가 없거나 응답이 깨지면 샘플 결과로 폴백한다."""
import json

import config
from models import AiAnalysis, AnalysisResult
from sample import SAMPLE_RESULT

SYSTEM_PROMPT = (
    "너는 외국인 근로자를 돕는 근로계약서 설명 도우미다. "
    "법률을 확정 판단하지 않고, 사용자가 이해하고 스스로 확인할 수 있도록 돕는다."
)


def _build_user_prompt(ocr_text: str) -> str:
    return f"""아래 OCR 텍스트는 한국어 근로계약서에서 추출한 내용이다.

해야 할 일:
1. summary 에 임금(salary), 근무시간(workHours), 휴일(holiday), 계약기간(contractPeriod), 공제(deduction)를 한국어 값으로 추출한다.
2. 확인이 필요한 조항을 cautionItems 배열로 만든다. 각 항목: level(check|review|info), title, originalText, explanationKo, explanationEn, explanationVi.
3. explanation 은 쉬운 문장으로 쓴다. "위험/불법/무효/확정" 같은 단정 표현은 금지하고, "확인이 필요합니다 / 상담을 권장합니다" 톤으로 쓴다.
4. notice 에 "법률 자문이 아니라 참고용 안내" 라는 의미의 문구를 넣는다.
5. 반드시 아래 JSON 형식으로만 응답한다. ocrText 는 넣지 않는다.

JSON 형식:
{{"summary": {{"salary": "", "workHours": "", "holiday": "", "contractPeriod": "", "deduction": ""}}, "cautionItems": [{{"level": "check", "title": "", "originalText": "", "explanationKo": "", "explanationEn": "", "explanationVi": ""}}], "notice": ""}}

OCR 텍스트:
{ocr_text}
"""


def _sample_with_ocr(ocr_text: str) -> AnalysisResult:
    result = SAMPLE_RESULT.model_copy(deep=True)
    if ocr_text:
        result.ocrText = ocr_text
    return result


def analyze(ocr_text: str, language: str = "ko") -> AnalysisResult:
    """OCR 텍스트를 분석 결과 JSON 으로 변환한다."""
    if not config.USE_REAL_AI:
        return _sample_with_ocr(ocr_text)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=config.OPENAI_API_KEY)
        completion = client.chat.completions.create(
            model=config.OPENAI_MODEL,
            response_format={"type": "json_object"},
            temperature=0.2,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(ocr_text)},
            ],
        )
        content = completion.choices[0].message.content or "{}"
        ai = AiAnalysis(**json.loads(content))  # 스키마 검증
        return AnalysisResult(ocrText=ocr_text, **ai.model_dump())
    except Exception as exc:  # 깨진 JSON / 네트워크 / 키 오류 → 샘플 폴백
        print(f"[ai_service] real AI failed ({type(exc).__name__}), fallback to sample")
        return _sample_with_ocr(ocr_text)
