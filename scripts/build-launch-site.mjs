import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const site = path.join(root, "site");

const filesToCopy = [
  ["launch.html", "index.html"],
  ["launch.css", "launch.css"],
  ["launch.js", "launch.js"],
  ["product-config.js", "product-config.js"],
  ["PRIVACY_POLICY.md", "PRIVACY_POLICY.md"],
  ["TERMS_OF_USE.md", "TERMS_OF_USE.md"],
  ["REFUND_POLICY.md", "REFUND_POLICY.md"],
  ["THIRD_PARTY_NOTICES.md", "THIRD_PARTY_NOTICES.md"],
  ["STORE_COPY_DRAFT.md", "STORE_COPY_DRAFT.md"],
  ["LAUNCH_CHECKLIST.md", "LAUNCH_CHECKLIST.md"],
];

const supportEmail = process.env.NLC_SUPPORT_EMAIL?.trim() || "";
const deploymentConfig = {
  androidStoreUrl: process.env.NLC_ANDROID_STORE_URL?.trim() || null,
  iosStoreUrl: process.env.NLC_IOS_STORE_URL?.trim() || null,
  macDownloadUrl: process.env.NLC_MAC_DOWNLOAD_URL?.trim() || null,
  purchaseUrl: process.env.NLC_PURCHASE_URL?.trim() || null,
  sellerDisplayName: process.env.NLC_SELLER_NAME?.trim() || "",
  supportEmail: supportEmail || null,
  supportUrl:
    process.env.NLC_SUPPORT_URL?.trim() ||
    (supportEmail
      ? `mailto:${supportEmail}?subject=${encodeURIComponent("Negative Lab Converter Support")}`
      : null),
  websiteUrl: process.env.NLC_WEBSITE_URL?.trim() || "",
  windowsDownloadUrl: process.env.NLC_WINDOWS_DOWNLOAD_URL?.trim() || null,
};

await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });

for (const [sourceName, targetName] of filesToCopy) {
  await cp(path.join(root, sourceName), path.join(site, targetName));
}

await cp(path.join(root, "icons"), path.join(site, "icons"), { recursive: true });
await writeFile(
  path.join(site, "launch-config.js"),
  `window.NLC_LAUNCH_CONFIG = ${JSON.stringify(deploymentConfig, null, 2)};\n`,
  "utf8"
);

console.log(`Built launch site into ${site}`);
