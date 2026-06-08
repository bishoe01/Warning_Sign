import json
import unittest
from pathlib import Path

from ai_service import (
    LOCALIZE_MAX_ATTEMPTS,
    _build_localization_user_prompt,
    _localize_with_retry,
    _validate_ai_analysis_against_ocr,
    _validate_localization_patch,
    _build_user_prompt,
)
from models import AiAnalysis, LocalizedAnalysisPatch
from source_matching import OcrRegion


def _localization_content(target_language: str, salary_text: str) -> str:
    return json.dumps(
        {
            "targetLanguage": target_language,
            "summary": {
                "salary": {target_language: salary_text},
                "workHours": {target_language: "x"},
                "holiday": {target_language: "x"},
                "contractPeriod": {target_language: "x"},
                "deduction": {target_language: "x"},
            },
            "cautionItems": [
                {"title": {target_language: "x"}, "explanation": {target_language: "x"}}
            ],
            "notice": {target_language: "x"},
        },
        ensure_ascii=False,
    )


GOLDEN_OCR_DIR = Path(__file__).parent / "golden_ocr"


def make_analysis(original_text: str) -> AiAnalysis:
    return AiAnalysis(
        summary={
            "salary": {"ko": "계약서에 적힌 임금", "en": "Wage written in the contract", "vi": "Tiền lương ghi trong hợp đồng"},
            "workHours": {"ko": "기재 없음", "en": "Not written", "vi": "Không ghi"},
            "holiday": {"ko": "기재 없음", "en": "Not written", "vi": "Không ghi"},
            "contractPeriod": {"ko": "기재 없음", "en": "Not written", "vi": "Không ghi"},
            "deduction": {"ko": "기재 없음", "en": "Not written", "vi": "Không ghi"},
        },
        cautionItems=[
            {
                "level": "check",
                "title": {"ko": "임금 비정상 기재", "en": "Unusual wage entry", "vi": "Mục lương bất thường"},
                "originalText": original_text,
                "explanation": {
                    "ko": "임금이 매우 낮아 보이므로 서명 전에 실제 금액을 확인해 보세요.",
                    "en": "The wage looks very low, so check the actual amount before signing.",
                    "vi": "Mức lương có vẻ rất thấp, hãy kiểm tra số tiền thực tế trước khi ký.",
                },
            }
        ],
        notice={
            "ko": "법률 자문이 아니라 참고용 안내입니다.",
            "en": "This is guidance, not legal advice.",
            "vi": "Đây là hướng dẫn tham khảo, không phải tư vấn pháp lý.",
        },
        )


def make_localization_source() -> AiAnalysis:
    return AiAnalysis(
        summary={
            "salary": {"ko": "계약서에 적힌 임금", "en": "Wage written in the contract", "vi": "Tiền lương ghi trong hợp đồng"},
            "workHours": {"ko": "계약서에 적힌 근로시간", "en": "Work hours written in the contract", "vi": "Giờ làm việc ghi trong hợp đồng"},
            "holiday": {"ko": "계약서에 적힌 휴일", "en": "Holiday written in the contract", "vi": "Ngày nghỉ ghi trong hợp đồng"},
            "contractPeriod": {"ko": "계약서에 적힌 계약기간", "en": "Contract period written in the contract", "vi": "Thời hạn hợp đồng ghi trong hợp đồng"},
            "deduction": {"ko": "계약서에 적힌 공제", "en": "Deduction written in the contract", "vi": "Khoản khấu trừ ghi trong hợp đồng"},
        },
        cautionItems=[
            {
                "level": "review",
                "title": {"ko": "원문 확인 필요", "en": "Original text needs review", "vi": "Cần kiểm tra bản gốc"},
                "originalText": "숙식비는 근로자와 사업주가 협의하여 정한다.",
                "explanation": {
                    "ko": "계약서 원문에 적힌 내용을 직접 확인해 보세요.",
                    "en": "Check the wording written in the contract.",
                    "vi": "Hãy kiểm tra nội dung ghi trong hợp đồng.",
                },
            }
        ],
        notice={
            "ko": "법률 자문이 아니라 참고용 안내입니다.",
            "en": "This is guidance, not legal advice.",
            "vi": "Đây là hướng dẫn tham khảo, không phải tư vấn pháp lý.",
        },
    )


