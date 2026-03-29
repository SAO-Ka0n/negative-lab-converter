import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { recommendExportPreset } from "../../../shared/converter-core/src/presets";
import { recommendPresetInputSchema } from "../lib/schemas";

function noAuthSecurity() {
  return [{ type: "noauth" as const }];
}

export function registerRecommendExportPresetTool(server: any) {
  registerAppTool(
    server,
    "recommend_export_preset",
    {
      title: "Recommend export preset",
      description:
        "Use this when the user describes the target use and needs concrete export settings.",
      inputSchema: recommendPresetInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        securitySchemes: noAuthSecurity(),
        "openai/toolInvocation/invoking": "추천 설정을 계산하는 중입니다…",
        "openai/toolInvocation/invoked": "추천 설정을 준비했습니다.",
      },
    },
    async (input: any) => {
      const preset = recommendExportPreset({
        intent: input.intent,
        sourceFormat: input.source_format,
        originalWidth: input.original_width,
        originalHeight: input.original_height,
        hasTransparency: input.has_transparency,
        maxFileSizeMb: input.max_file_size_mb,
      });

      return {
        structuredContent: {
          preset_id: preset.presetId,
          format: preset.format,
          quality: preset.quality,
          target_width: preset.targetWidth,
          target_height: preset.targetHeight,
          background: preset.background,
          reasoning: preset.reasoning,
          warnings: preset.warnings,
        },
        content: [
          {
            type: "text",
            text: `${preset.format.toUpperCase()} 기준 추천 설정을 준비했습니다.`,
          },
        ],
      };
    }
  );
}
