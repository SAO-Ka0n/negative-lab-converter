import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const smokePort = Number(process.env.NLC_SMOKE_PORT || "4174");
const smokeUrl = `http://127.0.0.1:${smokePort}`;

const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQImWP8z8Dwn4GBgYGJAQoAHxcCAr7P3CUAAAAASUVORK5CYII=";

function findBrowserExecutable() {
  const candidates = [
    process.env.NLC_SMOKE_BROWSER_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

function resolveSamplePath(relativePath) {
  return path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
}

async function waitForServer(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Smoke server did not become ready at ${url}`);
}

function startPreviewServer() {
  return spawn(process.execPath, ["scripts/dev-server.mjs", "dist", String(smokePort)], {
    cwd: root,
    stdio: "inherit",
  });
}

async function assertCorpusSamples(page) {
  const manifestPath = path.join(root, "qa", "corpus.manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  for (const sample of manifest.samples || []) {
    const samplePath = resolveSamplePath(sample.path);
    await page.setInputFiles("#imageInput", samplePath);

    if (sample.expectedFailure) {
      await page.waitForFunction(
        () => document.querySelector("#originalFrame")?.dataset.state === "error"
      );
      continue;
    }

    await page.locator("#originalPreview").waitFor({ state: "visible" });
    const originalMeta = (await page.locator("#originalMeta").textContent()) || "";
    const [width, height] = originalMeta.split("×").map((part) => Number(part.trim()));

    assert.ok(
      width >= Number(sample.minimumWidth || 1),
      `${sample.id}: width ${width} is below expected minimum ${sample.minimumWidth}`
    );
    assert.ok(
      height >= Number(sample.minimumHeight || 1),
      `${sample.id}: height ${height} is below expected minimum ${sample.minimumHeight}`
    );
  }
}

async function main() {
  const browserPath = findBrowserExecutable();

  if (!browserPath) {
    throw new Error("No Chrome/Chromium executable found for smoke test.");
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "nlc-smoke-"));
  const pngPath = path.join(tempDir, "smoke.png");
  const invalidRawPath = path.join(tempDir, "broken.cr3");

  await writeFile(pngPath, Buffer.from(SAMPLE_PNG_BASE64, "base64"));
  await writeFile(invalidRawPath, Buffer.from("not-a-valid-raw-file", "utf8"));

  const server = startPreviewServer();
  let browser;

  try {
    await waitForServer(smokeUrl);
    browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(smokeUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("#uploader");

    await page.setInputFiles("#imageInput", pngPath);
    await page.locator("#originalPreview").waitFor({ state: "visible" });
    assert.match((await page.locator("#originalMeta").textContent()) || "", /2 × 2/);

    await page.selectOption("#formatSelect", "image/jpeg");
    await page.fill("#widthInput", "2");
    await page.fill("#heightInput", "2");
    await page.click("#convertButton");
    await page.locator("#convertedPreview").waitFor({ state: "visible" });
    assert.match((await page.locator("#convertedMeta").textContent()) || "", /JPEG/);

    await page.setInputFiles("#imageInput", invalidRawPath);
    await page.waitForFunction(
      () =>
        document.querySelector("#statusBox")?.textContent?.includes("파일을 읽지 못했습니다") &&
        document.querySelector("#originalFrame")?.dataset.state === "error"
    );

    await page.setInputFiles("#imageInput", pngPath);
    await page.locator("#originalPreview").waitFor({ state: "visible" });
    await page.evaluate(() => {
      const lockAspect = document.querySelector("#lockAspect");
      const widthInput = document.querySelector("#widthInput");
      const heightInput = document.querySelector("#heightInput");

      lockAspect.checked = false;
      widthInput.value = "20000";
      heightInput.value = "20000";
    });
    await page.click("#convertButton");
    await page.waitForFunction(() =>
      document.querySelector("#statusBox")?.textContent?.includes("최대")
    );

    await assertCorpusSamples(page);
    console.log("Smoke test passed.");
  } finally {
    await browser?.close();
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
