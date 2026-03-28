import { inspectFormatSupport, getFileExtension } from "./formats";

export interface SourceProbeInput {
  fileName?: string;
  mimeType?: string;
  headerBytes?: Uint8Array;
  byteSize?: number;
}

export interface SourceProbeResult {
  sourceId: string;
  fileName: string;
  sourceFormat: string;
  inputKind: "native" | "heif" | "tiff" | "raw" | "unknown";
  byteSize?: number;
  width?: number;
  height?: number;
  decoderPath: string;
  previewOnly: boolean;
  warnings: string[];
  accepted: boolean;
}

function detectPng(bytes: Uint8Array) {
  return (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

function detectJpeg(bytes: Uint8Array) {
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

function detectGif(bytes: Uint8Array) {
  return bytes.length >= 6 && String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a";
}

function detectWebp(bytes: Uint8Array) {
  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

function detectTiff(bytes: Uint8Array) {
  if (bytes.length < 4) {
    return false;
  }

  const little = bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00;
  const big = bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a;
  return little || big;
}

function detectHeif(bytes: Uint8Array) {
  if (bytes.length < 12) {
    return false;
  }

  const brand = String.fromCharCode(...bytes.slice(8, 12));
  return ["heic", "heix", "hevc", "heim", "heis", "mif1", "avif"].includes(brand);
}

function sniffExtensionFromHeader(bytes?: Uint8Array): string {
  if (!bytes?.length) {
    return "";
  }

  if (detectPng(bytes)) {
    return "png";
  }
  if (detectJpeg(bytes)) {
    return "jpg";
  }
  if (detectGif(bytes)) {
    return "gif";
  }
  if (detectWebp(bytes)) {
    return "webp";
  }
  if (detectTiff(bytes)) {
    return "tiff";
  }
  if (detectHeif(bytes)) {
    return "heic";
  }

  return "";
}

function readUint16(bytes: Uint8Array, offset: number, littleEndian = false) {
  if (offset + 1 >= bytes.length) {
    return 0;
  }

  return littleEndian
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32(bytes: Uint8Array, offset: number) {
  if (offset + 3 >= bytes.length) {
    return 0;
  }

  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

function readDimensions(bytes?: Uint8Array, extension = "") {
  if (!bytes?.length) {
    return {};
  }

  if (extension === "png" && bytes.length >= 24) {
    return {
      width: readUint32(bytes, 16),
      height: readUint32(bytes, 20),
    };
  }

  if (extension === "gif" && bytes.length >= 10) {
    return {
      width: readUint16(bytes, 6, true),
      height: readUint16(bytes, 8, true),
    };
  }

  if (extension === "jpg" || extension === "jpeg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      const length = readUint16(bytes, offset + 2);
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)) {
        return {
          height: readUint16(bytes, offset + 5),
          width: readUint16(bytes, offset + 7),
        };
      }
      if (!length) {
        break;
      }
      offset += 2 + length;
    }
  }

  if (extension === "webp" && bytes.length >= 30) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === "VP8X") {
      return {
        width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      };
    }
  }

  return {};
}

export function probeSource(input: SourceProbeInput): SourceProbeResult {
  const sniffedExtension = sniffExtensionFromHeader(input.headerBytes);
  const extension = sniffedExtension || getFileExtension(input.fileName || "");
  const support = inspectFormatSupport({
    fileName: input.fileName,
    mimeType: input.mimeType,
    extension,
  });
  const dimensions = readDimensions(input.headerBytes, extension);

  return {
    sourceId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: input.fileName || "uploaded-image",
    sourceFormat: support.sourceFormat,
    inputKind: support.inputKind,
    byteSize: input.byteSize,
    width: dimensions.width,
    height: dimensions.height,
    decoderPath: support.decoderPath,
    previewOnly: support.previewOnly,
    warnings: support.caveats,
    accepted: support.accepted,
  };
}
