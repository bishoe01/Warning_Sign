"""분석 결과 스키마 (앱 src/data/sampleAnalysis.ts 의 타입과 1:1 대응)."""
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel

Language = Literal["ko", "en", "ne", "tet", "ru", "mn", "my", "bn", "vi", "uz", "id", "zh", "km", "ky", "th", "lo"]
CautionLevel = Literal["check", "review", "info"]
LocalizedText = Dict[Language, str]


class Summary(BaseModel):
    salary: LocalizedText
    workHours: LocalizedText
    holiday: LocalizedText
    contractPeriod: LocalizedText
    deduction: LocalizedText


class SourceBox(BaseModel):
    pageIndex: int
    x: float
    y: float
    width: float
    height: float


class SourceMatch(BaseModel):
    pageIndex: int
    quote: str
    boxes: List[SourceBox]
    confidence: Literal["high", "medium", "low"]
    matchType: Literal["regionId", "exact", "normalized", "fuzzy"]


class CautionItem(BaseModel):
    level: CautionLevel
    title: LocalizedText
    originalText: str
    explanation: LocalizedText
    sourceRegionIds: List[str] = []
    source: Optional[SourceMatch] = None


class AiAnalysis(BaseModel):
    """AI 가 생성하는 부분 (ocrText 제외)."""
    summary: Summary
    cautionItems: List[CautionItem]
    notice: LocalizedText


class AnalysisResult(BaseModel):
    ocrText: str
    summary: Summary
    cautionItems: List[CautionItem]
    notice: LocalizedText
    isSample: bool = False


class CautionLocalizationPatch(BaseModel):
    title: LocalizedText
    explanation: LocalizedText


class LocalizedAnalysisPatch(BaseModel):
    targetLanguage: Language
    summary: Summary
    cautionItems: List[CautionLocalizationPatch]
    notice: LocalizedText


class LocalizeAnalysisRequest(BaseModel):
    targetLanguage: Language
    result: AnalysisResult
