import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { probeSource } from "../../../shared/converter-core/src/file-sniff";
import { analyzeSourceInputSchema } from "../lib/schemas";

function noAuthSecurity() {
  return [{ type: "noauth" as const }];
}

function deriveFileName(downloadUrl: string, fileId: string) {
  try {
    const url = new URL(downloadUrl);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    return decodeURIComponent(pathSegments.at(-1) || `${fileId}.bin`);
  } catch {
    return `${fileId}.bin`;
  }
}

export function registerAnalyzeSourceImageTool(server: any) {
  registerAppTool(
    server,
    "analyze_source_image",
    {
      title: "Analyze source image",
      description:
        "Use this when the user uploads a source image and the app needs format, capability, and warning metadata before conversion.",
      inputSchema: analyzeSourceInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        securitySchemes: noAuthSecurity(),
        "openai/fileParams": ["source_image"],
        "openai/toolInvocation/invoking": "업로드된 이미지를 빠르게 분석하는 중입니다…",
        "openai/toolInvocation/invoked": "이미지 분석 정보를 준비했습니다.",
      },
    },
    async (input: any) => {
      const { source_image } = input;
      let headerBytes: Uint8Array | undefined;
      let byteSize: number | undefined;
      const warnings: string[] = [];

      try {
        const response = await fetch(source_image.download_url, {
          headers: {
            Range: "bytes=0-262143",
          },
        });

        const arrayBuffer = await response.arrayBuffer();
        headerBytes = new Uint8Array(arrayBuffer);
        byteSize = Number(response.headers.get("content-length") || arrayBuffer.byteLength || 0);
      } catch {
        warnings.push("원격 프리플라이트 분석에 실패해 확장자 기준으로만 판별했습니다.");
      }

      const probe = probeSource({
        fileName: deriveFileName(source_image.download_url, source_image.file_id),
        headerBytes,
        byteSize,
      });

      return {
        structuredContent: {
          source_id: probe.sourceId,
          file_name: probe.fileName,
          source_format: probe.sourceFormat,
          input_kind: probe.inputKind,
          byte_size: probe.byteSize,
          width: probe.width,
          height: probe.height,
          decoder_path: probe.decoderPath,
          preview_only: probe.previewOnly,
          warnings: [...probe.warnings, ...warnings],
        },
        content: [
          {
            type: "text",
            text: `${probe.fileName}을 ${probe.sourceFormat} 입력으로 분석했습니다.`,
          },
        ],
      };
    }
  );
}
