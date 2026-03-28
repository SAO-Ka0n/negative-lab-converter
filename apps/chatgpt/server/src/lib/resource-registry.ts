import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.resolve(__dirname, "../../dist");

export const TEMPLATE_URI = "ui://widget/converter-workspace-v1.html";

function buildWidgetHtml(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${normalizedBaseUrl}static/widget.css" />
  </head>
  <body>
    <div id="root"></div>
    <script>window.__NLC_WIDGET_BASE_URL__ = ${JSON.stringify(`${normalizedBaseUrl}static/`)};</script>
    <script type="module" src="${normalizedBaseUrl}static/widget.js"></script>
  </body>
</html>`;
}

export function registerWidgetResource(server: any, baseUrl: string) {
  const origin = new URL(baseUrl).origin;
  const widgetJs = readFileSync(path.join(distRoot, "static", "widget.js"), "utf8");
  const widgetCss = readFileSync(path.join(distRoot, "static", "widget.css"), "utf8");
  void widgetJs;
  void widgetCss;

  registerAppResource(server, "converter-widget", TEMPLATE_URI, {}, async () => ({
    contents: [
      {
        uri: TEMPLATE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: buildWidgetHtml(baseUrl),
        _meta: {
          ui: {
            prefersBorder: true,
            domain: origin,
            csp: {
              connectDomains: [origin],
              resourceDomains: [origin],
            },
          },
          "openai/widgetDescription":
            "한 장의 사진을 업로드해 로컬로 미리보고 변환한 뒤 결과를 다운로드하는 인터랙티브 사진 변환기입니다.",
        },
      },
    ],
  }));
}
