"""AI 근로계약서 도우미 API.
실행: server 폴더에서  uvicorn main:app --reload --port 8000"""
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import config
from ai_service import analyze
from models import AnalysisResult
from ocr_service import run_ocr

app = FastAPI(title="AI 근로계약서 도우미 API")

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


@app.post("/analyze-contract", response_model=AnalysisResult)
async def analyze_contract(
    file: UploadFile = File(...),
    language: str = Form("ko"),
):
    if language not in ("ko", "en", "vi"):
        language = "ko"

    image_bytes = await file.read()
    ocr_text = run_ocr(image_bytes)
    result = analyze(ocr_text, language)

    # 안전: 계약서 이미지/원문은 저장하지 않고 로그에도 남기지 않는다 (크기/모드만 기록).
    print(
        f"[analyze] lang={language} bytes={len(image_bytes)} "
        f"ocr={'real' if config.USE_REAL_OCR else 'sample'} "
        f"ai={'real' if config.USE_REAL_AI else 'sample'}"
    )
    return result
