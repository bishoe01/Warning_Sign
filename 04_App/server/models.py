"""분석 결과 스키마 (앱 src/data/sampleAnalysis.ts 의 타입과 1:1 대응)."""
from typing import List, Literal

from pydantic import BaseModel

Language = Literal["ko", "en", "vi"]
CautionLevel = Literal["check", "review", "info"]


class Summary(BaseModel):
    salary: str
    workHours: str
    holiday: str
    contractPeriod: str
    deduction: str


class CautionItem(BaseModel):
    level: CautionLevel
    title: str
    originalText: str
    explanationKo: str
    explanationEn: str
    explanationVi: str


class AiAnalysis(BaseModel):
    """AI 가 생성하는 부분 (ocrText 제외)."""
    summary: Summary
    cautionItems: List[CautionItem]
    notice: str


class AnalysisResult(BaseModel):
    ocrText: str
    summary: Summary
    cautionItems: List[CautionItem]
    notice: str
