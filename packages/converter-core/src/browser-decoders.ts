import { ConverterError } from "./errors";
import {
  getFileExtension,
  inspectFormatSupport,
  previewPreferredRawExtensions,
} from "./formats";
import { validateOutputDimensions } from "./limits";

export interface DecodedImage {
  drawable: HTMLImageElement | HTMLCanvasElement;
  previewUrl: string;
  width: number;
  height: number;
  sourceType: string;
  warnings: string[];
}

export interface ConvertOptions {
  type: "image/jpeg" | "image/png" | "image/webp" | "image/tiff";
  width: number;
  height: number;
  quality: number;
  background: string;
}

declare global {
  interface Window {
    UTIF?: {
      decode(buffer: ArrayBuffer): any[];
      decodeImage(buffer: ArrayBuffer, ifd: any, ifds?: any[]): void;
      toRGBA8(ifd: any): Uint8Array;
      encodeImage(data: Uint8ClampedArray, width: number, height: number): ArrayBuffer;
    };
    __NLC_WIDGET_BASE_URL__?: string;
  }
}

type SupportedTypedArray = Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array;

const MIN_EMBEDDED_PREVIEW_BYTES = 65_536;
const EMBEDDED_PREVIEW_CHUNK_SIZE = 8 * 1024 * 1024;

let heifModulePromise: Promise<any> | undefined;
let rawModulePromise: Promise<any> | undefined;
let utifPromise: Promise<any> | undefined;

function getAssetUrl(relativePath: string) {
  const base = window.__NLC_WIDGET_BASE_URL__ || "/static/";
  return new URL(relativePath, base).toString();
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createCanvasFromPixels(width: number, height: number, rgba: Uint8Array | Uint8ClampedArray) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new ConverterError("canvas-context-missing", "브라우저 캔버스를 초기화하지 못했습니다.");
  }
  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
  context.putImageData(imageData, 0, 0);
  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ConverterError("canvas-export-failed", "캔버스를 파일로 내보내지 못했습니다."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

async function createPreviewUrl(drawable: HTMLImageElement | HTMLCanvasElement) {
  if (drawable instanceof HTMLImageElement) {
    return drawable.src;
  }

  const blob = await canvasToBlob(drawable, "image/png", 1);
  return URL.createObjectURL(blob);
}

async function loadNativeImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new ConverterError("image-load-failed", "브라우저가 이미지를 읽지 못했습니다."));
    image.src = objectUrl;
  });

  return {
    drawable: image,
    previewUrl: objectUrl,
    width: image.naturalWidth,
    height: image.naturalHeight,
    warnings: [] as string[],
  };
}

async function getHeifModule() {
  if (!heifModulePromise) {
    heifModulePromise = import(/* @vite-ignore */ getAssetUrl("vendor/libheif/libheif-bundle.mjs")).then(
      (module) => module.default()
    );
  }

  return heifModulePromise;
}

async function getRawModule() {
  if (!rawModulePromise) {
    rawModulePromise = import(/* @vite-ignore */ getAssetUrl("vendor/libraw/index.js")).then(
      (module) => module.default
    );
  }

  return rawModulePromise;
}

async function getUtifModule() {
  if (window.UTIF) {
    return window.UTIF;
  }

  if (!utifPromise) {
    utifPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = getAssetUrl("vendor/utif/UTIF.js");
      script.onload = () => {
        if (!window.UTIF) {
          reject(new ConverterError("utif-not-loaded", "TIFF 디코더를 불러오지 못했습니다."));
          return;
        }
        resolve(window.UTIF);
      };
      script.onerror = () => reject(new ConverterError("utif-load-failed", "TIFF 스크립트 로드에 실패했습니다."));
      document.head.append(script);
    });
  }

  return utifPromise;
}

async function decodeHeifImage(file: File): Promise<DecodedImage> {
  const libheif = await getHeifModule();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoder = new libheif.HeifDecoder();
  const frames = decoder.decode(bytes);

  if (!frames.length) {
    throw new ConverterError("heif-empty", "HEIC/HEIF 프레임을 찾지 못했습니다.");
  }

  const frame = frames[0];
  const width = frame.get_width();
  const height = frame.get_height();
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new ConverterError("canvas-context-missing", "브라우저 캔버스를 초기화하지 못했습니다.");
  }
  const imageData = context.createImageData(width, height);

  await new Promise<void>((resolve, reject) => {
    frame.display(imageData, (displayData: unknown) => {
      if (!displayData) {
        reject(new ConverterError("heif-display-failed", "HEIC 프레임 표시를 완료하지 못했습니다."));
        return;
      }
      resolve();
    });
  });

  context.putImageData(imageData, 0, 0);
  frames.forEach((item: { free?: () => void }) => item.free?.());

  return {
    drawable: canvas,
    previewUrl: await createPreviewUrl(canvas),
    width,
    height,
    sourceType: "HEIC / HEIF",
    warnings: ["HEIC/HEIF는 브라우저 메모리 상태에 따라 느릴 수 있습니다."],
  };
}

