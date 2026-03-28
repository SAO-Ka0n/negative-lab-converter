import { clampRequestedLongEdge } from "./limits";
import type { OutputFormat } from "./formats";

export type ConversionIntent = "web" | "social" | "print" | "archive" | "custom";

export interface ExportPresetInput {
  intent: ConversionIntent;
  sourceFormat?: string;
  originalWidth?: number;
  originalHeight?: number;
  hasTransparency?: boolean;
  maxFileSizeMb?: number;
  preferredFormat?: OutputFormat;
  maxLongEdge?: number;
}

export interface ExportPreset {
  presetId: string;
  format: OutputFormat;
  quality?: number;
  targetWidth?: number;
  targetHeight?: number;
  background?: string;
  reasoning: string;
  warnings: string[];
}

function fitLongEdge(
  originalWidth?: number,
  originalHeight?: number,
  preferredLongEdge?: number
): Pick<ExportPreset, "targetWidth" | "targetHeight"> {
  if (!originalWidth || !originalHeight) {
    if (!preferredLongEdge) {
      return {};
    }

    return { targetWidth: preferredLongEdge };
  }

  const longEdge = Math.max(originalWidth, originalHeight);
  const shortEdge = Math.min(originalWidth, originalHeight);
  const nextLongEdge = Math.min(longEdge, preferredLongEdge ?? longEdge);

  if (originalWidth >= originalHeight) {
    return {
      targetWidth: nextLongEdge,
      targetHeight: Math.max(1, Math.round((shortEdge / longEdge) * nextLongEdge)),
    };
  }

  return {
    targetWidth: Math.max(1, Math.round((shortEdge / longEdge) * nextLongEdge)),
    targetHeight: nextLongEdge,
  };
}

export function recommendExportPreset(input: ExportPresetInput): ExportPreset {
  const warnings: string[] = [];
  const preferredLongEdge = clampRequestedLongEdge(input.maxLongEdge);
  const dims = fitLongEdge(input.originalWidth, input.originalHeight, preferredLongEdge);
  const transparency = Boolean(input.hasTransparency);

  if (transparency && input.preferredFormat === "jpeg") {
    warnings.push("투명 배경을 유지하려면 JPEG보다 PNG 또는 WebP가 적합합니다.");
  }

  if ((input.sourceFormat || "").includes("RAW")) {
    warnings.push("RAW 계열은 브라우저 메모리 상태에 따라 프리뷰가 느려질 수 있습니다.");
  }

  switch (input.intent) {
    case "web":
      return {
        presetId: "web-balanced",
        format: transparency ? "png" : input.preferredFormat ?? "webp",
        quality: transparency ? undefined : 0.82,
        background: transparency ? undefined : "#f5f0e8",
        reasoning: "웹 업로드 기준으로 용량과 품질의 균형을 맞춘 설정입니다.",
        warnings,
        ...fitLongEdge(input.originalWidth, input.originalHeight, preferredLongEdge ?? 1920),
      };
    case "social":
      return {
        presetId: "social-share",
        format: transparency ? "png" : input.preferredFormat ?? "jpeg",
        quality: transparency ? undefined : 0.86,
        background: transparency ? undefined : "#f5f0e8",
        reasoning: "SNS 업로드와 메시지 공유에 맞춰 빠르게 보이는 설정입니다.",
        warnings,
        ...fitLongEdge(input.originalWidth, input.originalHeight, preferredLongEdge ?? 2048),
      };
    case "print":
      return {
        presetId: "print-high",
        format: transparency ? "png" : input.preferredFormat ?? "jpeg",
        quality: transparency ? undefined : 0.94,
        background: transparency ? undefined : "#ffffff",
        reasoning: "인쇄 또는 고해상도 검토를 고려해 해상도 보존에 무게를 둡니다.",
        warnings,
        ...dims,
      };
    case "archive":
      return {
        presetId: "archive-master",
        format: input.preferredFormat ?? (transparency ? "png" : "tiff"),
        quality: undefined,
        background: undefined,
        reasoning: "후속 편집과 재보관을 고려해 손실을 줄이는 보관용 설정입니다.",
        warnings,
        ...dims,
      };
    case "custom":
    default:
      return {
        presetId: "custom-start",
        format: input.preferredFormat ?? (transparency ? "png" : "webp"),
        quality: input.preferredFormat === "png" || input.preferredFormat === "tiff" ? undefined : 0.9,
        background: input.preferredFormat === "jpeg" ? "#f5f0e8" : undefined,
        reasoning: "사용자가 직접 미세 조정하기 쉬운 기본 설정입니다.",
        warnings,
        ...dims,
      };
  }
}
