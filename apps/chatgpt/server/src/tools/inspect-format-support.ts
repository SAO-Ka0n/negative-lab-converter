import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { inspectFormatSupport } from "../../../../../packages/converter-core/src/formats";
import { inspectSupportInputSchema } from "../lib/schemas";

function noAuthSecurity() {
  return [{ type: "noauth" as const }];
}

export function registerInspectFormatSupportTool(server: any) {
  registerAppTool(
    server,
    "inspect_format_support",
    {
      title: "Inspect format support",
      description:
        "Use this when the user asks whether a format like CR3, CRAW, HEIC, or TIFF is supported or why it may fall back to preview-only behavior.",
      inputSchema: inspectSupportInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        securitySchemes: noAuthSecurity(),
        "openai/toolInvocation/invoking": "형식 지원 여부를 확인하는 중입니다…",
        "openai/toolInvocation/invoked": "형식 지원 정보를 준비했습니다.",
      },
    },
    async (input: any) => {
      const result = inspectFormatSupport({
        fileName: input.file_name,
        mimeType: input.mime_type,
        extension: input.extension,
      });

      return {
        structuredContent: {
          accepted: result.accepted,
          input_kind: result.inputKind,
          supported_outputs: result.supportedOutputs,
          preview_only: result.previewOnly,
          decoder_path: result.decoderPath,
          caveats: result.caveats,
        },
        content: [
          {
            type: "text",
            text: result.accepted
              ? `${result.sourceFormat} 입력을 지원합니다.`
              : `${result.sourceFormat} 입력은 현재 검증된 범위 밖입니다.`,
          },
        ],
      };
    }
  );
}
