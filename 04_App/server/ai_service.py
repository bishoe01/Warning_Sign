"""AI 분석. OpenAI Chat Completions(JSON 모드)로 OCR 텍스트를 구조화한다."""
import json
from typing import Optional, Union

import config
from models import AiAnalysis, AnalysisResult, LocalizedAnalysisPatch
from sample import SAMPLE_RESULT
from source_matching import OcrRegion

SYSTEM_PROMPT = """너는 외국인 근로자를 돕는 근로계약서 설명 도우미다.

역할:
- 한국어 근로계약서를 읽고 사용자가 스스로 확인할 수 있게 돕는다.
- 법률 판단, 위법 여부, 계약 무효 여부를 확정하지 않는다.
- 표현은 "확인이 필요합니다", "서명 전에 다시 확인해 보세요", "상담을 권장합니다"처럼 안내형으로 쓴다.
- 계약서에 실제로 적힌 값과 빈 양식의 라벨/단위/괄호를 엄격히 구분한다.
- 공인노무사가 계약서를 검토할 때 쓰는 체크리스트처럼 빠진 항목, 비정상 값, 사용자에게 불리할 수 있는 조항을 꼼꼼히 짚는다."""

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


def _target_localized_shape(language: str) -> str:
    return "{" + f'"{language}": ""' + "}"


def _ocr_region_prompt(source_regions: Optional[list[OcrRegion]]) -> str:
    if not source_regions:
        return ""

    lines = []
    for region in source_regions:
        text = region.text.strip()
        if text:
            lines.append(f"[{region.id}] {text}")
    if not lines:
        return ""

    return "\n".join(lines)


