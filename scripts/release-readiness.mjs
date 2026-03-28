import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  const raw = await readFile(path.join(root, relativePath), "utf8");
  return JSON.parse(raw);
}

const productConfigModule = await import(pathToFileURL(path.join(root, "product-config.js")).href);
void productConfigModule;

const baseConfig = globalThis.NLC_PRODUCT_CONFIG;

if (!baseConfig) {
  throw new Error("NLC_PRODUCT_CONFIG was not initialized.");
}

const config = {
  ...baseConfig,
  seller: {
    ...baseConfig.seller,
    supportEmail: process.env.NLC_SUPPORT_EMAIL?.trim() || baseConfig.seller?.supportEmail || "",
  },
  links: {
    ...baseConfig.links,
    purchaseUrl: process.env.NLC_PURCHASE_URL?.trim() || baseConfig.links?.purchaseUrl || "",
    supportUrl: process.env.NLC_SUPPORT_URL?.trim() || baseConfig.links?.supportUrl || "",
  },
  commerce: {
    ...baseConfig.commerce,
    androidStoreUrl:
      process.env.NLC_ANDROID_STORE_URL?.trim() || baseConfig.commerce?.androidStoreUrl || "",
    iosStoreUrl: process.env.NLC_IOS_STORE_URL?.trim() || baseConfig.commerce?.iosStoreUrl || "",
    macDownloadUrl:
      process.env.NLC_MAC_DOWNLOAD_URL?.trim() || baseConfig.commerce?.macDownloadUrl || "",
    windowsDownloadUrl:
      process.env.NLC_WINDOWS_DOWNLOAD_URL?.trim() || baseConfig.commerce?.windowsDownloadUrl || "",
  },
};

const manifest = await readJson("qa/corpus.manifest.json");
const checks = [
  {
    ok: Boolean(config.seller.supportEmail || config.links.supportUrl),
    label: "지원 채널 설정",
  },
  {
    ok: Boolean(config.links.purchaseUrl),
    label: "데스크톱 결제 링크 설정",
  },
  {
    ok: Boolean(config.commerce.windowsDownloadUrl),
    label: "Windows 다운로드 URL 설정",
  },
  {
    ok: Boolean(config.commerce.macDownloadUrl),
    label: "macOS 다운로드 URL 설정",
  },
  {
    ok: await exists("TERMS_OF_USE.md"),
    label: "Terms of Use 문서",
  },
  {
    ok: await exists("REFUND_POLICY.md"),
    label: "Refund Policy 문서",
  },
  {
    ok: await exists("THIRD_PARTY_NOTICES.md"),
    label: "Third-Party Notices 문서",
  },
  {
    ok: manifest.samples.length >= manifest.requiredMinimumFiles,
    label: `회귀 코퍼스 ${manifest.requiredMinimumFiles}개 이상`,
  },
];

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.label}`);
}

if (failed.length) {
  process.exitCode = 1;
}
