# AI 근로계약서 도우미 — 백엔드 (FastAPI)

이미지를 받아 OCR + AI 분석 결과(JSON)를 반환한다.
**키가 없으면 명시적 샘플 모드**, 키를 채우면 실제 OCR/AI 로 동작한다.
키가 있는 실제 모드에서 OCR/AI 호출이 실패하면 샘플로 덮지 않고 `502` 오류를 반환한다.

## 실행

```bash
cd 04_App/server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

확인:

```bash
curl http://localhost:8000/health
# {"ok":true,"mode":{"ocr":"sample","ai":"sample"}}
```

## 실제 OCR/AI 켜기

```bash
cp .env.example .env
```

`.env` 에 키 입력:

- `OPENAI_API_KEY` — OpenAI 키 (AI 분석)
- `GOOGLE_VISION_API_KEY` — Google Vision 키 (OCR)

키를 채우고 서버를 재시작하면 `/health` 의 mode 가 `real` 로 바뀐다.
`/health` 가 `sample` 을 보여주면 앱 결과도 샘플이므로, 먼저 `.env` 위치와 서버 실행 venv 를 확인한다.

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 상태 + 현재 모드(sample/real) |
| POST | `/analyze-contract` | `files`(이미지 1장 이상) + `language`(ko/en/ne/tet/ru/mn/my/bn/vi/uz/id/zh/km/ky/th/lo) → 분석 JSON |
| POST | `/localize-analysis` | 기존 분석 JSON + `targetLanguage` → target 언어 localized field patch |

```bash
curl -X POST http://localhost:8000/analyze-contract \
  -F "files=@contract.jpg" -F "language=ko"
```

동적 다국어 보강:

```bash
curl -X POST http://localhost:8000/localize-analysis \
  -H "Content-Type: application/json" \
  -d '{"targetLanguage":"th","result":{...}}'
```

## 안전

- 키는 `.env` 에만 둔다(앱에 넣지 않음). `.env` 는 커밋하지 않는다.
- 계약서 이미지/원문은 저장하지 않고, 로그에도 남기지 않는다.

## OCR 제공자 교체

기본은 Google Vision. CLOVA OCR 로 바꾸려면 `ocr_service.py` 의 `run_ocr` 실제 호출 부분만 교체하면 된다.
