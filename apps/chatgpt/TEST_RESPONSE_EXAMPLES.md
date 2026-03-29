# Negative Lab Converter Test Response Examples

Last updated: 2026-03-30

## Prompt

`CRAW도 열 수 있어?`

## Expected response shape

- The app answers with a capability result
- It should mention that `CR3` and `CRAW` are treated as preview-first / best-effort
- It should not force-open the conversion widget

## Prompt

`이 HEIC를 블로그용 JPEG로 가볍게 바꿔줘.`

## Expected response shape

- The app recommends a lighter export preset
- The app opens the conversion workspace
- The widget lets the user upload the image, preview it, convert it, and download it

## Prompt

`투명 배경은 유지하고 파일만 작게 만들고 싶어.`

## Expected response shape

- The app avoids JPEG as the default recommendation
- The app prefers PNG or WebP
- The widget should keep the decision understandable to the user

## Prompt

`이걸 20000px TIFF로 뽑아줘.`

## Expected response shape

- The app clamps or refuses the oversized export request
- The widget shows a clear validation message
- The app does not crash or hang
