"""OCR. 기본 제공자는 Google Vision (REST + API 키)."""
import base64
from typing import Optional

import requests

import config
from sample import SAMPLE_OCR_TEXT
from source_matching import OcrRegion, OcrResult, sample_regions_from_text

VISION_URL = "https://vision.googleapis.com/v1/images:annotate"


def run_ocr(image_bytes: bytes) -> str:
    """계약서 이미지 바이트에서 한국어 텍스트를 추출한다.
    키가 없을 때만 샘플 모드로 동작하고, 실제 호출 실패는 에러로 올린다."""
    return run_ocr_with_layout(image_bytes).text


def _normalized_box(vertices: list[dict], page_width: Optional[int], page_height: Optional[int]) -> tuple[float, float, float, float]:
    if not vertices:
        return (0, 0, 0, 0)

    xs: list[float] = []
    ys: list[float] = []
    for vertex in vertices:
        if "x" in vertex:
            x = float(vertex["x"])
            if page_width and x > 1:
                x = x / page_width
            xs.append(x)
        if "y" in vertex:
            y = float(vertex["y"])
            if page_height and y > 1:
                y = y / page_height
            ys.append(y)

    if not xs or not ys:
        return (0, 0, 0, 0)
    left = max(0.0, min(xs))
    top = max(0.0, min(ys))
    right = min(1.0, max(xs))
    bottom = min(1.0, max(ys))
    return (left, top, max(0.0, right - left), max(0.0, bottom - top))


def _vertices_from_bounding_poly(poly: dict) -> list[dict]:
    return poly.get("normalizedVertices") or poly.get("vertices") or []


def _union_box(boxes: list[tuple[float, float, float, float]]) -> tuple[float, float, float, float]:
    if not boxes:
        return (0, 0, 0, 0)
    left = min(box[0] for box in boxes)
    top = min(box[1] for box in boxes)
    right = max(box[0] + box[2] for box in boxes)
    bottom = max(box[1] + box[3] for box in boxes)
    return (left, top, right - left, bottom - top)


def _symbol_break(symbol: dict) -> str:
    return symbol.get("property", {}).get("detectedBreak", {}).get("type", "")


def _word_text_and_break(word: dict) -> tuple[str, str]:
    symbols = word.get("symbols", [])
    text = "".join(symbol.get("text", "") for symbol in symbols)
    break_type = _symbol_break(symbols[-1]) if symbols else ""
    return text, break_type


def _with_region_ids(regions: list[OcrRegion], page_index: int) -> list[OcrRegion]:
    return [
        OcrRegion(
            page_index=region.page_index,
            text=region.text,
            x=region.x,
            y=region.y,
            width=region.width,
            height=region.height,
            id=f"p{page_index + 1}-r{index + 1}",
        )
        for index, region in enumerate(regions)
    ]


def _regions_from_full_text_annotation(annotation: dict, fallback_text: str, upload_page_index: int) -> list[OcrRegion]:
    regions: list[OcrRegion] = []
    pages = annotation.get("pages") or []
    for page_index, page in enumerate(pages):
        page_width = page.get("width")
        page_height = page.get("height")
        current_words: list[str] = []
        current_boxes: list[tuple[float, float, float, float]] = []

        def flush_line() -> None:
            nonlocal current_words, current_boxes
            line_text = " ".join(word for word in current_words if word).strip()
            if line_text and current_boxes:
                x, y, width, height = _union_box(current_boxes)
                regions.append(OcrRegion(page_index=upload_page_index, text=line_text, x=x, y=y, width=width, height=height))
            current_words = []
            current_boxes = []

        for block in page.get("blocks", []):
            for paragraph in block.get("paragraphs", []):
                for word in paragraph.get("words", []):
                    text, break_type = _word_text_and_break(word)
                    if text:
                        current_words.append(text)
                        current_boxes.append(
                            _normalized_box(
                                _vertices_from_bounding_poly(word.get("boundingBox", {})),
                                page_width,
                                page_height,
                            )
                        )
                    if break_type in {"EOL_SURE_SPACE", "LINE_BREAK"}:
                        flush_line()
                flush_line()
            flush_line()
        flush_line()

    if regions:
        return _with_region_ids(regions, upload_page_index)
    return sample_regions_from_text(fallback_text, page_index=upload_page_index)


def run_ocr_with_layout(image_bytes: bytes, page_index: int = 0) -> OcrResult:
    """계약서 이미지 바이트에서 OCR 텍스트와 위치 정보를 함께 추출한다."""
    if not config.USE_REAL_OCR:
        return OcrResult(
            text=SAMPLE_OCR_TEXT,
            regions=sample_regions_from_text(SAMPLE_OCR_TEXT, page_index=page_index),
        )

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
        annotation = response.get("fullTextAnnotation", {})
        text = annotation.get("text", "").strip()
        regions = _regions_from_full_text_annotation(annotation, text, page_index)
    except Exception as exc:
        raise RuntimeError(f"OCR failed: {exc}") from exc

    if not text:
        raise RuntimeError("OCR failed: no text detected")
    return OcrResult(text=text, regions=regions)
