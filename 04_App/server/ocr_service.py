"""OCR. 기본 제공자는 Google Vision (REST + API 키)."""
import base64

import requests

import config
from sample import SAMPLE_OCR_TEXT

VISION_URL = "https://vision.googleapis.com/v1/images:annotate"


def run_ocr(image_bytes: bytes) -> str:
    """계약서 이미지 바이트에서 한국어 텍스트를 추출한다.
    키가 없을 때만 샘플 모드로 동작하고, 실제 호출 실패는 에러로 올린다."""
    if not config.USE_REAL_OCR:
        return SAMPLE_OCR_TEXT

    payload = {
        "requests": [
            {
                "image": {"content": base64.b64encode(image_bytes).decode("utf-8")},
                "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                "imageContext": {"languageHints": ["ko"]},
            }
        ]
    }
    try:
        res = requests.post(
            VISION_URL,
            params={"key": config.GOOGLE_VISION_API_KEY},
            json=payload,
            timeout=30,
        )
        res.raise_for_status()
        response = res.json().get("responses", [{}])[0]
        if "error" in response:
            message = response["error"].get("message", "Google Vision OCR failed")
            raise RuntimeError(message)
        text = response.get("fullTextAnnotation", {}).get("text", "").strip()
    except Exception as exc:
        raise RuntimeError(f"OCR failed: {exc}") from exc

    if not text:
        raise RuntimeError("OCR failed: no text detected")
    return text
