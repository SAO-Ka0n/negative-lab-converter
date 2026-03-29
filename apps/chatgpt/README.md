# Negative Lab Converter ChatGPT App

ChatGPT Apps SDK용 MCP 서버와 React widget입니다. 한 장의 사진을 ChatGPT 안에서 업로드하고, 로컬로 미리본 뒤 변환 결과를 다운로드하는 흐름에 맞춰 구성했습니다.

## 로컬 실행

```bash
cd /Users/h.g/Downloads/photo-converter-universal/apps/chatgpt
npm install
npm run build
npm run start
```

기본 주소:

- MCP: `http://127.0.0.1:8788/mcp`
- Preview: `http://127.0.0.1:8788/preview`
- Health: `http://127.0.0.1:8788/healthz`

## 개발 모드

```bash
cd /Users/h.g/Downloads/photo-converter-universal/apps/chatgpt
npm run dev
```

이 스크립트는 widget/server 번들을 watch 합니다. 별도로 서버는 아래처럼 띄웁니다.

```bash
npm run dev:server
```

## ChatGPT Developer Mode 연결

1. 서버를 HTTPS로 노출합니다. 개발 중에는 `ngrok http 8788` 같은 터널을 사용합니다.
2. 공개 주소가 있으면 `NLC_CHATGPT_APP_BASE_URL`로 설정한 뒤 서버를 다시 실행합니다.
   Render에서는 기본 제공되는 `RENDER_EXTERNAL_URL`을 자동으로 사용하므로 별도 설정 없이도 됩니다.
3. ChatGPT Developer Mode에서 `https://<public-domain>/mcp`를 connector URL로 등록합니다.
4. 새 대화에서 아래 예시 프롬프트로 테스트합니다.

- `이 HEIC를 블로그용 JPEG로 가볍게 바꿔줘.`
- `이 CR3 사진을 웹용 WebP로 변환해줘.`
- `CRAW도 열 수 있어?`

## Inspector / Smoke

MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest --server-url http://127.0.0.1:8788/mcp --transport http
```

HTTP smoke check:

```bash
npm run smoke
```

## 환경 변수

- `PORT`: 로컬/배포 서버 포트
- `NLC_CHATGPT_APP_BASE_URL`: widget가 정적 자산을 참조할 공개 기준 URL. Render 배포에서는 `RENDER_EXTERNAL_URL`이 자동으로 대체됩니다.

## 도구

- `open_converter_workspace`
- `analyze_source_image`
- `recommend_export_preset`
- `inspect_format_support`
- `report_conversion_result`

## 제출 문서

- `SUBMISSION_CHECKLIST.md`
- `TEST_PROMPTS.md`
- `MONETIZATION_NOTES.md`
