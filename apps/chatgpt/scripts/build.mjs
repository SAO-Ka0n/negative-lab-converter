import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "../..");
const distRoot = path.join(appRoot, "dist");
const staticRoot = path.join(distRoot, "static");
const serverRoot = path.join(distRoot, "server");
const watch = process.argv.includes("--watch");

async function copyVendors() {
  await mkdir(path.join(staticRoot, "vendor", "libheif"), { recursive: true });
  await mkdir(path.join(staticRoot, "vendor", "libraw"), { recursive: true });
  await mkdir(path.join(staticRoot, "vendor", "utif"), { recursive: true });

  const vendorCopies = [
    [
      path.join(appRoot, "node_modules", "libheif-js", "libheif-wasm", "libheif-bundle.mjs"),
      path.join(staticRoot, "vendor", "libheif", "libheif-bundle.mjs"),
    ],
    [
      path.join(appRoot, "node_modules", "libheif-js", "libheif-wasm", "libheif.js"),
      path.join(staticRoot, "vendor", "libheif", "libheif.js"),
    ],
    [
      path.join(appRoot, "node_modules", "libheif-js", "libheif-wasm", "libheif.wasm"),
      path.join(staticRoot, "vendor", "libheif", "libheif.wasm"),
    ],
    [
      path.join(appRoot, "node_modules", "libraw-wasm", "dist", "index.js"),
      path.join(staticRoot, "vendor", "libraw", "index.js"),
    ],
    [
      path.join(appRoot, "node_modules", "libraw-wasm", "dist", "libraw.js"),
      path.join(staticRoot, "vendor", "libraw", "libraw.js"),
    ],
    [
      path.join(appRoot, "node_modules", "libraw-wasm", "dist", "libraw.wasm"),
      path.join(staticRoot, "vendor", "libraw", "libraw.wasm"),
    ],
    [
      path.join(appRoot, "node_modules", "libraw-wasm", "dist", "worker.js"),
      path.join(staticRoot, "vendor", "libraw", "worker.js"),
    ],
    [
      path.join(appRoot, "node_modules", "utif", "UTIF.js"),
      path.join(staticRoot, "vendor", "utif", "UTIF.js"),
    ],
  ];

  await Promise.all(vendorCopies.map(([from, to]) => cp(from, to)));
}

async function writePreviewShell() {
  const previewHtml = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Negative Lab Converter ChatGPT Widget Preview</title>
    <link rel="stylesheet" href="/static/widget.css" />
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.__NLC_WIDGET_BASE_URL__ = window.location.origin + "/static/";
    </script>
    <script type="module" src="/static/widget.js"></script>
  </body>
</html>`;

  await writeFile(path.join(staticRoot, "preview.html"), previewHtml, "utf8");
}

async function buildOnce() {
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(staticRoot, { recursive: true });
  await mkdir(serverRoot, { recursive: true });

  await esbuild.build({
    entryPoints: [path.join(appRoot, "web", "src", "main.tsx")],
    bundle: true,
    format: "esm",
    jsx: "automatic",
    sourcemap: true,
    outfile: path.join(staticRoot, "widget.js"),
    loader: {
      ".ts": "ts",
      ".tsx": "tsx",
      ".css": "css",
    },
    define: {
      __NLC_PRODUCT_NAME__: JSON.stringify("Negative Lab Converter"),
    },
  });

  await esbuild.build({
    entryPoints: [path.join(appRoot, "server", "src", "index.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    sourcemap: true,
    outfile: path.join(serverRoot, "index.js"),
    external: [
      "@modelcontextprotocol/sdk",
      "@modelcontextprotocol/sdk/*",
      "@modelcontextprotocol/ext-apps",
      "@modelcontextprotocol/ext-apps/*",
      "zod",
    ],
    loader: {
      ".ts": "ts",
    },
    define: {
      __NLC_REPO_ROOT__: JSON.stringify(repoRoot),
    },
  });

  await copyVendors();
  await writePreviewShell();
}

if (watch) {
  await buildOnce();
  const contexts = await Promise.all([
    esbuild.context({
      entryPoints: [path.join(appRoot, "web", "src", "main.tsx")],
      bundle: true,
      format: "esm",
      jsx: "automatic",
      sourcemap: true,
      outfile: path.join(staticRoot, "widget.js"),
      loader: {
        ".ts": "ts",
        ".tsx": "tsx",
        ".css": "css",
      },
      define: {
        __NLC_PRODUCT_NAME__: JSON.stringify("Negative Lab Converter"),
      },
    }),
    esbuild.context({
      entryPoints: [path.join(appRoot, "server", "src", "index.ts")],
      bundle: true,
      platform: "node",
      format: "esm",
      sourcemap: true,
      outfile: path.join(serverRoot, "index.js"),
      external: [
        "@modelcontextprotocol/sdk",
        "@modelcontextprotocol/sdk/*",
        "@modelcontextprotocol/ext-apps",
        "@modelcontextprotocol/ext-apps/*",
        "zod",
      ],
      loader: {
        ".ts": "ts",
      },
      define: {
        __NLC_REPO_ROOT__: JSON.stringify(repoRoot),
      },
    }),
  ]);

  await copyVendors();
  await writePreviewShell();
  await Promise.all(contexts.map((context) => context.watch()));
  console.log("Watching ChatGPT app bundles...");
} else {
  await buildOnce();
  console.log(`Built ChatGPT app into ${distRoot}`);
}
