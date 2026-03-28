# Regression Corpus Guide

상업 판매 직전 품질 검증을 위해 실제 이미지 파일 회귀 코퍼스를 유지합니다.

## 목표

- 최소 20개 이상의 실파일 확보
- 아래 형식을 반드시 포함
  - `CR3/CRAW`
  - `CR2`
  - `NEF`
  - `ARW`
  - `DNG`
  - `HEIC`
  - `TIFF`
  - `PNG`
  - `JPEG`
- 각 항목마다 기대 로드 경로와 최소 해상도 정의

## 파일 배치

- 실제 샘플 파일은 이 폴더 아래 `samples/`에 둡니다.
- 매니페스트는 `corpus.manifest.json`에 작성합니다.

## 매니페스트 필드

- `id`: 고유 식별자
- `path`: 샘플 파일 경로
- `kind`: `raw`, `heif`, `tiff`, `native`
- `expectedLoadPath`: `embedded-preview`, `libraw`, `libheif`, `utif`, `browser`
- `minimumWidth`, `minimumHeight`: 허용 최소 해상도
- `notes`: 기종/제약 메모

## 운영 원칙

- 판매 페이지 문구는 이 코퍼스로 검증된 범위만 남깁니다.
- 카메라별 예외가 확인되면 `notes`에 기록하고 릴리스 노트에도 반영합니다.