def _build_user_prompt(ocr_text: str, language: str, source_regions: Optional[list[OcrRegion]] = None) -> str:
    response_languages = _response_languages(language)
    language_desc = ", ".join(f"{lang}({LANGUAGE_NAMES.get(lang, lang)})" for lang in response_languages)
    localized = _localized_shape(response_languages)
    source_region_text = _ocr_region_prompt(source_regions)
    source_region_instruction = ""
    if source_region_text:
        source_region_instruction = f"""

[OCR 줄 ID 목록]
아래 줄 ID는 사진 속 OCR 위치와 연결된다. 주의 조항을 만들 때 반드시 근거가 된 줄 ID를 sourceRegionIds 에 넣는다.
- sourceRegionIds 는 아래 목록에 있는 ID만 사용한다. 예: ["p1-r4"]
- 여러 줄을 근거로 쓰면 가까운 줄 ID를 1~3개 넣는다.
- originalText 는 선택한 줄의 한국어 OCR 원문 일부를 그대로 복사한다. 줄 ID 자체는 originalText 에 넣지 않는다.
- OCR 줄에 값이 빈칸처럼 보이면 그 빈칸 주변 줄 ID를 sourceRegionIds 에 넣는다.

{source_region_text}
"""
    return f"""아래 OCR 텍스트는 한국에서 사용하는 한국어 근로계약서에서 추출한 내용이다.

[출력 JSON 형식]
- 반드시 JSON 객체만 응답한다. Markdown, 설명 문장, ocrText 필드는 넣지 않는다.
- summary 에 임금(salary), 근무시간(workHours), 휴일(holiday), 계약기간(contractPeriod), 공제(deduction)를 추출한다.
- summary 의 각 값은 localized object 로 작성한다. 응답 언어는 {language_desc} 이다.
- 확인이 필요한 조항을 cautionItems 배열로 만든다.
- cautionItems 각 항목 형식: level(check|review|info), title(localized object), originalText(한국어 원문), sourceRegionIds(OCR 줄 ID 배열), explanation(localized object).
- notice 에 "법률 자문이 아니라 참고용 안내" 라는 의미와 OCR/원문 확인 필요성을 localized object 로 넣는다.

[설명 언어와 법률 기준 분리]
- 선택 언어는 설명 언어일 뿐, 적용 법률 국가를 바꾸는 기능이 아니다.
- 분석 기준은 한국에서 사용하는 한국어 근로계약서다.
- 다른 국가의 노동법 위반 여부를 판단하지 않는다.
- 베트남어, 네팔어, 태국어 등 다른 언어로 설명하더라도 베트남, 네팔, 태국 노동법 기준을 섞지 않는다.
- 다국어 설명은 한국어 원문과 한국 근로계약서 맥락을 쉽게 이해하도록 돕는 용도다.

[핵심 조건 추출 규칙]
- 계약서에 실제로 적힌 값만 summary 에 쓴다.
- 빈칸, 라벨, 단위, 예시 문구를 실제 값으로 채우지 않는다.
- OCR 이 불명확하면 보이는 값을 추측해서 고치지 말고 "OCR 확인 필요"라고 설명한다.
- 원문에 값이 없으면 "기재 없음"으로 쓴다.
- 원문에 값이 있으나 비정상으로 보이면 값을 그대로 쓰고 cautionItems 에 확인 항목을 만든다.

[주의 조항 체크리스트]
- 필수 기재 확인: 근로계약기간, 근무장소, 업무내용, 근로시간, 휴게시간, 휴일, 임금, 임금지급일, 지급방법, 숙식 제공/공제 여부가 빠졌는지 본다.
- 임금 확인: 금액이 너무 낮아 보이거나, 기본급/수당/상여/수습기간 임금이 서로 모순되거나, 임금 항목이 비어 있으면 표시한다.
- 근로시간 확인: 24시간제에서 불가능한 시간(예: 100시), 시작/종료 시간이 뒤섞인 값, 휴게시간 누락, 연장근로가 있는데 수당 설명이 없는 경우를 표시한다.
- 휴일/휴게 확인: 주휴일, 공휴일 유급/무급, 휴게시간이 비어 있거나 매우 짧아 보이거나 사용자가 이해하기 어렵게 적힌 경우를 표시한다.
- 공제/숙식비 확인: 숙식비, 기숙사비, 식비, 교육비, 기타 공제가 있는 경우 금액과 동의 여부를 확인 항목으로 표시한다. 특히 월 단위 공제 금액이 적혀 있으면 빠뜨리지 말고 cautionItems 에 넣는다.
- 불리할 수 있는 조항 확인: 퇴사 시 교육비/위약금 반환, 무단결근 벌금, 여권/통장/도장 보관, 연장·야간·휴일수당 미지급, 임의 공제, 과도한 손해배상 같은 문구를 표시한다.
- 출처 확인: 각 cautionItem 의 originalText 는 OCR 에 실제로 있는 문장을 짧게 인용한다. 사용자가 어디를 봐야 하는지 알 수 있어야 한다.
- 개수: 관련 항목이 여러 개면 2개로 줄이지 말고 최대 8개까지 중요한 순서로 낸다. 필수항목 미기재와 비정상 값은 check, 불리할 수 있는 조항은 check 또는 review, 단순 안내는 info 로 둔다.
- 반드시 별도 항목으로 내야 하는 것: 비정상 임금, 비정상 근로시간, 매우 짧은 휴게시간, 월 단위 숙식비/기숙사비/식비 공제, 퇴사 시 교육비/위약금 반환, 여권/통장/도장 보관, 연장·야간·휴일수당 미지급. 다른 큰 문제가 있어도 이 항목들을 합치거나 생략하지 않는다.

[빈 양식/비정상 값 판단 규칙]
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

[originalText 인용 규칙]
- originalText 는 OCR 에 실제로 있는 한국어 원문만 사용한다.
- AI 설명문, 번역문, 요약문을 originalText 에 넣지 않는다.
- 가능하면 15~80자 정도로 짧게 둔다.
- 너무 긴 조항은 핵심 phrase 를 인용한다.
- 원문이 깨졌으면 OCR 에 보이는 형태 그대로 인용하고 explanation 에 OCR 확인 필요를 말한다.
- 원문이 없거나 빈 양식의 필수 항목 미기재를 지적할 때는 빈칸/라벨 주변 문장을 OCR 에 보이는 그대로 인용한다.
- originalText 는 나중에 OCR bounding box 와 매칭할 기준이므로 반드시 OCR 텍스트 안에서 찾을 수 있어야 한다.
- sourceRegionIds 는 사진 하이라이트의 1차 근거다. 주의 항목마다 가능한 한 반드시 채운다.

[다국어 설명 규칙]
- ko, en, 요청 언어의 title/explanation/notice 를 모두 채운다.
- originalText 는 항상 한국어 OCR 원문으로 유지한다. originalText 를 번역하지 않는다.
- summary 값도 원문 값을 보존하되, 각 언어 설명에서 사용자가 이해하기 쉽게 풀어 쓴다.
- explanation 은 쉬운 문장으로 쓴다. "위험/불법/무효/확정" 같은 단정 표현은 금지하고, "확인이 필요합니다 / 상담을 권장합니다" 톤으로 쓴다.

JSON 형식:
{{"summary": {{"salary": {localized}, "workHours": {localized}, "holiday": {localized}, "contractPeriod": {localized}, "deduction": {localized}}}, "cautionItems": [{{"level": "check", "title": {localized}, "originalText": "", "sourceRegionIds": [], "explanation": {localized}}}], "notice": {localized}}}

{source_region_instruction}

OCR 텍스트:
{ocr_text}
"""


