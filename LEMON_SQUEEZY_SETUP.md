# Lemon Squeezy Setup Notes

최종 업데이트: 2026-03-30

## 목표

Negative Lab Converter의 Windows/macOS 데스크톱 앱을 Lemon Squeezy hosted checkout으로 판매한다.

## 준비물

- Lemon Squeezy 계정
- 스토어 생성
- 데스크톱 제품 1개
- checkout URL
- 다운로드 전달 방식
- 지원 이메일
- 환불 정책 / 이용약관 / 개인정보처리방침

## 최소 판매 흐름

1. 사용자가 판매 페이지에 들어온다.
2. `데스크톱 정식판 구매` 버튼을 누른다.
3. Lemon Squeezy checkout으로 이동한다.
4. 결제를 완료한다.
5. 결제 완료 화면 또는 이메일에서 다운로드 링크를 제공한다.

## 지금 프로젝트에서 채울 위치

### 환경 변수

`COMMERCIAL_RELEASE.example.env`를 기준으로 실제 값 주입:

- `NLC_CHECKOUT_PROVIDER="Lemon Squeezy"`
- `NLC_DESKTOP_PRICE_LABEL="$24"`
- `NLC_PURCHASE_URL="<your-lemon-checkout-url>"`
- `NLC_WEB_DEMO_URL="<your-demo-url>"`
- `NLC_WINDOWS_DOWNLOAD_URL="<your-download-url>"`
- `NLC_MAC_DOWNLOAD_URL="<your-download-url>"`

### 정적 설정

- `launch-config.js`
- `product-config.js`

## 권장 상품 구조

### v1

- Product name: `Negative Lab Converter`
- Price: `$24`
- Type: one-time purchase
- Included:
  - Windows 설치본
  - macOS DMG
  - 1.x 업데이트

상세 문구와 전달 구조는 `LEMON_SQUEEZY_PRODUCT_BLUEPRINT.md`를 기준으로 사용합니다.
판매 화면에 바로 붙여넣을 카피는 `LEMON_SQUEEZY_STORE_COPY.md`를 사용합니다.

## 주의

- ChatGPT 앱 안에서 이 디지털 상품을 직접 판매하지 않습니다.
- ChatGPT 앱은 유입 채널로 두고, 실제 결제는 외부 판매 페이지에서 처리합니다.
- 모바일 앱 결제는 각 스토어 정책을 따릅니다.
