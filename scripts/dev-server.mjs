import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const serveDir = path.resolve(root, process.argv[2] || ".");
const port = Number(process.argv[3] || 4173);
const host = "127.0.0.1";

const mimeTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
    const normalized = requestPath === "/" ? "/index.html" : requestPath;
    const filePath = path.join(serveDir, normalized);

    await access(filePath);
    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(filePath).pipe(res);
  } catch (error) {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.on("error", (error) => {
  console.error(`Unable to start dev server on http://${host}:${port}`);
  console.error(error);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Serving ${serveDir} at http://${host}:${port}`);
});