def _localization_source_payload(analysis: Union[AiAnalysis, AnalysisResult]) -> dict:
    return {
        "summary": analysis.summary.model_dump(),
        "cautionItems": [
            {
                "level": item.level,
                "title": item.title,
                "originalText": item.originalText,
                "explanation": item.explanation,
            }
            for item in analysis.cautionItems
        ],
        "notice": analysis.notice,
    }


def _build_localization_user_prompt(analysis: Union[AiAnalysis, AnalysisResult], target_language: str) -> str:
    language_name = LANGUAGE_NAMES.get(target_language, target_language)
    localized = _target_localized_shape(target_language)
    source_json = json.dumps(_localization_source_payload(analysis), ensure_ascii=False)
    item_count = len(analysis.cautionItems)
    return f"""아래는 이미 분석이 끝난 한국어 근로계약서 설명 결과다.

targetLanguage: {target_language} ({language_name})

[작업 범위]
- OCR, 근로조건 추출, 주의 조항 판단을 다시 하지 않는다.
- 기존 summary/cautionItems/notice 의 의미를 유지한다.
- target language 필드만 생성한다.
- ko/en/다른 언어 필드는 출력하지 않는다.
- originalText 는 한국어 OCR 원문이므로 번역하거나 출력하지 않는다.
- 숫자, 날짜, 시간, 금액, 회사명 같은 계약값은 바꾸지 않는다.
- 법률 판단, 위법 여부, 계약 무효 여부를 단정하지 않는다.
- 설명은 사용자가 한국어 근로계약서를 이해하도록 돕는 쉬운 문장으로 쓴다.

[출력 JSON 형식]
- 반드시 JSON 객체만 응답한다. Markdown 과 설명 문장은 넣지 않는다.
- localized object 는 반드시 {localized} 형식처럼 target language 필드만 포함한다.
- cautionItems 는 입력과 같은 개수({item_count}개), 같은 순서로 작성한다.
- cautionItems 각 항목은 title 과 explanation 만 포함한다.

JSON 형식:
{{"targetLanguage": "{target_language}", "summary": {{"salary": {localized}, "workHours": {localized}, "holiday": {localized}, "contractPeriod": {localized}, "deduction": {localized}}}, "cautionItems": [{{"title": {localized}, "explanation": {localized}}}], "notice": {localized}}}

기존 분석 결과:
{source_json}
"""


def _normalize_for_quote_match(text: str) -> str:
    return "".join(text.split())


def _quote_exists_in_ocr(quote: str, ocr_text: str) -> bool:
    if quote in ocr_text:
        return True
    normalized_quote = _normalize_for_quote_match(quote)
    normalized_ocr = _normalize_for_quote_match(ocr_text)
    return bool(normalized_quote) and normalized_quote in normalized_ocr


def _require_localized_keys(name: str, value: dict[str, str], required_languages: list[str]) -> None:
    missing = [lang for lang in required_languages if not value.get(lang)]
    if missing:
        raise ValueError(f"{name} missing localized keys: {', '.join(missing)}")


def _validate_ai_analysis_against_ocr(
    ai: AiAnalysis,
    ocr_text: str,
    required_languages: Optional[list[str]] = None,
    require_grounded_quotes: bool = True,
) -> None:
    """Validate AI output needed for source matching and language display."""
    languages = required_languages or []

    if languages:
        for field_name in ("salary", "workHours", "holiday", "contractPeriod", "deduction"):
            _require_localized_keys(f"summary.{field_name}", getattr(ai.summary, field_name), languages)
        _require_localized_keys("notice", ai.notice, languages)

    for index, item in enumerate(ai.cautionItems):
        quote = item.originalText.strip()
        if not quote:
            raise ValueError(f"cautionItems[{index}].originalText is empty")
        if require_grounded_quotes and not _quote_exists_in_ocr(quote, ocr_text):
            raise ValueError(f"cautionItems[{index}].originalText is not present in OCR text: {quote}")
        if languages:
            _require_localized_keys(f"cautionItems[{index}].title", item.title, languages)
            _require_localized_keys(f"cautionItems[{index}].explanation", item.explanation, languages)


