import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { getSession } from "../lib/sessions";
import { reportResultInputSchema } from "../lib/schemas";

function noAuthSecurity() {
  return [{ type: "noauth" as const }];
}

export function registerReportConversionResultTool(server: any) {
  registerAppTool(
    server,
    "report_conversion_result",
    {
      title: "Report conversion result",
      description:
        "Use this when the widget finishes a local conversion and wants ChatGPT to summarize the outcome and suggest next actions.",
      inputSchema: reportResultInputSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        securitySchemes: noAuthSecurity(),
        ui: {
          visibility: ["app"],
        },
      },
    },
    async (input: any) => {
      const session = getSession(input.session_id);
      const sizeDeltaPercent =
        input.source_bytes > 0
          ? Math.round(((input.result_bytes - input.source_bytes) / input.source_bytes) * 100)
          : 0;

      const summaryLine = `${input.width}×${input.height} ${input.target_format.toUpperCase()} 파일 ${input.download_name} 준비 완료`;
      const recommendedFollowUp =
        sizeDeltaPercent > 20
          ? "품질을 한 단계 낮추거나 WebP로 다시 변환해 보세요."
          : "현재 설정이 무난합니다. 다른 용도용 버전이 필요하면 intent를 바꿔 다시 추천받을 수 있습니다.";

      return {
        structuredContent: {
          summary_line: summaryLine,
          size_delta_percent: sizeDeltaPercent,
          recommended_follow_up: recommendedFollowUp,
          session_state: {
            session_id: input.session_id,
            intent: session?.intent ?? "custom",
          },
        },
        content: [
          {
            type: "text",
            text: `${summaryLine}. 원본 대비 ${sizeDeltaPercent}% 변화했습니다.`,
          },
        ],
      };
    }
  );
}
