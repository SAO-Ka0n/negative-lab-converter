# Negative Lab Converter

브라우저에서 오프라인으로 동작하는 사진 변환 앱이며, 같은 코드베이스로 모바일과 데스크톱 패키징을 붙일 수 있게 정리한 프로젝트입니다.

## 기능

- PNG / JPEG / WebP / TIFF 출력 포맷 변환
- HEIC / HEIF / AVIF / TIFF / DNG / CR2 / CR3(CRAW 포함) / NEF / ARW / ORF / RAF / RW2 등 다양한 입력 형식 열기
- 해상도 리사이즈
- JPEG 배경색 지정
- 품질 슬라이더
- 설치 가능한 PWA 구조
- Electron 데스크톱 래퍼
- Capacitor 모바일 래퍼 설정

## 개발 실행

```bash
cd /Users/h.g/Downloads/photo-converter-universal
npm install
npm run dev
```

브라우저에서 [http://127.0.0.1:4173](http://127.0.0.1:4173) 를 엽니다.

입력 포맷 지원은 브라우저 기본 디코더와 함께 `libheif-js`, `UTIF.js`, `libraw-wasm`을 사용합니다. 일부 RAW는 카메라 제조사나 모델별 차이로 열리지 않을 수 있습니다.

## 웹 빌드

```bash
npm run build
npm run preview
```

빌드 결과물은 `dist/` 에 생성됩니다.

## 데스크톱 앱

```bash
npm run electron
```

배포용 패키지:

```bash
npm run desktop:dist
```

Windows 설치본만 만들 때:

```bash
npm run desktop:win
```

- macOS: `.dmg`
- Windows: `.exe` 또는 NSIS 설치본

Windows 설치본은 디렉터리 선택, 바탕화면 바로가기 생성, 시작 메뉴 등록이 가능한 NSIS 인스톨러로 만들어집니다.
현재 빌드는 인증서가 없는 unsigned 상태라 Windows SmartScreen 경고가 뜰 수 있습니다. 실제 배포 전에는 본인 명의 코드 서명 인증서 기준으로 publisherName을 맞춰 주는 편이 안전합니다.

macOS 직배포는 `Developer ID` 서명과 notarization을 전제로 준비되어 있습니다. 인증서 정보가 없으면 빌드는 되지만 notarization 단계는 건너뜁니다.

## 상업 출시 준비

공통 판매/정책 설정은 `product-config.js`에서 관리합니다.

- `npm run commercial:check`: 지원 채널, 결제 링크, 다운로드 링크, 정책 문서, 회귀 코퍼스 준비 상태 점검
- `npm run smoke`: Electron 앱 기준 스모크 테스트 실행

정책 문서:

- `PRIVACY_POLICY.md`
- `TERMS_OF_USE.md`
- `REFUND_POLICY.md`
- `THIRD_PARTY_NOTICES.md`

실파일 회귀 코퍼스는 `qa/README.md`와 `qa/corpus.manifest.json` 기준으로 관리합니다.

실제 판매값 주입 예시는 `COMMERCIAL_RELEASE.example.env`에 정리했습니다. 예:

```bash
export NLC_SUPPORT_EMAIL="support@your-domain.com"
export NLC_CHECKOUT_PROVIDER="Lemon Squeezy"
export NLC_DESKTOP_PRICE_LABEL="$24"
export NLC_PURCHASE_URL="https://checkout.example.com/negative-lab-converter"
export NLC_WEB_DEMO_URL="https://your-domain.com/demo"
export NLC_WINDOWS_DOWNLOAD_URL="https://downloads.example.com/Negative%20Lab%20Converter%20Setup%200.1.0.exe"
export NLC_MAC_DOWNLOAD_URL="https://downloads.example.com/Negative%20Lab%20Converter-0.1.0-arm64.dmg"
npm run build:launch
```

판매 전략 정리는 `SALES_PLAYBOOK.md`, Lemon Squeezy 연결 메모는 `LEMON_SQUEEZY_SETUP.md`에 있습니다.

## ChatGPT 앱

이 repo에는 별도로 ChatGPT Apps SDK용 MCP 서버와 React widget도 포함됩니다.

```bash
cd /Users/h.g/Downloads/photo-converter-universal/apps/chatgpt
npm install
npm run build
npm run start
```

- MCP endpoint: `http://127.0.0.1:8788/mcp`
- local preview: `http://127.0.0.1:8788/preview`
- health check: `http://127.0.0.1:8788/healthz`
- dev 배포 시 `NLC_CHATGPT_APP_BASE_URL`에 공개 HTTPS 주소를 넣으면 widget resource가 해당 정적 자산 URL을 사용합니다.
- Render 배포용 블루프린트는 `render.yaml`, 컨테이너 설정은 `apps/chatgpt/Dockerfile`에 있습니다.

도구:

- `open_converter_workspace`
- `analyze_source_image`
- `recommend_export_preset`
- `inspect_format_support`
- `report_conversion_result`

## 모바일 앱

```bash
npm run mobile:sync
```

네이티브 프로젝트를 추가한 뒤:

```bash
npx cap add android
npx cap add ios
npm run mobile:android
npm run mobile:ios
```

## 요구 사항

- Android 빌드: Android Studio / SDK
- iOS 빌드: macOS + Xcode
- Windows 설치본 빌드: Windows 환경 권장
- macOS 설치본 빌드: macOS 환경 필요

Capacitor 공식 안내는 [capacitorjs.com](https://capacitorjs.com/) 에서, Electron 공식 문서는 [electronjs.org](https://www.electronjs.org/docs/latest/) 에서 확인할 수 있습니다.