def _validate_localization_patch(
    patch: LocalizedAnalysisPatch,
    target_language: str,
    expected_caution_count: int,
) -> None:
    if patch.targetLanguage != target_language:
        raise ValueError(f"targetLanguage mismatch: expected {target_language}, got {patch.targetLanguage}")
    for field_name in ("salary", "workHours", "holiday", "contractPeriod", "deduction"):
        _require_localized_keys(f"summary.{field_name}", getattr(patch.summary, field_name), [target_language])
    _require_localized_keys("notice", patch.notice, [target_language])
    if len(patch.cautionItems) != expected_caution_count:
        raise ValueError(
            f"cautionItems count mismatch: expected {expected_caution_count}, got {len(patch.cautionItems)}"
        )
    for index, item in enumerate(patch.cautionItems):
        _require_localized_keys(f"cautionItems[{index}].title", item.title, [target_language])
        _require_localized_keys(f"cautionItems[{index}].explanation", item.explanation, [target_language])


def _sample_with_ocr(ocr_text: str) -> AnalysisResult:
    result = SAMPLE_RESULT.model_copy(deep=True)
    if ocr_text:
        result.ocrText = ocr_text
    return result


def _pick_existing_text(value: dict[str, str], target_language: str) -> str:
    return value.get(target_language) or value.get("en") or value.get("ko") or ""


def _existing_localization_patch(
    analysis: AnalysisResult,
    target_language: str,
) -> LocalizedAnalysisPatch:
    def one(value: dict[str, str]) -> dict[str, str]:
        return {target_language: _pick_existing_text(value, target_language)}

    return LocalizedAnalysisPatch(
        targetLanguage=target_language,
        summary={
            "salary": one(analysis.summary.salary),
            "workHours": one(analysis.summary.workHours),
            "holiday": one(analysis.summary.holiday),
            "contractPeriod": one(analysis.summary.contractPeriod),
            "deduction": one(analysis.summary.deduction),
        },
        cautionItems=[
            {"title": one(item.title), "explanation": one(item.explanation)}
            for item in analysis.cautionItems
        ],
        notice=one(analysis.notice),
    )


def analyze(ocr_text: str, language: str = "ko", source_regions: Optional[list[OcrRegion]] = None) -> AnalysisResult:
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
                {"role": "user", "content": _build_user_prompt(ocr_text, language, source_regions)},
            ],
        )
        content = completion.choices[0].message.content or "{}"
        ai = AiAnalysis(**json.loads(content))  # 스키마 검증
        # Do not fail the whole analysis just because a quote cannot be grounded.
        # Source matching will omit `source`, and the app shows an honest
        # "원문 위치를 정확히 찾기 어려워요" state for that item.
        _validate_ai_analysis_against_ocr(
            ai,
            ocr_text,
            _response_languages(language),
            require_grounded_quotes=False,
        )
        return AnalysisResult(ocrText=ocr_text, **ai.model_dump())
    except Exception as exc:
        raise RuntimeError(f"AI analysis failed: {exc}") from exc


def localize_analysis(analysis: AnalysisResult, target_language: str) -> LocalizedAnalysisPatch:
    """기존 분석 결과에서 target language 필드만 생성한다."""
    if not config.USE_REAL_AI:
        return _existing_localization_patch(analysis, target_language)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=config.OPENAI_API_KEY)
        completion = client.chat.completions.create(
            model=config.OPENAI_MODEL,
            response_format={"type": "json_object"},
            temperature=0.2,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_localization_user_prompt(analysis, target_language)},
            ],
        )
        content = completion.choices[0].message.content or "{}"
        patch = LocalizedAnalysisPatch(**json.loads(content))
        _validate_localization_patch(patch, target_language, len(analysis.cautionItems))
        return patch
    except Exception as exc:
        raise RuntimeError(f"AI localization failed: {exc}") from exc
