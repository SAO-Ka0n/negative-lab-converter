import test from "node:test";
import assert from "node:assert/strict";

import { probeSource } from "../../../packages/converter-core/src/file-sniff";
import { inspectFormatSupport } from "../../../packages/converter-core/src/formats";
import { fitDimensionsWithinLimits, validateOutputDimensions } from "../../../packages/converter-core/src/limits";
import { recommendExportPreset } from "../../../packages/converter-core/src/presets";

test("inspectFormatSupport marks CR3 as preview-first raw", () => {
  const result = inspectFormatSupport({ fileName: "IMG_5752.CR3" });

  assert.equal(result.accepted, true);
  assert.equal(result.inputKind, "raw");
  assert.equal(result.previewOnly, true);
});

test("recommendExportPreset prefers non-jpeg for transparency", () => {
  const preset = recommendExportPreset({
    intent: "web",
    hasTransparency: true,
  });

  assert.equal(preset.format, "png");
});

test("fitDimensionsWithinLimits clamps huge output sizes", () => {
  const fitted = fitDimensionsWithinLimits(20_000, 20_000);

  assert.ok(fitted.width <= 12_000);
  assert.ok(fitted.width * fitted.height <= 75_000_000);
});

test("validateOutputDimensions rejects oversized requests", () => {
  assert.match(validateOutputDimensions(20_000, 1) || "", /최대/);
});

test("probeSource extracts png dimensions from headers", () => {
  const bytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x01, 0x20, 0x00, 0x00, 0x00, 0x90,
  ]);

  const result = probeSource({
    fileName: "sample.png",
    headerBytes: bytes,
    byteSize: 1024,
  });

  assert.equal(result.sourceFormat, "PNG");
  assert.equal(result.width, 288);
  assert.equal(result.height, 144);
});