class AiServiceValidationTest(unittest.TestCase):
    def test_prompt_separates_explanation_language_from_korean_contract_standard(self):
        prompt = _build_user_prompt("근로계약기간: 2026년 6월 1일부터 2027년 5월 31일까지", "vi")

        self.assertIn("선택 언어는 설명 언어", prompt)
        self.assertIn("한국에서 사용하는 한국어 근로계약서", prompt)
        self.assertIn("다른 국가의 노동법", prompt)

    def test_prompt_does_not_embed_demo_specific_abnormal_values(self):
        prompt = _build_user_prompt("임금: 월 통상임금(      )원\n소정근로시간: 시 분 ~ 시 분", "vi")

        self.assertNotIn("월 통상임금(100)원", prompt)
        self.assertNotIn("100시", prompt)
        self.assertNotIn("100시 35분", prompt)

    def test_prompt_includes_ocr_region_ids_for_source_grounding(self):
        prompt = _build_user_prompt(
            "소정근로시간: 시 분 ~ 시 분",
            "ko",
            [OcrRegion(page_index=0, text="소정근로시간: 시 분 ~ 시 분", x=0.1, y=0.2, width=0.7, height=0.04, id="p1-r4")],
        )

        self.assertIn("[p1-r4] 소정근로시간: 시 분 ~ 시 분", prompt)
        self.assertIn("sourceRegionIds", prompt)
        self.assertIn("사진 하이라이트", prompt)

    def test_prompt_includes_manufacturing_contract_type_checklist(self):
        prompt = _build_user_prompt(
            "표준근로계약서\n교대제\n연장, 야간, 휴일근로",
            "ko",
            contract_type="manufacturing_construction_service",
        )

        self.assertIn("제조·건설·서비스", prompt)
        self.assertIn("교대제", prompt)
        self.assertIn("연장·야간·휴일근로 수당", prompt)
        self.assertIn("월 통상임금", prompt)

    def test_prompt_includes_agriculture_contract_type_checklist(self):
        prompt = _build_user_prompt(
            "표준근로계약서(농업·축산업·어업 분야)\n농번기\n성어기",
            "ko",
            contract_type="agriculture_livestock_fishery",
        )

        self.assertIn("농축산·어업", prompt)
        self.assertIn("농번기", prompt)
        self.assertIn("성어기", prompt)
        self.assertIn("근로시간·휴게·휴일", prompt)
        self.assertIn("단정하지 않는다", prompt)

    def test_prompt_requests_contract_type_mismatch_notice(self):
        prompt = _build_user_prompt(
            "표준근로계약서(농업·축산업·어업 분야)\n농번기",
            "ko",
            contract_type="manufacturing_construction_service",
        )

        self.assertIn("선택한 종류와 다를 수", prompt)
        self.assertIn("법률 판정처럼 쓰지 않는다", prompt)

    def test_original_text_must_be_present_in_ocr_text(self):
        ocr_text = (GOLDEN_OCR_DIR / "abnormal_salary.txt").read_text(encoding="utf-8")
        analysis = make_analysis("임금이 너무 낮습니다")

        with self.assertRaisesRegex(ValueError, "originalText"):
            _validate_ai_analysis_against_ocr(analysis, ocr_text)

    def test_original_text_grounding_can_be_soft_for_live_analysis(self):
        ocr_text = (GOLDEN_OCR_DIR / "abnormal_salary.txt").read_text(encoding="utf-8")
        analysis = make_analysis("시 분 ~ 시 분")

        _validate_ai_analysis_against_ocr(
            analysis,
            ocr_text,
            require_grounded_quotes=False,
        )

    def test_original_text_accepts_exact_ocr_quote(self):
        ocr_text = (GOLDEN_OCR_DIR / "abnormal_salary.txt").read_text(encoding="utf-8")
        analysis = make_analysis("월 통상임금(100)원")

        _validate_ai_analysis_against_ocr(analysis, ocr_text)

    def test_localization_prompt_requests_target_language_only(self):
        analysis = make_analysis("월 통상임금(100)원")
        prompt = _build_localization_user_prompt(analysis, "th")

        self.assertIn("targetLanguage: th", prompt)
        self.assertIn("target language 필드만", prompt)
        self.assertIn('"th": ""', prompt)
        self.assertNotIn('"ko": ""', prompt)

    def test_localization_patch_requires_target_key_and_same_item_count(self):
        source = make_localization_source()
        patch = LocalizedAnalysisPatch(
            targetLanguage="th",
            summary={
                "salary": {"th": "ค่าจ้างปกติรายเดือน 100 วอน"},
                "workHours": {"th": "ไม่ได้ระบุ"},
                "holiday": {"th": "ไม่ได้ระบุ"},
                "contractPeriod": {"th": "ไม่ได้ระบุ"},
                "deduction": {"th": "ไม่ได้ระบุ"},
            },
            cautionItems=[
                {
                    "title": {"th": "ค่าจ้างผิดปกติ"},
                    "explanation": {"th": "ค่าจ้างดูต่ำมาก โปรดตรวจสอบก่อนลงนาม"},
                }
            ],
            notice={"th": "เป็นคำแนะนำอ้างอิง ไม่ใช่คำปรึกษาทางกฎหมาย"},
        )

        _validate_localization_patch(patch, "th", len(source.cautionItems))

    def test_localization_patch_rejects_missing_target_key(self):
        source = make_localization_source()
        patch = LocalizedAnalysisPatch(
            targetLanguage="th",
            summary={
                "salary": {"en": "Wage written in the contract"},
                "workHours": {"th": "ไม่ได้ระบุ"},
                "holiday": {"th": "ไม่ได้ระบุ"},
                "contractPeriod": {"th": "ไม่ได้ระบุ"},
                "deduction": {"th": "ไม่ได้ระบุ"},
            },
            cautionItems=[
                {
                    "title": {"th": "ค่าจ้างผิดปกติ"},
                    "explanation": {"th": "ค่าจ้างดูต่ำมาก โปรดตรวจสอบก่อนลงนาม"},
                }
            ],
            notice={"th": "เป็นคำแนะนำอ้างอิง ไม่ใช่คำปรึกษาทางกฎหมาย"},
        )

        with self.assertRaisesRegex(ValueError, "missing localized keys"):
            _validate_localization_patch(patch, "th", len(source.cautionItems))

    def test_localization_prompt_forbids_empty_target_value(self):
        analysis = make_localization_source()
        prompt = _build_localization_user_prompt(analysis, "tet")

        self.assertIn("빈 문자열", prompt)
        self.assertIn("영어나 한국어로 대체하지 않는다", prompt)

    def test_localize_retry_recovers_when_first_attempt_leaves_target_empty(self):
        source = make_localization_source()
        responses = [
            _localization_content("tet", ""),  # 저자원 언어 빈 값 (실제 실패 케이스)
            _localization_content("tet", "Salariu ne'ebe kontratu hakerek"),
        ]
        calls: list[int] = []

        def call_model(attempt: int) -> str:
            calls.append(attempt)
            return responses[attempt]

        patch = _localize_with_retry(call_model, "tet", len(source.cautionItems))

        self.assertEqual(patch.summary.salary["tet"], "Salariu ne'ebe kontratu hakerek")
        self.assertEqual(calls, [0, 1])

    def test_localize_retry_gives_up_after_max_attempts(self):
        source = make_localization_source()
        calls: list[int] = []

        def call_model(attempt: int) -> str:
            calls.append(attempt)
            return _localization_content("tet", "")  # 항상 빈 값

        with self.assertRaisesRegex(RuntimeError, "AI localization failed"):
            _localize_with_retry(call_model, "tet", len(source.cautionItems))

        self.assertEqual(len(calls), LOCALIZE_MAX_ATTEMPTS)


if __name__ == "__main__":
    unittest.main()