async function decodeTiffImage(file: File): Promise<DecodedImage> {
  const UTIF = (await getUtifModule()) as NonNullable<typeof window.UTIF>;
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  const ifd = ifds.find((item) => item?.t256?.[0] && item?.t257?.[0]) || ifds[0];

  if (!ifd) {
    throw new ConverterError("tiff-empty", "TIFF 이미지 정보를 찾지 못했습니다.");
  }

  UTIF.decodeImage(buffer, ifd, ifds);
  const rgba = UTIF.toRGBA8(ifd);

  if (!rgba?.length || !ifd.width || !ifd.height) {
    throw new ConverterError("tiff-rgba-failed", "TIFF 픽셀 데이터를 읽지 못했습니다.");
  }

  const canvas = createCanvasFromPixels(ifd.width, ifd.height, rgba);

  return {
    drawable: canvas,
    previewUrl: await createPreviewUrl(canvas),
    width: ifd.width,
    height: ifd.height,
    sourceType: "TIFF",
    warnings: ["일부 TIFF 변형은 레이어나 색상 프로파일이 단순화될 수 있습니다."],
  };
}

async function locateLargestEmbeddedJpegRange(file: File) {
  let bestStart = -1;
  let bestEnd = -1;
  let currentStart = -1;
  let previousByte = -1;

  for (let offset = 0; offset < file.size; offset += EMBEDDED_PREVIEW_CHUNK_SIZE) {
    const chunk = new Uint8Array(
      await file.slice(offset, offset + EMBEDDED_PREVIEW_CHUNK_SIZE).arrayBuffer()
    );

    for (let index = 0; index < chunk.length; index += 1) {
      const byte = chunk[index]!;
      const absoluteIndex = offset + index;

      if (previousByte === 0xff && byte === 0xd8 && currentStart === -1) {
        currentStart = absoluteIndex - 1;
      }

      if (previousByte === 0xff && byte === 0xd9 && currentStart !== -1) {
        const candidateEnd = absoluteIndex + 1;
        if (candidateEnd - currentStart > bestEnd - bestStart) {
          bestStart = currentStart;
          bestEnd = candidateEnd;
        }
        currentStart = -1;
      }

      previousByte = byte;
    }
  }

  if (bestStart === -1 || bestEnd === -1 || bestEnd - bestStart < MIN_EMBEDDED_PREVIEW_BYTES) {
    return null;
  }

  return { start: bestStart, end: bestEnd };
}

async function extractEmbeddedRawPreview(file: File) {
  const previewRange = await locateLargestEmbeddedJpegRange(file);
  if (!previewRange) {
    throw new ConverterError("raw-embedded-preview-not-found", "RAW 내장 프리뷰를 찾지 못했습니다.");
  }

  const previewBlob = file.slice(previewRange.start, previewRange.end, "image/jpeg");
  const previewFile = new File([previewBlob], `${file.name}-preview.jpg`, { type: "image/jpeg" });
  const decoded = await loadNativeImage(previewFile);

  return {
    ...decoded,
    sourceType: "RAW 프리뷰",
    warnings: ["CR3/CRAW는 내장 프리뷰 JPEG를 우선 사용합니다."],
  };
}

function resolveRawDimensions(meta: any, payload: any, pixelLength: number) {
  const candidates = [
    [payload?.width, payload?.height],
    [meta?.width, meta?.height],
    [meta?.iwidth, meta?.iheight],
    [meta?.cwidth, meta?.cheight],
    [meta?.raw_width, meta?.raw_height],
    [meta?.sizes?.width, meta?.sizes?.height],
    [meta?.sizes?.iwidth, meta?.sizes?.iheight],
    [meta?.sizes?.raw_width, meta?.sizes?.raw_height],
  ].filter(([width, height]) => Number(width) > 0 && Number(height) > 0);

  for (const [width, height] of candidates) {
    const area = Number(width) * Number(height);
    if (area * 4 === pixelLength || area * 3 === pixelLength) {
      return { width: Number(width), height: Number(height) };
    }
  }

  const [fallbackWidth, fallbackHeight] = candidates[0] || [];
  if (fallbackWidth && fallbackHeight) {
    return { width: Number(fallbackWidth), height: Number(fallbackHeight) };
  }

  return null;
}

