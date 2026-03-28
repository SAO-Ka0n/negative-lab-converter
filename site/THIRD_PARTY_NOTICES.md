# Negative Lab Converter Third-Party Notices

최종 업데이트: 2026-03-27

Negative Lab Converter는 아래와 같은 제3자 오픈소스 구성요소를 사용합니다. 이 문서는 배포 시 함께 제공하기 위한 고지 문서입니다.

## 런타임 및 변환 관련

| 패키지 | 용도 | 라이선스 |
| --- | --- | --- |
| `libheif-js` | HEIC / HEIF 디코딩 | MIT |
| `libraw-wasm` | RAW 계열 디코딩 | MIT |
| `utif` | TIFF 디코딩 및 인코딩 | MIT |
| `pako` | 압축 관련 유틸리티 | MIT AND Zlib |

## 패키징 및 빌드 관련

| 패키지 | 용도 | 라이선스 |
| --- | --- | --- |
| `electron` | 데스크톱 앱 런타임 | MIT |
| `electron-builder` | 설치본 및 DMG 생성 | MIT |
| `@capacitor/core` | 모바일 셸 런타임 | MIT |
| `@capacitor/android` | Android 셸 | MIT |
| `@capacitor/ios` | iOS 셸 | MIT |
| `esbuild` | 정적 빌드 스크립트 보조 | MIT |

## 고지

- 각 라이브러리의 세부 라이선스 조건과 저작권 고지는 해당 패키지의 원문이 우선합니다.
- 배포본에는 이 문서와 함께 각 패키지의 라이선스 원문 또는 해당 패키지 저장소 링크를 함께 제공하는 것을 권장합니다.
- 더 자세한 종속성 목록은 프로젝트의 `package-lock.json`을 기준으로 재생성할 수 있습니다.
