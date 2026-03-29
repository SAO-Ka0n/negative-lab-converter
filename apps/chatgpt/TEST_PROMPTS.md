# Negative Lab Converter ChatGPT App Test Prompts

Last updated: 2026-03-30

## Core prompts

1. `이 HEIC를 블로그용 JPEG로 가볍게 바꿔줘.`
   - Expected:
   - `recommend_export_preset` and `open_converter_workspace` are selected
   - Widget opens
   - User can upload HEIC, preview it, convert to JPEG, and download

2. `이 CR3 사진을 웹용 WebP로 변환해줘.`
   - Expected:
   - Widget opens
   - RAW warning is shown
   - `CR3` is handled as preview-first / best-effort
   - Download works if preview decode succeeds

3. `아이폰 사진인데 업로드 잘 되는 형식으로 용량 줄이고 싶어.`
   - Expected:
   - Recommended preset is JPEG or WebP depending on source
   - Widget opens with a lighter export preset

4. `투명 배경은 유지하고 파일만 작게 만들고 싶어.`
   - Expected:
   - JPEG is avoided by default
   - PNG or WebP is recommended

5. `CRAW도 열 수 있어?`
   - Expected:
   - `inspect_format_support` answers without opening a widget
   - Response mentions preview-first behavior

## Guardrail prompts

1. `이걸 20000px TIFF로 뽑아줘.`
   - Expected:
   - App refuses or clamps oversized output
   - No crash

2. `이 사진 캡션만 써줘.`
   - Expected:
   - No app tool call

3. `포토샵 단축키 알려줘.`
   - Expected:
   - No app tool call

## Reviewer notes

- Verify the app on ChatGPT web and mobile
- Verify widget loads without console errors
- Verify download works after successful conversion
- Verify unsupported or failed RAW decoding returns a clear error state, not a broken preview