function normalizePixelBuffer(pixelSource: any, width: number, height: number) {
  const payload =
    pixelSource &&
    typeof pixelSource === "object" &&
    ("data" in pixelSource || "imageData" in pixelSource)
      ? pixelSource
      : null;
  const pixels = payload?.data ?? payload?.imageData ?? pixelSource;
  const typed: SupportedTypedArray =
    ArrayBuffer.isView(pixels) && !(pixels instanceof DataView)
      ? (pixels as SupportedTypedArray)
      : new Uint8Array(pixels);
  const pixelCount = width * height;
  const channels = typed.length / pixelCount;
  const bitsPerSample =
    Number(payload?.bits) > 0 ? Number(payload.bits) : Math.max(8, typed.BYTES_PER_ELEMENT * 8);

  if (!Number.isInteger(channels) || (channels !== 3 && channels !== 4)) {
    throw new ConverterError("raw-unsupported-channel-layout", "RAW 채널 구성을 해석하지 못했습니다.");
  }

  if (bitsPerSample <= 8 && (typed instanceof Uint8Array || typed instanceof Uint8ClampedArray)) {
    if (channels === 4) {
      return new Uint8ClampedArray(typed);
    }
  }

  const rgba = new Uint8ClampedArray(pixelCount * 4);
  const maxSampleValue = Math.max(1, 2 ** Math.min(bitsPerSample, 16) - 1);
  const scaleToByte =
    bitsPerSample <= 8
      ? (value: number) => value
      : (value: number) => Math.round((Number(value) / maxSampleValue) * 255);

  for (
    let sourceIndex = 0, targetIndex = 0;
    sourceIndex < typed.length;
    sourceIndex += channels, targetIndex += 4
  ) {
    rgba[targetIndex] = scaleToByte(typed[sourceIndex]);
    rgba[targetIndex + 1] = scaleToByte(typed[sourceIndex + 1]);
    rgba[targetIndex + 2] = scaleToByte(typed[sourceIndex + 2]);
    rgba[targetIndex + 3] = channels === 4 ? scaleToByte(typed[sourceIndex + 3]) : 255;
  }

  return rgba;
}

async function decodeRawImage(file: File): Promise<DecodedImage> {
  const extension = getFileExtension(file.name);

  if (previewPreferredRawExtensions.has(extension)) {
    try {
      return await extractEmbeddedRawPreview(file);
    } catch {
      // Fall back to LibRaw when preview extraction fails.
    }
  }

  const LibRaw = await getRawModule();
  const raw = new LibRaw();
  const bytes = new Uint8Array(await file.arrayBuffer());

  await raw.open(bytes, {
    halfSize: false,
    noAutoBright: false,
    outputBps: 8,
    outputColor: 1,
    useCameraWb: true,
  });

  const metadata = await raw.metadata(true).catch(() => raw.metadata());
  const payload = await raw.imageData();
  const pixels = payload?.data ?? payload?.imageData ?? payload;
  const dimensions = resolveRawDimensions(metadata, payload, pixels.length);

  if (!dimensions) {
    throw new ConverterError("raw-size-unavailable", "RAW 해상도를 계산하지 못했습니다.");
  }

  const rgba = normalizePixelBuffer(payload, dimensions.width, dimensions.height);
  const canvas = createCanvasFromPixels(dimensions.width, dimensions.height, rgba);

  return {
    drawable: canvas,
    previewUrl: await createPreviewUrl(canvas),
    width: dimensions.width,
    height: dimensions.height,
    sourceType: inspectFormatSupport({ fileName: file.name }).sourceFormat,
    warnings: ["RAW 계열은 카메라 모델별 차이로 결과가 달라질 수 있습니다."],
  };
}

export async function decodeSourceFile(file: File): Promise<DecodedImage> {
  const support = inspectFormatSupport({ fileName: file.name, mimeType: file.type });

  if (!support.accepted || support.inputKind === "unknown") {
    throw new ConverterError("unsupported-format", "지원하지 않는 입력 형식입니다.");
  }

  if (support.inputKind === "raw") {
    return decodeRawImage(file);
  }

  if (support.inputKind === "heif") {
    return decodeHeifImage(file);
  }

  if (support.inputKind === "tiff") {
    return decodeTiffImage(file);
  }

  const decoded = await loadNativeImage(file);

  return {
    ...decoded,
    sourceType: support.sourceFormat,
  };
}

export async function convertDecodedImage(
  decoded: DecodedImage,
  options: ConvertOptions
): Promise<{ blob: Blob; objectUrl: string }> {
  const validationMessage = validateOutputDimensions(options.width, options.height);
  if (validationMessage) {
    throw new ConverterError("invalid-dimensions", validationMessage);
  }

  const canvas = createCanvas(options.width, options.height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new ConverterError("canvas-context-missing", "브라우저 캔버스를 초기화하지 못했습니다.");
  }

  if (options.type === "image/jpeg") {
    context.fillStyle = options.background;
    context.fillRect(0, 0, options.width, options.height);
  } else {
    context.clearRect(0, 0, options.width, options.height);
  }

  context.drawImage(decoded.drawable, 0, 0, options.width, options.height);

  let blob: Blob;
  if (options.type === "image/tiff") {
    const UTIF = (await getUtifModule()) as NonNullable<typeof window.UTIF>;
    const imageData = context.getImageData(0, 0, options.width, options.height);
    const buffer = UTIF.encodeImage(imageData.data, canvas.width, canvas.height);
    blob = new Blob([buffer], { type: "image/tiff" });
  } else {
    blob = await canvasToBlob(canvas, options.type, options.quality);
  }

  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
  };
}
