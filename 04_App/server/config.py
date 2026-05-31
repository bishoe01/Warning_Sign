"""환경설정. .env 에서 키를 읽고, 키가 없으면 샘플 모드로 동작한다."""
import os

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
GOOGLE_VISION_API_KEY = os.getenv("GOOGLE_VISION_API_KEY", "").strip()

# 키가 있으면 실제 호출, 없으면 샘플 폴백
USE_REAL_OCR = bool(GOOGLE_VISION_API_KEY)
USE_REAL_AI = bool(OPENAI_API_KEY)
