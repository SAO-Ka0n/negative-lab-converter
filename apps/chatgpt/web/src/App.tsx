import { useEffect, useMemo, useRef, useState } from "react";

import { decodeSourceFile, convertDecodedImage, type DecodedImage } from "../../shared/converter-core/src/browser-decoders";
import { normalizeUnknownError } from "../../shared/converter-core/src/errors";
import { inspectFormatSupport } from "../../shared/converter-core/src/formats";
import { fitDimensionsWithinLimits, validateOutputDimensions } from "../../shared/converter-core/src/limits";
import {
  recommendExportPreset,
  type ConversionIntent,
  type ExportPreset,
} from "../../shared/converter-core/src/presets";
import { ComparePane } from "./components/ComparePane";
import { ConverterShell } from "./components/ConverterShell";
import { DownloadBar } from "./components/DownloadBar";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatusBanner } from "./components/StatusBanner";
import { UnsupportedState } from "./components/UnsupportedState";
import { UploadPanel } from "./components/UploadPanel";
import { useToolResult } from "./hooks/useToolResult";

type StatusTone = "neutral" | "success" | "warning" | "error";

const DEFAULT_PRESET = recommendExportPreset({ intent: "web" });

function mimeFromFormat(format: string) {
  if (format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  if (format === "tiff") return "image/tiff";
  return "image/webp";
}

function outputExtension(format: string) {
  if (format === "jpeg") return "jpg";
  return format;
}

export default function App() {
  const toolResult = useToolResult<any>();
  const openWorkspace = toolResult?.default_preset ? toolResult : undefined;
  const workspacePreset = (openWorkspace?.default_preset as ExportPreset | undefined) ?? DEFAULT_PRESET;

  const [intent, setIntent] = useState<ConversionIntent>((openWorkspace?.intent as ConversionIntent) || "web");
  const [format, setFormat] = useState<string>(workspacePreset.format);
  const [width, setWidth] = useState<number>(workspacePreset.targetWidth || 0);
  const [height, setHeight] = useState<number>(workspacePreset.targetHeight || 0);
  const [quality, setQuality] = useState<number>(workspacePreset.quality ?? 0.9);
  const [background, setBackground] = useState<string>(workspacePreset.background ?? "#f5f0e8");
  const [lockAspect, setLockAspect] = useState(true);
  const [status, setStatus] = useState<{ tone: StatusTone; message: string }>({
    tone: "neutral",
    message: "사진을 한 장 올리면 이 안에서 바로 미리보고 변환할 수 있습니다.",
  });
  const [warnings, setWarnings] = useState<string[]>(workspacePreset.warnings);
  const [loading, setLoading] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [converted, setConverted] = useState<{ blob: Blob; objectUrl: string } | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string>("");
  const [convertedSummary, setConvertedSummary] = useState<string>("");
  const [unsupportedDetail, setUnsupportedDetail] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIntent((openWorkspace?.intent as ConversionIntent) || "web");
    setFormat(workspacePreset.format);
    setQuality(workspacePreset.quality ?? 0.9);
    setBackground(workspacePreset.background ?? "#f5f0e8");
    if (!decoded) {
      setWidth(workspacePreset.targetWidth || 0);
      setHeight(workspacePreset.targetHeight || 0);
    }
    setWarnings(workspacePreset.warnings);
  }, [decoded, openWorkspace?.intent, workspacePreset.background, workspacePreset.format, workspacePreset.quality, workspacePreset.targetHeight, workspacePreset.targetWidth, workspacePreset.warnings]);

  const originalMeta = useMemo(() => {
    if (!decoded || !sourceFile) return "";
    return `${decoded.width} × ${decoded.height} · ${(sourceFile.size / (1024 * 1024)).toFixed(1)} MB`;
  }, [decoded, sourceFile]);

  const convertedMeta = useMemo(() => {
    if (!converted) return "";
    return `${format.toUpperCase()} · ${(converted.blob.size / (1024 * 1024)).toFixed(1)} MB`;
  }, [converted, format]);

  function applyPreset(preset: ExportPreset, originalWidth?: number, originalHeight?: number) {
    setFormat(preset.format);
    setQuality(preset.quality ?? 0.9);
    setBackground(preset.background ?? "#f5f0e8");
    setWarnings(preset.warnings);

    const nextDims = fitDimensionsWithinLimits(
      preset.targetWidth || originalWidth || width || 1,
      preset.targetHeight || originalHeight || height || 1
    );
    setWidth(nextDims.width);
    setHeight(nextDims.height);
  }

  async function syncPreset(nextIntent: ConversionIntent, nextSource?: { width?: number; height?: number; format?: string }) {
    const localPreset = recommendExportPreset({
      intent: nextIntent,
      originalWidth: nextSource?.width,
      originalHeight: nextSource?.height,
      sourceFormat: nextSource?.format,
    });
    applyPreset(localPreset, nextSource?.width, nextSource?.height);

    if (!window.openai?.callTool) {
      return;
    }

    try {
      const response = await window.openai.callTool("recommend_export_preset", {
        intent: nextIntent,
        source_format: nextSource?.format,
        original_width: nextSource?.width,
        original_height: nextSource?.height,
      });
      const preset = response?.structuredContent;
      if (preset) {
        applyPreset(
          {
            presetId: preset.preset_id,
            format: preset.format,
            quality: preset.quality,
            targetWidth: preset.target_width,
            targetHeight: preset.target_height,
            background: preset.background,
            reasoning: preset.reasoning,
            warnings: preset.warnings ?? [],
          },
          nextSource?.width,
          nextSource?.height
        );
      }
    } catch {
      // The local preset is already applied.
    }
  }

  async function analyzeWithServer(file: File) {
    if (!window.openai?.uploadFile || !window.openai?.getFileDownloadUrl || !window.openai?.callTool) {
      return;
    }

    try {
      const upload = await window.openai.uploadFile(file, { library: false });
      const { downloadUrl } = await window.openai.getFileDownloadUrl({ fileId: upload.fileId });
      const response = await window.openai.callTool("analyze_source_image", {
        source_image: {
          file_id: upload.fileId,
          download_url: downloadUrl,
        },
        intent,
      });
      const result = response?.structuredContent;
      if (result) {
        setAnalysisSummary(
          `${result.source_format} · ${result.decoder_path}${result.preview_only ? " · preview only" : ""}`
        );
        if (Array.isArray(result.warnings)) {
          setWarnings((current) => Array.from(new Set([...current, ...result.warnings])));
        }
      }
    } catch {
      setAnalysisSummary("로컬 분석만 사용 중");
    }
  }

  async function onFileChange(file: File | null) {
    if (!file) {
      return;
    }

    setLoading(true);
    setSourceFile(file);
    setConverted(null);
    setConvertedSummary("");
    setUnsupportedDetail("");

    const support = inspectFormatSupport({ fileName: file.name, mimeType: file.type });
    setWarnings(support.caveats);
    setAnalysisSummary(`${support.sourceFormat} · ${support.decoderPath}`);

    try {
      const nextDecoded = await decodeSourceFile(file);
      setDecoded((current) => {
        if (current?.previewUrl && current.previewUrl !== nextDecoded.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }
        return nextDecoded;
      });
      const nextDims = fitDimensionsWithinLimits(nextDecoded.width, nextDecoded.height);
      setWidth(nextDims.width);
      setHeight(nextDims.height);
      setStatus({
        tone: "success",
        message: `${file.name}을 불러왔습니다. ${nextDecoded.width} × ${nextDecoded.height} 기준으로 변환할 수 있습니다.`,
      });
      await syncPreset(intent, {
        width: nextDecoded.width,
        height: nextDecoded.height,
        format: nextDecoded.sourceType,
      });
      void analyzeWithServer(file);
    } catch (error) {
      const message = normalizeUnknownError(error, "파일을 읽지 못했습니다.");
      setDecoded(null);
      setUnsupportedDetail(message);
      setStatus({ tone: "error", message });
    } finally {
      setLoading(false);
    }
  }

  async function handleConvert() {
    if (!decoded || !sourceFile) {
      return;
    }

    const validationMessage = validateOutputDimensions(width, height);
    if (validationMessage) {
      setStatus({ tone: "warning", message: validationMessage });
      return;
    }

    setLoading(true);

    try {
      const result = await convertDecodedImage(decoded, {
        type: mimeFromFormat(format) as "image/jpeg" | "image/png" | "image/webp" | "image/tiff",
        width,
        height,
        quality,
        background,
      });

      setConverted((current) => {
        if (current?.objectUrl) {
          URL.revokeObjectURL(current.objectUrl);
        }
        return result;
      });

      const downloadName = `${sourceFile.name.replace(/\.[^.]+$/, "")}.${outputExtension(format)}`;
      setConvertedSummary(downloadName);
      setStatus({
        tone: "success",
        message: `${format.toUpperCase()} 결과를 준비했습니다. 이제 바로 다운로드할 수 있습니다.`,
      });

      if (window.openai?.callTool && openWorkspace?.session_id) {
        try {
          const response = await window.openai.callTool("report_conversion_result", {
            session_id: openWorkspace.session_id,
            source_format: decoded.sourceType,
            target_format: format,
            source_bytes: sourceFile.size,
            result_bytes: result.blob.size,
            width,
            height,
            download_name: downloadName,
            warnings,
          });
          setConvertedSummary(response?.structuredContent?.summary_line || downloadName);
        } catch {
          setConvertedSummary(downloadName);
        }
      }
    } catch (error) {
      setStatus({
        tone: "error",
        message: normalizeUnknownError(error, "변환에 실패했습니다."),
      });
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!converted || !sourceFile) {
      return;
    }

    const link = document.createElement("a");
    link.href = converted.objectUrl;
    link.download = `${sourceFile.name.replace(/\.[^.]+$/, "")}.${outputExtension(format)}`;
    link.click();
  }

  function handleReset() {
    if (decoded?.previewUrl) {
      URL.revokeObjectURL(decoded.previewUrl);
    }
    if (converted?.objectUrl) {
      URL.revokeObjectURL(converted.objectUrl);
    }
    setSourceFile(null);
    setDecoded(null);
    setConverted(null);
    setWarnings([]);
    setAnalysisSummary("");
    setConvertedSummary("");
    setUnsupportedDetail("");
    setStatus({
      tone: "neutral",
      message: "사진을 한 장 올리면 이 안에서 바로 미리보고 변환할 수 있습니다.",
    });
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function adjustDimensions(nextWidth: number, nextHeight: number) {
    if (!decoded || !lockAspect) {
      setWidth(nextWidth);
      setHeight(nextHeight);
      return;
    }

    const ratio = decoded.width / decoded.height;
    const adjustedHeight = Math.max(1, Math.round(nextWidth / ratio));
    const adjustedWidth = Math.max(1, Math.round(nextHeight * ratio));

    if (nextWidth !== width) {
      const fitted = fitDimensionsWithinLimits(nextWidth, adjustedHeight);
      setWidth(fitted.width);
      setHeight(fitted.height);
      return;
    }

    const fitted = fitDimensionsWithinLimits(adjustedWidth, nextHeight);
    setWidth(fitted.width);
    setHeight(fitted.height);
  }

  return (
    <ConverterShell
      title="Negative Lab Converter"
      subtitle="사진 1장을 올리면 ChatGPT 안에서 설정을 추천하고, 결과는 이 iframe 안에서 로컬로 변환해 다운로드합니다."
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.3fr,.arw,.avif,.cr2,.cr3,.crw,.dcr,.dng,.erf,.fff,.gpr,.heic,.heif,.iiq,.k25,.kdc,.mef,.mos,.mrw,.nef,.nrw,.orf,.pef,.raf,.raw,.rw2,.sr2,.srf,.srw,.tif,.tiff,.x3f"
        hidden
        onChange={(event) => void onFileChange(event.target.files?.[0] || null)}
      />

      <StatusBanner tone={status.tone} message={status.message} />

      {warnings.length > 0 ? (
        <section className="status-banner status-warning">
          <ul className="warning-list">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {analysisSummary ? (
        <section className="status-banner status-neutral">
          <p>{analysisSummary}</p>
        </section>
      ) : null}

      {unsupportedDetail ? <UnsupportedState detail={unsupportedDetail} /> : null}

      <div className="workspace-grid">
        <div className="left-column">
          <UploadPanel
            fileName={sourceFile?.name}
            inputKind={decoded?.sourceType}
            loading={loading}
            onPickFile={() => inputRef.current?.click()}
            onReset={handleReset}
          />

          <SettingsPanel
            background={background}
            disabled={!decoded || loading}
            format={format}
            height={height}
            intent={intent}
            lockAspect={lockAspect}
            quality={quality}
            width={width}
            onBackgroundChange={setBackground}
            onConvert={() => void handleConvert()}
            onFormatChange={setFormat}
            onHeightChange={(value) => adjustDimensions(width, value)}
            onIntentChange={(value) => {
              setIntent(value);
              void syncPreset(value, decoded ? { width: decoded.width, height: decoded.height, format: decoded.sourceType } : undefined);
            }}
            onLockAspectChange={setLockAspect}
            onQualityChange={setQuality}
            onWidthChange={(value) => adjustDimensions(value, height)}
          />
        </div>

        <div className="right-column">
          <ComparePane
            convertedMeta={convertedMeta}
            convertedUrl={converted?.objectUrl}
            originalMeta={originalMeta}
            originalUrl={decoded?.previewUrl}
          />
        </div>
      </div>

      <DownloadBar
        downloadDisabled={!converted}
        fileName={convertedSummary || "결과 파일명은 변환 후 표시됩니다."}
        summary={converted ? `원본 대비 ${(converted.blob.size / Math.max(sourceFile?.size || 1, 1) * 100).toFixed(0)}% 크기` : undefined}
        onDownload={handleDownload}
      />
    </ConverterShell>
  );
}
