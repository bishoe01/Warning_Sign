"""AI 근로계약서 도우미 API.
실행: server 폴더에서  uvicorn main:app --reload --port 8000"""
from typing import List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import config
from ai_service import analyze
from models import AnalysisResult
from ocr_service import run_ocr

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
):
    if language not in SUPPORTED_LANGUAGES:
        language = "ko"

    texts = []
    total_bytes = 0
    try:
        for f in files:
            data = await f.read()
            total_bytes += len(data)
            texts.append(run_ocr(data))
    except RuntimeError as exc:
        print(
            f"[analyze:error] lang={language} pages={len(files)} bytes={total_bytes} "
            f"ocr={'real' if config.USE_REAL_OCR else 'sample'} "
            f"reason={type(exc).__name__} detail={_safe_error_detail(exc)}"
        )
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    ocr_text = "\n\n".join(t for t in texts if t)  # 페이지 구분으로 합치기
    try:
        result = analyze(ocr_text, language)
    except RuntimeError as exc:
        print(
            f"[analyze:error] lang={language} pages={len(files)} bytes={total_bytes} "
            f"ai={'real' if config.USE_REAL_AI else 'sample'} "
            f"reason={type(exc).__name__} detail={_safe_error_detail(exc)}"
        )
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # 안전: 계약서 이미지/원문은 저장·로그 X (페이지 수/총 바이트/모드만)
    print(
        f"[analyze] lang={language} pages={len(files)} bytes={total_bytes} "
        f"ocr={'real' if config.USE_REAL_OCR else 'sample'} "
        f"ai={'real' if config.USE_REAL_AI else 'sample'} "
        f"isSample={result.isSample}"
    )
    return result
