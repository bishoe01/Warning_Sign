"""OCR. 기본 제공자는 Google Vision (REST + API 키).
키가 없으면 샘플 OCR 텍스트를 반환한다.
CLOVA OCR 로 바꾸려면 run_ocr 안의 실제 호출 부분만 교체하면 된다."""
import base64

import requests

import config
from sample import SAMPLE_OCR_TEXT

VISION_URL = "https://vision.googleapis.com/v1/images:annotate"


def run_ocr(image_bytes: bytes) -> str:
    """계약서 이미지 바이트에서 한국어 텍스트를 추출한다.
    실제 호출이 실패하거나 결과가 비면 샘플 텍스트로 폴백한다."""
    if not config.USE_REAL_OCR:
        return SAMPLE_OCR_TEXT

    try:
        payload = {
            "requests": [
                {
                    "image": {"content": base64.b64encode(image_bytes).decode("utf-8")},
                    "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                    "imageContext": {"languageHints": ["ko"]},
                }
            ]
        }
        res = requests.post(
            VISION_URL,
            params={"key": config.GOOGLE_VISION_API_KEY},
            json=payload,
            timeout=30,
        )
        res.raise_for_status()
        responses = res.json().get("responses", [{}])
        text = responses[0].get("fullTextAnnotation", {}).get("text", "").strip()
        return text or SAMPLE_OCR_TEXT
    except Exception as exc:  # 키 오류 / 네트워크 / 빈 결과 → 샘플 폴백
        print(f"[ocr_service] real OCR failed ({type(exc).__name__}), fallback to sample")
        return SAMPLE_OCR_TEXT
