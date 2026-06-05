"""Match AI originalText quotes back to OCR text regions."""
from dataclasses import dataclass
from typing import Iterable, Optional, TypeVar

from models import AiAnalysis, SourceBox, SourceMatch


@dataclass(frozen=True)
class OcrRegion:
    page_index: int
    text: str
    x: float
    y: float
    width: float
    height: float


@dataclass(frozen=True)
class OcrResult:
    text: str
    regions: list[OcrRegion]


AnalysisT = TypeVar("AnalysisT", bound=AiAnalysis)


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _compact(text: str) -> str:
    return "".join(text.split())


def _source_box(region: OcrRegion) -> SourceBox:
    return SourceBox(
        pageIndex=region.page_index,
        x=_clamp01(region.x),
        y=_clamp01(region.y),
        width=_clamp01(region.width),
        height=_clamp01(region.height),
    )


def _source_match(quote: str, region: OcrRegion, confidence: str, match_type: str) -> SourceMatch:
    return SourceMatch(
        pageIndex=region.page_index,
        quote=quote,
        boxes=[_source_box(region)],
        confidence=confidence,
        matchType=match_type,
    )


def match_source(quote: str, regions: Iterable[OcrRegion]) -> Optional[SourceMatch]:
    """Return a grounded source match, or None when a quote cannot be located."""
    cleaned_quote = quote.strip()
    if not cleaned_quote:
        return None

    region_list = [region for region in regions if region.text.strip()]
    for region in region_list:
        if cleaned_quote in region.text:
            return _source_match(cleaned_quote, region, "high", "exact")

    compact_quote = _compact(cleaned_quote)
    if not compact_quote:
        return None

    for region in region_list:
        if compact_quote in _compact(region.text):
            return _source_match(cleaned_quote, region, "medium", "normalized")

    return None


def attach_sources_to_analysis(analysis: AnalysisT, regions: Iterable[OcrRegion]) -> AnalysisT:
    """Attach OCR-grounded source matches to caution items without inventing boxes."""
    result = analysis.model_copy(deep=True)
    region_list = list(regions)
    for item in result.cautionItems:
        if item.source:
            continue
        item.source = match_source(item.originalText, region_list)
    return result


def sample_regions_from_text(text: str, page_index: int = 0) -> list[OcrRegion]:
    """Create stable demo regions from sample OCR text.

    This is only used in sample mode so the demo can show the grounding flow even
    without Google Vision credentials. Real OCR regions come from Vision boxes.
    """
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return []

    top = 0.08
    line_height = min(0.045, 0.82 / max(len(lines), 1))
    regions: list[OcrRegion] = []
    for index, line in enumerate(lines):
        y = top + index * line_height
        width = min(0.86, max(0.24, len(line) / 80))
        regions.append(
            OcrRegion(
                page_index=page_index,
                text=line,
                x=0.07,
                y=y,
                width=width,
                height=line_height * 0.72,
            )
        )
    return regions
