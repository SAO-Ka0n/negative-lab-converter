const baseProductConfig = window.NLC_PRODUCT_CONFIG ?? {};
const launchOverrides = window.NLC_LAUNCH_CONFIG ?? {};

function createMailto(email, subject) {
  if (!email) {
    return "";
  }

  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

function pickOverride(value, fallback = "") {
  if (value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  return fallback;
}

function mergeConfig() {
  const supportEmail = pickOverride(
    launchOverrides.supportEmail,
    baseProductConfig.seller?.supportEmail?.trim() || ""
  );
  const websiteUrl = pickOverride(launchOverrides.websiteUrl, baseProductConfig.links?.websiteUrl || "");

  return {
    ...baseProductConfig,
    seller: {
      ...baseProductConfig.seller,
      displayName: pickOverride(
        launchOverrides.sellerDisplayName,
        baseProductConfig.seller?.displayName || ""
      ),
      supportEmail,
      websiteUrl,
    },
    commerce: {
      ...baseProductConfig.commerce,
      androidStoreUrl: pickOverride(
        launchOverrides.androidStoreUrl,
        baseProductConfig.commerce?.androidStoreUrl || ""
      ),
      desktopPurchaseUrl: pickOverride(
        launchOverrides.purchaseUrl,
        baseProductConfig.commerce?.desktopPurchaseUrl || ""
      ),
      iosStoreUrl: pickOverride(
        launchOverrides.iosStoreUrl,
        baseProductConfig.commerce?.iosStoreUrl || ""
      ),
      macDownloadUrl: pickOverride(
        launchOverrides.macDownloadUrl,
        baseProductConfig.commerce?.macDownloadUrl || ""
      ),
      windowsDownloadUrl: pickOverride(
        launchOverrides.windowsDownloadUrl,
        baseProductConfig.commerce?.windowsDownloadUrl || ""
      ),
    },
    links: {
      ...baseProductConfig.links,
      purchaseUrl: pickOverride(
        launchOverrides.purchaseUrl,
        baseProductConfig.commerce?.desktopPurchaseUrl || ""
      ),
      supportUrl: pickOverride(
        launchOverrides.supportUrl,
        createMailto(supportEmail, "Negative Lab Converter Support")
      ),
      websiteUrl,
    },
  };
}

const launchConfig = mergeConfig();

function getConfiguredLink(key) {
  if (key === "purchaseUrl") {
    return launchConfig.links.purchaseUrl;
  }

  if (key === "supportUrl") {
    return launchConfig.links.supportUrl;
  }

  if (key === "windowsDownloadUrl") {
    return launchConfig.commerce.windowsDownloadUrl;
  }

  if (key === "macDownloadUrl") {
    return launchConfig.commerce.macDownloadUrl;
  }

  if (key === "androidStoreUrl") {
    return launchConfig.commerce.androidStoreUrl;
  }

  if (key === "iosStoreUrl") {
    return launchConfig.commerce.iosStoreUrl;
  }

  return "";
}

function applyConfiguredLinks() {
  const linkNodes = document.querySelectorAll("[data-link-key]");

  for (const node of linkNodes) {
    const key = node.dataset.linkKey;
    const href = getConfiguredLink(key);

    if (!href) {
      node.setAttribute("aria-disabled", "true");
      node.removeAttribute("href");
      node.classList.add("is-disabled");
      continue;
    }

    node.href = href;
    node.removeAttribute("aria-disabled");
    node.classList.remove("is-disabled");

    if (/^https?:\/\//.test(href) || href.startsWith("mailto:")) {
      node.target = "_blank";
      node.rel = "noreferrer";
    }
  }
}

function applyDocumentLinks() {
  const docNodes = document.querySelectorAll("[data-doc-key]");

  for (const node of docNodes) {
    const key = node.dataset.docKey;
    const href = launchConfig.docs?.[key] || "";

    if (!href) {
      node.setAttribute("aria-disabled", "true");
      node.removeAttribute("href");
      node.classList.add("is-disabled");
      continue;
    }

    node.href = href;
  }
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) {
    node.textContent = value;
  }
}

function populateCommercialDetails() {
  setText("#sellerName", launchConfig.seller?.displayName || "판매자 정보 설정 필요");
  setText("#supportEmail", launchConfig.seller?.supportEmail || "지원 이메일 설정 필요");
  setText("#websiteLabel", launchConfig.seller?.websiteUrl || "웹사이트 설정 필요");
  setText("#desktopPriceLabel", launchConfig.commerce?.desktopPriceLabel || "$24");
}

function renderReadiness() {
  const checks = [
    {
      ok: Boolean(launchConfig.seller?.supportEmail || launchConfig.links?.supportUrl),
      label: "지원 채널 설정 완료",
    },
    {
      ok: Boolean(launchConfig.links?.purchaseUrl),
      label: "데스크톱 결제 링크 설정 완료",
    },
    {
      ok: Boolean(launchConfig.commerce?.windowsDownloadUrl),
      label: "Windows 다운로드 링크 연결 완료",
    },
    {
      ok: Boolean(launchConfig.commerce?.macDownloadUrl),
      label: "macOS 다운로드 링크 연결 완료",
    },
    {
      ok: Boolean(launchConfig.commerce?.androidStoreUrl),
      label: "Android 스토어 링크 연결 완료",
    },
    {
      ok: Boolean(launchConfig.commerce?.iosStoreUrl),
      label: "iOS 스토어 링크 연결 완료",
    },
  ];

  const list = document.querySelector("#readinessList");
  if (!list) {
    return;
  }

  list.replaceChildren();

  for (const item of checks) {
    const node = document.createElement("li");
    node.dataset.state = item.ok ? "success" : "warning";
    node.textContent = `${item.ok ? "완료" : "필요"} · ${item.label}`;
    list.append(node);
  }
}

applyConfiguredLinks();
applyDocumentLinks();
populateCommercialDetails();
renderReadiness();
