export type InputKind = "native" | "heif" | "tiff" | "raw";
export type OutputFormat = "jpeg" | "png" | "webp" | "tiff";

export interface FormatSupportResult {
  accepted: boolean;
  inputKind: InputKind | "unknown";
  sourceFormat: string;
  supportedOutputs: OutputFormat[];
  previewOnly: boolean;
  decoderPath: string;
  caveats: string[];
}

export const rawExtensions = new Set([
  "3fr",
  "arw",
  "craw",
  "cr2",
  "cr3",
  "crw",
  "dcr",
  "dng",
  "erf",
  "fff",
  "gpr",
  "iiq",
  "k25",
  "kdc",
  "mef",
  "mos",
  "mrw",
  "nef",
  "nrw",
  "orf",
  "pef",
  "raf",
  "raw",
  "rw2",
  "sr2",
  "srf",
  "srw",
  "x3f",
]);

export const heifExtensions = new Set(["heic", "heif"]);
export const nativeExtensions = new Set(["avif", "bmp", "gif", "jpeg", "jpg", "png", "svg", "webp"]);
export const tiffExtensions = new Set(["tif", "tiff"]);
export const previewPreferredRawExtensions = new Set(["cr3", "craw"]);

export const outputFormats: OutputFormat[] = ["jpeg", "png", "webp", "tiff"];

const labels: Record<string, string> = {
  "3fr": "RAW",
  "arw": "Sony RAW",
  "avif": "AVIF",
  "bmp": "BMP",
  "craw": "Canon CRAW",
  "cr2": "Canon RAW",
  "cr3": "Canon RAW / CRAW",
  "crw": "Canon RAW",
  "dcr": "Kodak RAW",
  "dng": "DNG RAW",
  "erf": "Epson RAW",
  "fff": "Hasselblad RAW",
  "gif": "GIF",
  "gpr": "GoPro RAW",
  "heic": "HEIC",
  "heif": "HEIF",
  "iiq": "Phase One RAW",
  "jpeg": "JPEG",
  "jpg": "JPEG",
  "k25": "Kodak RAW",
  "kdc": "Kodak RAW",
  "mef": "Mamiya RAW",
  "mos": "Leaf RAW",
  "mrw": "Minolta RAW",
  "nef": "Nikon RAW",
  "nrw": "Nikon RAW",
  "orf": "Olympus RAW",
  "pef": "Pentax RAW",
  "png": "PNG",
  "raf": "Fujifilm RAW",
  "raw": "RAW",
  "rw2": "Panasonic RAW",
  "sr2": "Sony RAW",
  "srf": "Sony RAW",
  "srw": "Samsung RAW",
  "svg": "SVG",
  "tif": "TIFF",
  "tiff": "TIFF",
  "webp": "WebP",
  "x3f": "Sigma RAW",
};

export function getFileExtension(filename = ""): string {
  const pieces = filename.split(".");
  return pieces.length > 1 ? pieces.pop()!.toLowerCase() : "";
}

export function normalizeFormatLabel(format: string): string {
  const normalized = format.toLowerCase().replace(/^image\//, "");
  return labels[normalized] ?? normalized.toUpperCase();
}

export function resolveInputKind(fileName = "", mimeType = "", explicitExtension = ""): InputKind | "unknown" {
  const extension = (explicitExtension || getFileExtension(fileName)).toLowerCase();
  const normalizedMime = mimeType.toLowerCase();

  if (rawExtensions.has(extension)) {
    return "raw";
  }

  if (heifExtensions.has(extension) || normalizedMime === "image/heic" || normalizedMime === "image/heif") {
    return "heif";
  }

  if (tiffExtensions.has(extension) || normalizedMime === "image/tiff") {
    return "tiff";
  }

  if (
    nativeExtensions.has(extension) ||
    normalizedMime.startsWith("image/") ||
    normalizedMime === "image/avif"
  ) {
    return "native";
  }

  return "unknown";
}

export function inspectFormatSupport({
  fileName = "",
  mimeType = "",
  extension = "",
}: {
  fileName?: string;
  mimeType?: string;
  extension?: string;
}): FormatSupportResult {
  const resolvedExtension = (extension || getFileExtension(fileName)).toLowerCase();
  const inputKind = resolveInputKind(fileName, mimeType, resolvedExtension);
  const sourceFormat = normalizeFormatLabel(resolvedExtension || mimeType || "image");

  if (inputKind === "unknown") {
    return {
      accepted: false,
      inputKind,
      sourceFormat,
      supportedOutputs: [],
      previewOnly: false,
      decoderPath: "unsupported",
      caveats: ["현재 검증된 입력 형식이 아닙니다."],
    };
  }

  const caveats: string[] = [];
  let previewOnly = false;
  let decoderPath = "browser-native";

  if (inputKind === "raw") {
    decoderPath = previewPreferredRawExtensions.has(resolvedExtension)
      ? "embedded-preview-first"
      : "libraw-wasm";
    previewOnly = previewPreferredRawExtensions.has(resolvedExtension);
    caveats.push("RAW 계열은 카메라 모델별 차이로 결과가 달라질 수 있습니다.");
    if (previewOnly) {
      caveats.push("CR3/CRAW는 내장 프리뷰 JPEG를 우선 사용합니다.");
    }
  }

  if (inputKind === "heif") {
    decoderPath = "libheif-js";
    caveats.push("HEIC/HEIF는 브라우저 메모리 한계에 따라 큰 파일에서 느릴 수 있습니다.");
  }

  if (inputKind === "tiff") {
    decoderPath = "utif-js";
    caveats.push("일부 TIFF 변형은 레이어나 색상 프로파일이 단순화될 수 있습니다.");
  }

  return {
    accepted: true,
    inputKind,
    sourceFormat,
    supportedOutputs: [...outputFormats],
    previewOnly,
    decoderPath,
    caveats,
  };
}
