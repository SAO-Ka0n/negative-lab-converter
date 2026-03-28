import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "product-config.js",
  "sw.js",
  "manifest.webmanifest",
  "PRIVACY_POLICY.md",
  "TERMS_OF_USE.md",
  "REFUND_POLICY.md",
  "THIRD_PARTY_NOTICES.md"
];

const vendorFiles = [
  {
    sourceDir: path.join(root, "node_modules", "libheif-js", "libheif-wasm"),
    targetDir: path.join(dist, "vendor", "libheif"),
    files: ["libheif-bundle.mjs", "libheif.js", "libheif.wasm"],
  },
  {
    sourceDir: path.join(root, "node_modules", "libraw-wasm", "dist"),
    targetDir: path.join(dist, "vendor", "libraw"),
    files: ["index.js", "libraw.js", "libraw.wasm", "worker.js"],
  },
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of files) {
  await cp(path.join(root, file), path.join(dist, file));
}

await cp(path.join(root, "icons"), path.join(dist, "icons"), { recursive: true });
await cp(path.join(root, "qa"), path.join(dist, "qa"), { recursive: true });
await mkdir(path.join(dist, "vendor"), { recursive: true });
await mkdir(path.join(dist, "vendor", "pako"), { recursive: true });
await mkdir(path.join(dist, "vendor", "utif"), { recursive: true });
await cp(
  path.join(root, "node_modules", "pako", "dist", "pako.min.js"),
  path.join(dist, "vendor", "pako", "pako.min.js")
);
await cp(
  path.join(root, "node_modules", "utif", "UTIF.js"),
  path.join(dist, "vendor", "utif", "UTIF.js")
);

for (const vendor of vendorFiles) {
  await mkdir(vendor.targetDir, { recursive: true });

  for (const file of vendor.files) {
    await cp(path.join(vendor.sourceDir, file), path.join(vendor.targetDir, file));
  }
}

console.log(`Built web assets into ${dist}`);
