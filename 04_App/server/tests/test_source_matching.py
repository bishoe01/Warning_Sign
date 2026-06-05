import unittest

from models import AiAnalysis
from source_matching import OcrRegion, attach_sources_to_analysis, match_source


def make_analysis(original_text: str) -> AiAnalysis:
    return AiAnalysis(
        summary={
            "salary": {"ko": "월 통상임금 100원", "en": "Monthly ordinary wage: 100 KRW"},
            "workHours": {"ko": "기재 없음", "en": "Not written"},
            "holiday": {"ko": "기재 없음", "en": "Not written"},
            "contractPeriod": {"ko": "기재 없음", "en": "Not written"},
            "deduction": {"ko": "기재 없음", "en": "Not written"},
        },
        cautionItems=[
            {
                "level": "check",
                "title": {"ko": "임금 비정상 기재", "en": "Unusual wage entry"},
                "originalText": original_text,
                "explanation": {
                    "ko": "임금이 매우 낮아 보이므로 서명 전에 실제 금액을 확인해 보세요.",
                    "en": "The wage looks very low, so check the actual amount before signing.",
                },
            }
        ],
        notice={"ko": "참고용 안내입니다.", "en": "This is guidance."},
    )


class SourceMatchingTest(unittest.TestCase):
    def test_match_source_returns_high_confidence_for_exact_region(self):
        regions = [
            OcrRegion(page_index=0, text="월 통상임금(100)원", x=0.1, y=0.2, width=0.5, height=0.04),
        ]

        match = match_source("월 통상임금(100)원", regions)

        self.assertIsNotNone(match)
        self.assertEqual(match.confidence, "high")
        self.assertEqual(match.matchType, "exact")
        self.assertEqual(match.pageIndex, 0)
        self.assertEqual(match.boxes[0].x, 0.1)

    def test_match_source_accepts_spacing_difference_as_medium_confidence(self):
        regions = [
            OcrRegion(page_index=1, text="월 통상임금 ( 100 ) 원", x=0.12, y=0.31, width=0.48, height=0.05),
        ]

        match = match_source("월 통상임금(100)원", regions)

        self.assertIsNotNone(match)
        self.assertEqual(match.confidence, "medium")
        self.assertEqual(match.matchType, "normalized")
        self.assertEqual(match.pageIndex, 1)

    def test_match_source_returns_none_when_quote_is_not_grounded(self):
        regions = [
            OcrRegion(page_index=0, text="근로계약기간: 2026.06.01 ~ 2027.05.31", x=0.1, y=0.2, width=0.8, height=0.04),
        ]

        self.assertIsNone(match_source("임금이 너무 낮습니다", regions))

    def test_attach_sources_to_analysis_preserves_unmatched_items_without_fake_box(self):
        regions = [
            OcrRegion(page_index=0, text="월 통상임금(100)원", x=0.1, y=0.2, width=0.5, height=0.04),
        ]
        analysis = make_analysis("임금이 너무 낮습니다")

        result = attach_sources_to_analysis(analysis, regions)

        self.assertIsNone(result.cautionItems[0].source)


if __name__ == "__main__":
    unittest.main()
