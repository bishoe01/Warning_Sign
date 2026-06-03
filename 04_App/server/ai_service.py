"""AI 분석. OpenAI Chat Completions(JSON 모드)로 OCR 텍스트를 구조화한다."""
import json

import config
from models import AiAnalysis, AnalysisResult
from sample import SAMPLE_RESULT

SYSTEM_PROMPT = (
    "너는 외국인 근로자를 돕는 근로계약서 설명 도우미다. "
    "법률을 확정 판단하지 않고, 사용자가 이해하고 스스로 확인할 수 있도록 돕는다. "
    "계약서에 실제로 적힌 값과 빈 양식의 라벨/단위/괄호를 엄격히 구분한다. "
    "공인노무사가 계약서를 검토할 때 쓰는 체크리스트처럼 빠진 항목, 비정상 값, 사용자에게 불리할 수 있는 조항을 꼼꼼히 짚는다."
)

LANGUAGE_NAMES = {
    "ko": "Korean",
    "en": "English",
    "ne": "Nepali",
    "tet": "Tetum",
    "ru": "Russian",
    "mn": "Mongolian",
    "my": "Burmese",
    "bn": "Bengali",
    "vi": "Vietnamese",
    "uz": "Uzbek",
    "id": "Indonesian",
    "zh": "Chinese",
    "km": "Khmer",
    "ky": "Kyrgyz",
    "th": "Thai",
    "lo": "Lao",
}

def _response_languages(language: str) -> list[str]:
    langs = ["ko", "en"]
    if language not in langs:
        langs.append(language)
    return langs


def _localized_shape(languages: list[str]) -> str:
    return "{" + ", ".join(f'"{lang}": ""' for lang in languages) + "}"


