import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { registerWidgetResource } from "./lib/resource-registry";
import { registerOpenConverterWorkspaceTool } from "./tools/open-converter-workspace";
import { registerAnalyzeSourceImageTool } from "./tools/analyze-source-image";
import { registerRecommendExportPresetTool } from "./tools/recommend-export-preset";
import { registerInspectFormatSupportTool } from "./tools/inspect-format-support";
import { registerReportConversionResultTool } from "./tools/report-conversion-result";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.resolve(__dirname, "..");
const staticRoot = path.join(distRoot, "static");
const port = Number(process.env.PORT || "8788");
const baseUrl = process.env.NLC_CHATGPT_APP_BASE_URL || `http://127.0.0.1:${port}/`;

async function serveStaticFile(requestPath: string, req: any, res: any) {
  const normalizedPath = requestPath.replace(/^\/+/, "");
  const filePath = path.join(staticRoot, normalizedPath.replace(/^static\//, ""));
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".js"
      ? "text/javascript; charset=utf-8"
      : ext === ".css"
        ? "text/css; charset=utf-8"
        : ext === ".html"
          ? "text/html; charset=utf-8"
          : ext === ".wasm"
            ? "application/wasm"
            : "application/octet-stream";

  const body = await readFile(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(req.method === "HEAD" ? undefined : body);
}

function createAppServer() {
  const server = new McpServer(
    {
      name: "negative-lab-converter-chatgpt",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  registerWidgetResource(server, baseUrl);
  registerOpenConverterWorkspaceTool(server);
  registerAnalyzeSourceImageTool(server);
  registerRecommendExportPresetTool(server);
  registerInspectFormatSupportTool(server);
  registerReportConversionResultTool(server);

  return server;
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, baseUrl);

  if (req.method === "OPTIONS" && url.pathname === "/mcp") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(req.method === "HEAD" ? undefined : "Negative Lab Converter ChatGPT MCP server");
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/healthz") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(
      req.method === "HEAD"
        ? undefined
        : JSON.stringify({
            ok: true,
            mcpPath: "/mcp",
            previewPath: "/preview",
          })
    );
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/preview") {
    await serveStaticFile("/static/preview.html", req, res);
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname.startsWith("/static/")) {
    try {
      await serveStaticFile(url.pathname, req, res);
    } catch {
      res.writeHead(404).end("Not Found");
    }
    return;
  }

  const mcpMethods = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === "/mcp" && req.method && mcpMethods.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createAppServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("MCP request failed:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal Server Error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(`Negative Lab Converter ChatGPT app listening on ${baseUrl}mcp`);
});
