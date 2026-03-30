# Negative Lab Converter Sales Playbook

최종 업데이트: 2026-03-30

## 권장 판매 구조

이 제품은 `웹 데모 + 데스크톱 유료 판매` 구조가 가장 적합합니다.

- 웹사이트: 제품 소개, 무료 체험, 결제 진입, 다운로드 안내
- 데스크톱 앱: 실제 유료 상품
- ChatGPT 앱: 무료 유입 및 체험 채널

## 왜 이 구조가 맞는가

- 이 제품의 강점은 `로컬 처리`, `오프라인 변환`, `RAW / HEIC 대응`, `프라이버시`입니다.
- 이런 가치는 브라우저 웹앱보다 설치형 데스크톱 앱에서 더 쉽게 설득됩니다.
- 일반 웹 변환기는 무료 경쟁이 강해서 유료 전환이 더 어렵습니다.

## 가격 권장안

### 기본 권장

- 정식판 1회 구매: `$19 ~ $29`

### 확장안

- 무료 웹 데모
- 데스크톱 정식판: `$24`
- 향후 Pro 기능:
  - 배치 변환
  - 폴더 단위 처리
  - 메타데이터 유지
  - 프리셋 저장

## 결제 제공업체 추천

### 1순위: Lemon Squeezy

- 디지털 제품에 맞음
- Merchant of Record 구조
- 세금/VAT 처리 부담이 적음
- 랜딩 페이지 연결이 단순함

### 2순위: Gumroad

- 더 빨리 시작 가능
- 수수료가 더 높은 편

### 3순위: Stripe 직접 연결

- 수수료는 유리할 수 있음
- 세금, 환불, 영수증, 디지털 상품 운영을 직접 더 많이 챙겨야 함

## 운영 방식

### 웹

- 무료 데모 공개
- 대표 기능만 체험
- 결제 버튼은 외부 checkout으로 연결

### 데스크톱

- 결제 완료 후 Windows 설치본 / macOS DMG 다운로드 제공
- 업데이트 정책은 1.x 무료 업데이트처럼 단순하게 시작

## 지금 프로젝트에서 연결할 값

아래 값만 채우면 판매 페이지 연결이 거의 끝납니다.

- `NLC_CHECKOUT_PROVIDER`
- `NLC_DESKTOP_PRICE_LABEL`
- `NLC_PURCHASE_URL`
- `NLC_WEB_DEMO_URL`
- `NLC_WINDOWS_DOWNLOAD_URL`
- `NLC_MAC_DOWNLOAD_URL`
- `NLC_SUPPORT_EMAIL`
- `NLC_WEBSITE_URL`

## 권장 순서

1. Lemon Squeezy 스토어 생성
2. 데스크톱 제품 생성
3. hosted checkout URL 발급
4. 다운로드 전달 방식 결정
5. 판매 페이지에 실제 값 반영
6. Windows/mac 판매 시작
