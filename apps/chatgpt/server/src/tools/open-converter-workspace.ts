import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { outputFormats } from "../../../../../packages/converter-core/src/formats";
import { recommendExportPreset } from "../../../../../packages/converter-core/src/presets";
import { createSession } from "../lib/sessions";
import { TEMPLATE_URI } from "../lib/resource-registry";
import { openWorkspaceInputSchema } from "../lib/schemas";

function noAuthSecurity() {
  return [{ type: "noauth" as const }];
}

export function registerOpenConverterWorkspaceTool(server: any) {
  registerAppTool(
    server,
    "open_converter_workspace",
    {
      title: "Open converter workspace",
      description:
        "Use this when the user wants to start an interactive photo conversion session inside ChatGPT.",
      inputSchema: openWorkspaceInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: false,
      },
      _meta: {
        securitySchemes: noAuthSecurity(),
        ui: { resourceUri: TEMPLATE_URI },
        "openai/outputTemplate": TEMPLATE_URI,
        "openai/toolInvocation/invoking": "변환 작업 공간을 준비하는 중입니다…",
        "openai/toolInvocation/invoked": "변환 작업 공간이 준비되었습니다.",
      },
    },
    async ({ intent, preferred_format, max_long_edge }: any) => {
      const session = createSession({
        intent,
        preferredFormat: preferred_format,
      });
      const preset = recommendExportPreset({
        intent,
        preferredFormat: preferred_format,
        maxLongEdge: max_long_edge,
      });

      return {
        structuredContent: {
          session_id: session.id,
          default_preset: preset,
          supported_inputs: [
            "PNG",
            "JPEG",
            "WebP",
            "HEIC",
            "HEIF",
            "AVIF",
            "TIFF",
            "DNG",
            "CR2",
            "CR3",
            "CRAW",
            "NEF",
            "ARW",
          ],
          supported_outputs: outputFormats,
          widget_mode: "converter",
          intent,
        },
        content: [
          {
            type: "text",
            text: `변환 작업 공간을 열었습니다. 기본 추천은 ${preset.format.toUpperCase()} 출력입니다.`,
          },
        ],
        _meta: {
          session,
        },
      };
    }
  );
}