def _build_user_prompt(ocr_text: str, language: str) -> str:
    response_languages = _response_languages(language)
    language_desc = ", ".join(f"{lang}({LANGUAGE_NAMES.get(lang, lang)})" for lang in response_languages)
    localized = _localized_shape(response_languages)
    return f"""아래 OCR 텍스트는 한국어 근로계약서에서 추출한 내용이다.

해야 할 일:
1. summary 에 임금(salary), 근무시간(workHours), 휴일(holiday), 계약기간(contractPeriod), 공제(deduction)를 추출한다.
2. summary 의 각 값은 localized object 로 작성한다. 응답 언어는 {language_desc} 이다.
3. 확인이 필요한 조항을 cautionItems 배열로 만든다. 각 항목: level(check|review|info), title(localized object), originalText(한국어 원문), explanation(localized object).
4. explanation 은 쉬운 문장으로 쓴다. "위험/불법/무효/확정" 같은 단정 표현은 금지하고, "확인이 필요합니다 / 상담을 권장합니다" 톤으로 쓴다.
5. notice 에 "법률 자문이 아니라 참고용 안내" 라는 의미의 문구를 localized object 로 넣는다.
6. 반드시 아래 JSON 형식으로만 응답한다. ocrText 는 넣지 않는다.

노무사식 체크리스트:
- 필수 기재 확인: 근로계약기간, 근무장소, 업무내용, 근로시간, 휴게시간, 휴일, 임금, 임금지급일, 지급방법, 숙식 제공/공제 여부가 빠졌는지 본다.
- 임금 확인: 금액이 너무 낮아 보이거나, 기본급/수당/상여/수습기간 임금이 서로 모순되거나, 임금 항목이 비어 있으면 표시한다.
- 근로시간 확인: 24시간제에서 불가능한 시간(예: 100시), 시작/종료 시간이 뒤섞인 값, 휴게시간 누락, 연장근로가 있는데 수당 설명이 없는 경우를 표시한다.
- 휴일/휴게 확인: 주휴일, 공휴일 유급/무급, 휴게시간이 비어 있거나 매우 짧아 보이거나 사용자가 이해하기 어렵게 적힌 경우를 표시한다.
- 공제/숙식비 확인: 숙식비, 기숙사비, 식비, 교육비, 기타 공제가 있는 경우 금액과 동의 여부를 확인 항목으로 표시한다. 특히 월 단위 공제 금액이 적혀 있으면 빠뜨리지 말고 cautionItems 에 넣는다.
- 불리할 수 있는 조항 확인: 퇴사 시 교육비/위약금 반환, 무단결근 벌금, 여권/통장/도장 보관, 연장·야간·휴일수당 미지급, 임의 공제, 과도한 손해배상 같은 문구를 표시한다.
- 출처 확인: 각 cautionItem 의 originalText 는 OCR 에 실제로 있는 문장을 짧게 인용한다. 사용자가 어디를 봐야 하는지 알 수 있어야 한다.
- 개수: 관련 항목이 여러 개면 2개로 줄이지 말고 최대 8개까지 중요한 순서로 낸다. 필수항목 미기재와 비정상 값은 check, 불리할 수 있는 조항은 check 또는 review, 단순 안내는 info 로 둔다.
- 반드시 별도 항목으로 내야 하는 것: 비정상 임금, 비정상 근로시간, 매우 짧은 휴게시간, 월 단위 숙식비/기숙사비/식비 공제, 퇴사 시 교육비/위약금 반환, 여권/통장/도장 보관, 연장·야간·휴일수당 미지급. 다른 큰 문제가 있어도 이 항목들을 합치거나 생략하지 않는다.

매우 중요한 추출 규칙:
- OCR 텍스트가 빈 표준근로계약서 양식이면, 양식의 라벨/단위/괄호를 실제 값처럼 쓰지 않는다.
- "월 통상임금( )원", "시 분 ~ 시 분", "년 월 일", "( )" 같은 빈칸 표현은 실제 값이 아니다.
- 실제로 채워진 숫자, 날짜, 사업장명, 성명, 금액, 체크 표시가 없으면 해당 summary 값은 "기재 없음"으로 쓴다.
- 하지만 괄호 안이나 빈칸 자리에 숫자/문자가 채워져 있으면, 그 값이 이상하더라도 "기재 없음"이라고 쓰지 않는다. 그 값을 그대로 summary 에 넣고 cautionItems 에 "비정상 값 확인 필요" 성격의 항목을 넣는다.
- 예: "월 통상임금(100)원"은 미기재가 아니라 "월 통상임금 100원"으로 기재된 것이다. 임금이 매우 낮아 보이므로 "임금 비정상 기재"로 확인 필요 표시한다.
- 예: "100시 35분 ~ 00시 30분"은 미기재가 아니라 비정상 근무시간 값이다. summary 에 해당 값을 넣고 "근무시간 비정상 기재"로 확인 필요 표시한다.
- 예: "2026년 13월 40일"처럼 불가능한 날짜도 미기재가 아니라 비정상 날짜 값이다.
- OCR 이 불명확해서 실제 값인지 확신할 수 없으면, OCR 에 보이는 값을 그대로 쓰되 "OCR 확인 필요"라고 표시한다. 값을 추측해서 정상값으로 고치지 않는다.
- 빈 양식에서 필수 항목이 채워지지 않았으면 cautionItems 에 "필수 항목 미기재" 성격의 항목을 넣는다.
- 빈 양식 자체를 분석한 경우, notice 에 "이 문서는 실제 계약값이 거의 기재되지 않은 양식으로 보입니다" 라는 의미를 포함한다.
- originalText 는 OCR 에 실제로 있는 한국어 원문을 짧게 인용한다. 원문이 없으면 빈칸/라벨 주변 문장을 인용한다.

JSON 형식:
{{"summary": {{"salary": {localized}, "workHours": {localized}, "holiday": {localized}, "contractPeriod": {localized}, "deduction": {localized}}}, "cautionItems": [{{"level": "check", "title": {localized}, "originalText": "", "explanation": {localized}}}], "notice": {localized}}}

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
                {"role": "user", "content": _build_user_prompt(ocr_text, language)},
            ],
        )
        content = completion.choices[0].message.content or "{}"
        ai = AiAnalysis(**json.loads(content))  # 스키마 검증
        return AnalysisResult(ocrText=ocr_text, **ai.model_dump())
    except Exception as exc:
        raise RuntimeError(f"AI analysis failed: {exc}") from exc
