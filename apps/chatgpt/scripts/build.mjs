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

function renderDocument({ title, body }) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f1e8;
        --ink: #1d1714;
        --muted: #62554c;
        --line: rgba(76, 52, 36, 0.2);
        --card: rgba(255, 251, 245, 0.92);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.38), rgba(246,241,232,0.96)),
          repeating-linear-gradient(
            90deg,
            rgba(140, 120, 98, 0.08) 0,
            rgba(140, 120, 98, 0.08) 1px,
            transparent 1px,
            transparent 48px
          ),
          var(--bg);
        color: var(--ink);
      }
      main {
        max-width: 880px;
        margin: 0 auto;
        padding: 48px 20px 72px;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--line);
        box-shadow: 0 24px 60px rgba(38, 25, 13, 0.08);
        padding: 32px;
      }
      h1, h2 { margin: 0 0 16px; line-height: 1.1; }
      h1 { font-size: clamp(2rem, 4vw, 3.3rem); }
      h2 { font-size: 1.3rem; margin-top: 32px; }
      p, li { font-size: 1.02rem; line-height: 1.75; color: var(--muted); }
      ul { padding-left: 20px; }
      .eyebrow {
        display: inline-block;
        margin-bottom: 14px;
        padding: 6px 10px;
        border: 1px solid rgba(126, 74, 45, 0.28);
        color: #8b4e2d;
        font: 700 0.72rem/1.1 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      a { color: #7a3a16; }
      .meta { margin-top: 24px; font-size: 0.92rem; color: var(--muted); }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        ${body}
      </section>
    </main>
  </body>
</html>`;
}

async function writeSupplementalPages() {
  const privacyHtml = renderDocument({
    title: "Negative Lab Converter Privacy Policy",
    body: `
      <div class="eyebrow">Privacy Policy</div>
      <h1>Negative Lab Converter Privacy Policy</h1>
      <p>Last updated: 2026-03-30</p>
      <p>Negative Lab Converter is designed to process images locally on the user's device whenever possible. The app is built to minimize data collection and to avoid transmitting image contents to the developer by default.</p>
      <h2>What we collect</h2>
      <ul>
        <li>By default, the app does not upload the user's source image files or converted output files to the developer.</li>
        <li>The app may display local diagnostic information inside the widget or app UI. This information is not automatically transmitted unless the user explicitly shares it.</li>
      </ul>
      <h2>How files are handled</h2>
      <ul>
        <li>Files are previewed and converted locally on the user's device.</li>
        <li>Core actions include preview generation, format conversion, resizing, and quality adjustment.</li>
      </ul>
      <h2>Third-party services</h2>
      <p>The ChatGPT app runtime is hosted on Render. The app itself may rely on platform infrastructure needed to serve the MCP server and widget, but the image conversion flow is intended to stay local to the user's browser session unless explicitly extended in a future version.</p>
      <h2>Contact</h2>
      <p>For privacy questions, use the current support channel listed in the app submission materials or repository documentation.</p>
      <div class="meta">Source repository: <a href="https://github.com/SAO-Ka0n/negative-lab-converter">github.com/SAO-Ka0n/negative-lab-converter</a></div>
    `,
  });

  const appInfoHtml = renderDocument({
    title: "Negative Lab Converter App Info",
    body: `
      <div class="eyebrow">App Info</div>
      <h1>Negative Lab Converter for ChatGPT</h1>
      <p>Negative Lab Converter is a photo conversion utility built for ChatGPT. It helps users upload one image, preview it inside ChatGPT, apply a practical export preset, and download the converted result.</p>
      <h2>Core capabilities</h2>
      <ul>
        <li>One-image conversion flow inside ChatGPT</li>
        <li>Preview and compare before download</li>
        <li>Practical presets for web, social, print, archive, and custom output</li>
        <li>Best-effort support for HEIC, TIFF, and selected RAW formats</li>
      </ul>
      <h2>Current public endpoints</h2>
      <ul>
        <li><a href="/mcp">MCP endpoint</a></li>
        <li><a href="/preview">Widget preview</a></li>
        <li><a href="/privacy-policy">Privacy policy</a></li>
      </ul>
      <h2>Important note</h2>
      <p>This ChatGPT app should be positioned as a utility tool, not a commerce experience. For the current policy window, digital upsells should stay outside the ChatGPT app flow.</p>
      <div class="meta">Repository: <a href="https://github.com/SAO-Ka0n/negative-lab-converter">github.com/SAO-Ka0n/negative-lab-converter</a></div>
    `,
  });

  await writeFile(path.join(staticRoot, "privacy-policy.html"), privacyHtml, "utf8");
  await writeFile(path.join(staticRoot, "app-info.html"), appInfoHtml, "utf8");
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
  await writeSupplementalPages();
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
  await writeSupplementalPages();
  await Promise.all(contexts.map((context) => context.watch()));
  console.log("Watching ChatGPT app bundles...");
} else {
  await buildOnce();
  console.log(`Built ChatGPT app into ${distRoot}`);
}
