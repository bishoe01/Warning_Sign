"""AI 근로계약서 도우미 API.
실행: server 폴더에서  uvicorn main:app --reload --port 8000"""
from typing import List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import config
from ai_service import analyze, localize_analysis, normalize_contract_type
from models import AnalysisResult, LocalizeAnalysisRequest, LocalizedAnalysisPatch
from ocr_service import run_ocr_with_layout
from source_matching import attach_sources_to_analysis

app = FastAPI(title="AI 근로계약서 도우미 API")
SUPPORTED_LANGUAGES = {"ko", "en", "ne", "tet", "ru", "mn", "my", "bn", "vi", "uz", "id", "zh", "km", "ky", "th", "lo"}

# 개발용 CORS (앱/웹에서 호출). 운영 시 도메인 제한 권장.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "ok": True,
        "mode": {
            "ocr": "real" if config.USE_REAL_OCR else "sample",
            "ai": "real" if config.USE_REAL_AI else "sample",
        },
    }


def _safe_error_detail(exc: RuntimeError) -> str:
    return str(exc).replace("\n", " ")[:240]


@app.post("/analyze-contract", response_model=AnalysisResult)
async def analyze_contract(
    files: List[UploadFile] = File(...),
    language: str = Form("ko"),
    contractType: str = Form("manufacturing_construction_service"),
):
    if language not in SUPPORTED_LANGUAGES:
        language = "ko"
    contract_type = normalize_contract_type(contractType)

    texts = []
    regions = []
    total_bytes = 0
    try:
        for page_index, f in enumerate(files):
            data = await f.read()
            total_bytes += len(data)
            ocr = run_ocr_with_layout(data, page_index=page_index)
            texts.append(ocr.text)
            regions.extend(ocr.regions)
    except RuntimeError as exc:
        print(
            f"[analyze:error] lang={language} contractType={contract_type} pages={len(files)} bytes={total_bytes} "
            f"ocr={'real' if config.USE_REAL_OCR else 'sample'} "
            f"reason={type(exc).__name__} detail={_safe_error_detail(exc)}"
        )
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    ocr_text = "\n\n".join(t for t in texts if t)  # 페이지 구분으로 합치기
    try:
        result = attach_sources_to_analysis(analyze(ocr_text, language, regions, contract_type), regions)
    except RuntimeError as exc:
        print(
            f"[analyze:error] lang={language} contractType={contract_type} pages={len(files)} bytes={total_bytes} "
            f"ai={'real' if config.USE_REAL_AI else 'sample'} "
            f"reason={type(exc).__name__} detail={_safe_error_detail(exc)}"
        )
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # 안전: 계약서 이미지/원문은 저장·로그 X (페이지 수/총 바이트/모드만)
    print(
        f"[analyze] lang={language} contractType={contract_type} pages={len(files)} bytes={total_bytes} "
        f"ocr={'real' if config.USE_REAL_OCR else 'sample'} "
        f"ai={'real' if config.USE_REAL_AI else 'sample'} "
        f"isSample={result.isSample} "
        f"sources={sum(1 for item in result.cautionItems if item.source)}/{len(result.cautionItems)}"
    )
    return result


@app.post("/localize-analysis", response_model=LocalizedAnalysisPatch)
async def localize_existing_analysis(request: LocalizeAnalysisRequest):
    target_language = request.targetLanguage
    try:
        patch = localize_analysis(request.result, target_language)
    except RuntimeError as exc:
        print(
            f"[localize:error] lang={target_language} items={len(request.result.cautionItems)} "
            f"ai={'real' if config.USE_REAL_AI else 'sample'} "
            f"reason={type(exc).__name__} detail={_safe_error_detail(exc)}"
        )
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    print(
        f"[localize] lang={target_language} items={len(request.result.cautionItems)} "
        f"ai={'real' if config.USE_REAL_AI else 'sample'}"
    )
    return patch
