const state = {
  aspectRatio: 1,
  background: "#f5f0e8",
  convertedBlob: null,
  convertedUrl: "",
  currentFormat: "image/webp",
  diagnostics: {
    engine: "확인 중",
    events: [],
    heif: "점검 대기",
    platform: "확인 중",
    raw: "지연 로드",
    runtime: "확인 중",
    serviceWorker: "확인 중",
    tiff: "확인 중",
  },
  image: null,
  inputUrl: "",
  isLoading: false,
  loadRequestId: 0,
  originalHeight: 0,
  originalName: "",
  originalSize: 0,
  originalType: "",
  originalWidth: 0,
  quality: 0.92,
};

const productConfig = window.NLC_PRODUCT_CONFIG ?? {};

const elements = {
  aboutDistribution: document.querySelector("#aboutDistribution"),
  aboutNote: document.querySelector("#aboutNote"),
  aboutNoticesLink: document.querySelector("#aboutNoticesLink"),
  aboutPrivacyLink: document.querySelector("#aboutPrivacyLink"),
  aboutRefundLink: document.querySelector("#aboutRefundLink"),
  aboutSeller: document.querySelector("#aboutSeller"),
  aboutSupport: document.querySelector("#aboutSupport"),
  aboutSupportLink: document.querySelector("#aboutSupportLink"),
  aboutTermsLink: document.querySelector("#aboutTermsLink"),
  aboutVersion: document.querySelector("#aboutVersion"),
  backgroundInput: document.querySelector("#backgroundInput"),
  convertedFrame: document.querySelector("#convertedFrame"),
  convertedMeta: document.querySelector("#convertedMeta"),
  convertedPreview: document.querySelector("#convertedPreview"),
  copyDiagnosticsButton: document.querySelector("#copyDiagnosticsButton"),
  convertButton: document.querySelector("#convertButton"),
  diagnosticEngine: document.querySelector("#diagnosticEngine"),
  diagnosticHeif: document.querySelector("#diagnosticHeif"),
  diagnosticLog: document.querySelector("#diagnosticLog"),
  diagnosticPlatform: document.querySelector("#diagnosticPlatform"),
  diagnosticRaw: document.querySelector("#diagnosticRaw"),
  diagnosticRuntime: document.querySelector("#diagnosticRuntime"),
  diagnosticServiceWorker: document.querySelector("#diagnosticServiceWorker"),
  diagnosticTiff: document.querySelector("#diagnosticTiff"),
  downloadButton: document.querySelector("#downloadButton"),
  dropzone: document.querySelector("#dropzone"),
  formatSelect: document.querySelector("#formatSelect"),
  heightInput: document.querySelector("#heightInput"),
  imageInput: document.querySelector("#imageInput"),
  lockAspect: document.querySelector("#lockAspect"),
  originalFrame: document.querySelector("#originalFrame"),
  originalMeta: document.querySelector("#originalMeta"),
  originalPreview: document.querySelector("#originalPreview"),
  pickButton: document.querySelector("#pickButton"),
  qualityInput: document.querySelector("#qualityInput"),
  qualityValue: document.querySelector("#qualityValue"),
  resetButton: document.querySelector("#resetButton"),
  sourceSummary: document.querySelector("#sourceSummary"),
  statusBox: document.querySelector("#statusBox"),
  widthInput: document.querySelector("#widthInput"),
};

const rawExtensions = new Set([
  "3fr",
  "arw",
  "craw",
  "cr2",
  "cr3",
  "crw",
  "dcr",
  "dng",
  "erf",
  "fff",
  "gpr",
  "iiq",
  "k25",
  "kdc",
  "mef",
  "mos",
  "mrw",
  "nef",
  "nrw",
  "orf",
  "pef",
  "raf",
  "raw",
  "rw2",
  "sr2",
  "srf",
  "srw",
  "x3f",
]);

const heifExtensions = new Set(["heic", "heif"]);
const nativeExtensions = new Set(["avif", "bmp", "gif", "jpeg", "jpg", "png", "svg", "webp"]);
const tiffExtensions = new Set(["tif", "tiff"]);
const previewPreferredRawExtensions = new Set(["cr3", "craw"]);

const formatLabels = {
  "3fr": "RAW",
  "arw": "Sony RAW",
  "avif": "AVIF",
  "craw": "Canon CRAW",
  "cr2": "Canon RAW",
  "cr3": "Canon RAW / CRAW",
  "crw": "Canon RAW",
  "dcr": "Kodak RAW",
  "dng": "DNG RAW",
  "erf": "Epson RAW",
  "fff": "Hasselblad RAW",
  "gpr": "GoPro RAW",
  "heic": "HEIC",
  "heif": "HEIF",
  "iiq": "Phase One RAW",
  "image/avif": "AVIF",
  "image/bmp": "BMP",
  "image/gif": "GIF",
  "image/heic": "HEIC",
  "image/heif": "HEIF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/svg+xml": "SVG",
  "image/tiff": "TIFF",
  "image/webp": "WebP",
  "k25": "Kodak RAW",
  "kdc": "Kodak RAW",
  "mef": "Mamiya RAW",
  "mos": "Leaf RAW",
  "mrw": "Minolta RAW",
  "nef": "Nikon RAW",
  "nrw": "Nikon RAW",
  "orf": "Olympus RAW",
  "pef": "Pentax RAW",
  "raf": "Fujifilm RAW",
  "raw": "RAW",
  "rw2": "Panasonic RAW",
  "sr2": "Sony RAW",
  "srf": "Sony RAW",
  "srw": "Samsung RAW",
  "svg": "SVG",
  "tif": "TIFF",
  "tiff": "TIFF",
  "x3f": "Sigma RAW",
};

const rawSettings = {
  halfSize: false,
  noAutoBright: false,
  outputBps: 8,
  outputColor: 1,
  useCameraWb: true,
};

const diagnosticElementMap = {
  engine: "diagnosticEngine",
  heif: "diagnosticHeif",
  platform: "diagnosticPlatform",
  raw: "diagnosticRaw",
  runtime: "diagnosticRuntime",
  serviceWorker: "diagnosticServiceWorker",
  tiff: "diagnosticTiff",
};

const MAX_OUTPUT_EDGE = 12000;
const MAX_OUTPUT_PIXELS = 75_000_000;
const MIN_EMBEDDED_PREVIEW_BYTES = 65536;
const EMBEDDED_PREVIEW_CHUNK_SIZE = 8 * 1024 * 1024;

let heifModulePromise;
let rawModulePromise;

function setStatus(message, { log = false, tone = "neutral" } = {}) {
  elements.statusBox.textContent = message;
  elements.statusBox.dataset.state = tone;

  if (log) {
    pushDiagnostic(message, tone);
  }
}

function formatDiagnosticTime(date = new Date()) {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function updateDiagnosticValue(key, value, tone = "neutral") {
  state.diagnostics[key] = value;

  const elementName = diagnosticElementMap[key];
  if (!elementName) {
    return;
  }

  const node = elements[elementName];
  if (!node) {
    return;
  }

  node.textContent = value;
  node.dataset.state = tone;
}

function renderDiagnosticLog() {
  elements.diagnosticLog.replaceChildren();

  for (const entry of state.diagnostics.events) {
    const item = document.createElement("li");
    item.className = "diagnostic-log-item";
    item.dataset.state = entry.tone;

    const time = document.createElement("span");
    time.className = "diagnostic-log-time";
    time.textContent = entry.time;

    const message = document.createElement("p");
    message.textContent = entry.message;

    item.append(time, message);
    elements.diagnosticLog.append(item);
  }
}

function pushDiagnostic(message, tone = "info") {
  state.diagnostics.events.unshift({
    message,
    time: formatDiagnosticTime(),
    tone,
  });
  state.diagnostics.events = state.diagnostics.events.slice(0, 8);
  renderDiagnosticLog();
}

function getDesktopBridge() {
  return typeof window !== "undefined" ? window.nlcDesktop ?? null : null;
}

function getPlatformLabel(platform) {
  if (platform === "win32") {
    return "Windows";
  }

  if (platform === "darwin") {
    return "macOS";
  }

  if (platform === "linux") {
    return "Linux";
  }

  return platform || "웹";
}

function getBrowserLabel() {
  const userAgent = navigator.userAgent;

  if (/Edg\//.test(userAgent)) {
    return "Edge";
  }

  if (/Chrome\//.test(userAgent)) {
    return "Chrome";
  }

  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
    return "Safari";
  }

  if (/Firefox\//.test(userAgent)) {
    return "Firefox";
  }

  return "Browser";
}

function syncRuntimeDiagnostics() {
  const desktop = getDesktopBridge();

  if (desktop?.isDesktop) {
    updateDiagnosticValue("runtime", "Electron 데스크톱", "success");
    updateDiagnosticValue("platform", getPlatformLabel(desktop.platform), "success");
    updateDiagnosticValue(
      "engine",
      `Electron ${desktop.versions?.electron || "?"} · Chrome ${desktop.versions?.chrome || "?"}`,
      "success"
    );
    return;
  }

  updateDiagnosticValue("runtime", "브라우저", "success");
  updateDiagnosticValue("platform", navigator.platform || "웹", "neutral");
  updateDiagnosticValue("engine", getBrowserLabel(), "neutral");
}

function syncDecoderDiagnostics() {
  updateDiagnosticValue("raw", "지연 로드", "neutral");
  updateDiagnosticValue("tiff", window.UTIF ? "준비됨" : "스크립트 없음", window.UTIF ? "success" : "error");
  updateDiagnosticValue("heif", "점검 중", "pending");
}

function scheduleIdleTask(callback, timeout = 1200) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  window.setTimeout(callback, 180);
}

async function probeHeifDecoder() {
  try {
    await getHeifModule();
    pushDiagnostic("HEIC / HEIF 디코더 점검 완료.", "success");
  } catch (error) {
    console.error(error);
    pushDiagnostic("HEIC / HEIF 디코더를 불러오지 못했습니다.", "error");
  }
}

function copyTextFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function buildDiagnosticsText() {
  const lines = [
    "[Negative Lab Converter 진단]",
    `실행 모드: ${state.diagnostics.runtime}`,
    `플랫폼: ${state.diagnostics.platform}`,
    `엔진: ${state.diagnostics.engine}`,
    `오프라인 캐시: ${state.diagnostics.serviceWorker}`,
    `HEIC / HEIF: ${state.diagnostics.heif}`,
    `RAW / CRAW: ${state.diagnostics.raw}`,
    `TIFF: ${state.diagnostics.tiff}`,
    "",
    "[최근 이벤트]",
  ];

  for (const entry of state.diagnostics.events) {
    lines.push(`${entry.time} ${entry.message}`);
  }

  return lines.join("\n");
}

async function copyDiagnostics() {
  const text = buildDiagnosticsText();

  try {
    if (!navigator.clipboard?.writeText) {
      copyTextFallback(text);
    } else {
      await navigator.clipboard.writeText(text);
    }

    pushDiagnostic("진단 텍스트를 클립보드에 복사했습니다.", "success");
    setStatus("진단 텍스트를 복사했습니다. Windows에서 문제를 확인할 때 그대로 붙여 넣을 수 있습니다.");
  } catch (error) {
    console.error(error);
    pushDiagnostic("진단 텍스트 복사에 실패했습니다.", "error");
    setStatus("진단 텍스트를 복사하지 못했습니다. 권한 상태를 확인한 뒤 다시 시도해 주세요.");
  }
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function getProductLink(key) {
  if (key === "support") {
    return productConfig.links?.supportUrl || "";
  }

  return productConfig.docs?.[key] || "";
}

function setLinkState(node, href) {
  if (!node) {
    return;
  }

  if (!href) {
    node.hidden = true;
    node.removeAttribute("href");
    return;
  }

  node.hidden = false;
  node.href = href;
}

function getFileExtension(filename = "") {
  const segments = filename.split(".");
  return segments.length > 1 ? segments.pop().toLowerCase() : "";
}

function extensionForMime(type) {
  if (type === "image/jpeg") {
    return "jpg";
  }

  if (type === "image/png") {
    return "png";
  }

  if (type === "image/tiff") {
    return "tiff";
  }

  return "webp";
}

function formatFileLabel(file) {
  const extension = getFileExtension(file.name);
  return (
    formatLabels[file.type] ||
    formatLabels[extension] ||
    (extension ? extension.toUpperCase() : file.type || "image")
  );
}

function isSupportedFile(file) {
  const extension = getFileExtension(file.name);
  return (
    file.type.startsWith("image/") ||
    nativeExtensions.has(extension) ||
    rawExtensions.has(extension) ||
    heifExtensions.has(extension) ||
    tiffExtensions.has(extension)
  );
}

function getFileKind(file) {
  const extension = getFileExtension(file.name);

  if (rawExtensions.has(extension)) {
    return "raw";
  }

  if (heifExtensions.has(extension) || file.type === "image/heic" || file.type === "image/heif") {
    return "heif";
  }

  if (tiffExtensions.has(extension) || file.type === "image/tiff") {
    return "tiff";
  }

  return "native";
}

function setPreviewMessage(frame, image, message, tone = "neutral") {
  const messageNode = frame.querySelector("p");
  frame.dataset.state = tone;
  messageNode.textContent = message;
  messageNode.dataset.state = tone;
  messageNode.hidden = false;

  if (image) {
    image.hidden = true;
    image.removeAttribute("src");
  }
}

function showOriginalPreview(previewUrl, width, height) {
  elements.originalPreview.src = previewUrl;
  elements.originalPreview.hidden = false;
  elements.originalFrame.dataset.state = "success";
  elements.originalFrame.querySelector("p").hidden = true;
  elements.originalMeta.textContent = `${width} × ${height}`;
}

function showConvertedPreview(previewUrl, label) {
  elements.convertedPreview.src = previewUrl;
  elements.convertedPreview.hidden = false;
  elements.convertedFrame.dataset.state = "success";
  elements.convertedFrame.querySelector("p").hidden = true;
  elements.convertedMeta.textContent = label;
}

function syncCommercialInfo() {
  const supportEmail = productConfig.seller?.supportEmail?.trim() || "";
  const sellerName = productConfig.seller?.displayName || "판매자 정보 설정 필요";
  const desktopVersion = getDesktopBridge()?.appVersion;
  const versionLabel = desktopVersion || productConfig.version || "0.1.0";
  const distribution = [
    productConfig.release?.desktopDistributionNote,
    productConfig.release?.mobileDistributionNote,
  ]
    .filter(Boolean)
    .join(" / ");

  elements.aboutVersion.textContent = versionLabel;
  elements.aboutSeller.textContent = sellerName;
  elements.aboutSupport.textContent = supportEmail || "지원 이메일 설정 필요";
  elements.aboutDistribution.textContent = distribution || "배포 정책 확인 필요";
  elements.aboutNote.textContent = supportEmail
    ? `${sellerName} 기준 지원 채널이 연결되어 있습니다. 정책 문서를 함께 제공하면 판매용 안내가 완성됩니다.`
    : "지원 이메일이 아직 비어 있습니다. product-config.js 또는 launch-config.js에서 실제 지원 채널을 연결해 주세요.";

  setLinkState(elements.aboutSupportLink, getProductLink("support"));
  setLinkState(elements.aboutPrivacyLink, getProductLink("privacyPolicyUrl"));
  setLinkState(elements.aboutTermsLink, getProductLink("termsUrl"));
  setLinkState(elements.aboutRefundLink, getProductLink("refundPolicyUrl"));
  setLinkState(elements.aboutNoticesLink, getProductLink("noticesUrl"));

  if (!supportEmail) {
    pushDiagnostic("지원 이메일이 아직 설정되지 않았습니다.", "warning");
  }
}

function setSourceSummary({ detail, kicker, title }) {
  elements.sourceSummary.replaceChildren();

  if (kicker) {
    const kickerNode = document.createElement("span");
    kickerNode.className = "summary-kicker";
    kickerNode.textContent = kicker;
    elements.sourceSummary.append(kickerNode);
  }

  if (title) {
    const titleNode = document.createElement("strong");
    titleNode.textContent = title;
    elements.sourceSummary.append(titleNode);
  }

  const detailNode = document.createElement("span");
  detailNode.textContent = detail;
  elements.sourceSummary.append(detailNode);
}

function clearLoadedSource({ revokePreview = true } = {}) {
  if (revokePreview && state.inputUrl) {
    revokeObjectUrl(state.inputUrl);
  }

  state.aspectRatio = 1;
  state.image = null;
  state.inputUrl = "";
  state.originalHeight = 0;
  state.originalName = "";
  state.originalSize = 0;
  state.originalType = "";
  state.originalWidth = 0;
  elements.originalMeta.textContent = "파일 없음";
}

function setSourceFailure(file, message) {
  clearLoadedSource();
  setPreviewMessage(elements.originalFrame, elements.originalPreview, message, "error");
  setSourceSummary({
    kicker: "불러오기 실패",
    title: file?.name || "읽기 실패",
    detail: message,
  });
  toggleControls(false);
  elements.resetButton.disabled = false;
}

function toggleControls(enabled) {
  const targets = [
    elements.widthInput,
    elements.heightInput,
    elements.lockAspect,
    elements.convertButton,
    elements.resetButton,
  ];

  for (const node of targets) {
    node.disabled = !enabled;
  }

  updateFormatControls();
}

function revokeObjectUrl(url) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

function disposeDecodedResult(decoded) {
  if (!decoded?.previewUrl || decoded.previewUrl === state.inputUrl) {
    return;
  }

  revokeObjectUrl(decoded.previewUrl);
}

function cleanupOutput() {
  if (state.convertedUrl) {
    revokeObjectUrl(state.convertedUrl);
  }

  state.convertedBlob = null;
  state.convertedUrl = "";
  elements.downloadButton.disabled = true;
  elements.convertedMeta.textContent = "변환 대기중";
  setPreviewMessage(
    elements.convertedFrame,
    elements.convertedPreview,
    "변환 후 결과가 여기 표시됩니다.",
    "neutral"
  );
}

function resetAll() {
  state.loadRequestId += 1;
  state.isLoading = false;
  cleanupOutput();
  clearLoadedSource();

  elements.imageInput.value = "";
  setPreviewMessage(
    elements.originalFrame,
    elements.originalPreview,
    "원본 이미지가 여기 표시됩니다.",
    "neutral"
  );
  setSourceSummary({ detail: "아직 파일이 없습니다." });
  toggleControls(false);
  setStatus("PNG, JPEG, WebP, HEIC, TIFF, RAW 파일을 올리면 변환 준비가 됩니다.");
}

function syncQualityLabel() {
  const percent = Math.round(Number(elements.qualityInput.value) * 100);
  elements.qualityValue.textContent = `${percent}%`;
}

function updateFormatControls() {
  const hasImage = Boolean(state.image);
  const format = elements.formatSelect.value;
  const usesQuality = format === "image/jpeg" || format === "image/webp";
  const usesBackground = format === "image/jpeg";

  elements.qualityInput.disabled = !hasImage || !usesQuality;
  elements.backgroundInput.disabled = !hasImage || !usesBackground;
}

function updateDimensionInputs(width, height) {
  elements.widthInput.value = String(width);
  elements.heightInput.value = String(height);
}

function normalizeDimensionValue(value, fallback) {
  return Math.max(1, Math.round(Number(value) || fallback));
}

function fitDimensionsWithinLimits(width, height) {
  let nextWidth = Math.max(1, Math.round(width));
  let nextHeight = Math.max(1, Math.round(height));
  let scale = 1;

  const maxEdge = Math.max(nextWidth, nextHeight);
  if (maxEdge > MAX_OUTPUT_EDGE) {
    scale = Math.min(scale, MAX_OUTPUT_EDGE / maxEdge);
  }

  const pixels = nextWidth * nextHeight;
  if (pixels > MAX_OUTPUT_PIXELS) {
    scale = Math.min(scale, Math.sqrt(MAX_OUTPUT_PIXELS / pixels));
  }

  if (scale < 1) {
    nextWidth = Math.max(1, Math.floor(nextWidth * scale));
    nextHeight = Math.max(1, Math.floor(nextHeight * scale));
  }

  while (nextWidth * nextHeight > MAX_OUTPUT_PIXELS) {
    if (nextWidth >= nextHeight) {
      nextWidth -= 1;
    } else {
      nextHeight -= 1;
    }
  }

  return { width: nextWidth, height: nextHeight };
}

function getRequestedOutputDimensions() {
  return {
    width: normalizeDimensionValue(elements.widthInput.value, state.originalWidth),
    height: normalizeDimensionValue(elements.heightInput.value, state.originalHeight),
  };
}

function validateOutputDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return "출력 크기는 1px 이상 정수로 입력해 주세요.";
  }

  if (width > MAX_OUTPUT_EDGE || height > MAX_OUTPUT_EDGE) {
    return `출력 크기는 가로/세로 각각 최대 ${formatCount(MAX_OUTPUT_EDGE)}px까지 가능합니다.`;
  }

  const pixels = width * height;
  if (pixels > MAX_OUTPUT_PIXELS) {
    return `출력 크기는 최대 ${formatCount(MAX_OUTPUT_PIXELS)}픽셀까지 가능합니다. 현재 ${formatCount(pixels)}픽셀입니다.`;
  }

  return "";
}

function isActiveLoad(loadRequestId) {
  return loadRequestId === state.loadRequestId;
}

function onWidthChange() {
  if (!state.image || !elements.lockAspect.checked) {
    return;
  }

  const nextWidth = normalizeDimensionValue(elements.widthInput.value, state.originalWidth);
  const nextHeight = Math.max(1, Math.round(nextWidth / state.aspectRatio));
  const fitted = fitDimensionsWithinLimits(nextWidth, nextHeight);
  updateDimensionInputs(fitted.width, fitted.height);
}

function onHeightChange() {
  if (!state.image || !elements.lockAspect.checked) {
    return;
  }

  const nextHeight = normalizeDimensionValue(elements.heightInput.value, state.originalHeight);
  const nextWidth = Math.max(1, Math.round(nextHeight * state.aspectRatio));
  const fitted = fitDimensionsWithinLimits(nextWidth, nextHeight);
  updateDimensionInputs(fitted.width, fitted.height);
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createCanvasFromPixels(width, height, rgba) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
  context.putImageData(imageData, 0, 0);
  return canvas;
}

async function createPreviewUrl(drawable) {
  if (drawable instanceof HTMLImageElement) {
    return drawable.src;
  }

  const blob = await canvasToBlob(drawable, "image/png", 1);
  return URL.createObjectURL(blob);
}

async function locateLargestEmbeddedJpegRange(file) {
  let bestStart = -1;
  let bestEnd = -1;
  let currentStart = -1;
  let previousByte = -1;

  for (let offset = 0; offset < file.size; offset += EMBEDDED_PREVIEW_CHUNK_SIZE) {
    const chunk = new Uint8Array(
      await file.slice(offset, offset + EMBEDDED_PREVIEW_CHUNK_SIZE).arrayBuffer()
    );

    for (let index = 0; index < chunk.length; index += 1) {
      const byte = chunk[index];
      const absoluteIndex = offset + index;

      if (previousByte === 0xff && byte === 0xd8 && currentStart === -1) {
        currentStart = absoluteIndex - 1;
      }

      if (previousByte === 0xff && byte === 0xd9 && currentStart !== -1) {
        const candidateEnd = absoluteIndex + 1;
        if (candidateEnd - currentStart > bestEnd - bestStart) {
          bestStart = currentStart;
          bestEnd = candidateEnd;
        }
        currentStart = -1;
      }

      previousByte = byte;
    }
  }

  if (bestStart === -1 || bestEnd === -1 || bestEnd - bestStart < MIN_EMBEDDED_PREVIEW_BYTES) {
    return null;
  }

  return { start: bestStart, end: bestEnd };
}

async function extractEmbeddedRawPreview(file) {
  const previewRange = await locateLargestEmbeddedJpegRange(file);
  if (!previewRange) {
    throw new Error("raw-embedded-preview-not-found");
  }

  const previewBlob = file.slice(previewRange.start, previewRange.end, "image/jpeg");
  const previewFile = new File(
    [previewBlob],
    `${file.name.replace(/\.[^.]+$/, "")}-embedded-preview.jpg`,
    { type: "image/jpeg" }
  );
  const decoded = await loadNativeImage(previewFile);

  return {
    ...decoded,
    sourceType: `${formatFileLabel(file)} 프리뷰`,
  };
}

async function getHeifModule() {
  if (!heifModulePromise) {
    updateDiagnosticValue("heif", "불러오는 중", "pending");
    heifModulePromise = import("./vendor/libheif/libheif-bundle.mjs")
      .then((module) => module.default())
      .then((heifModule) => {
        updateDiagnosticValue("heif", "준비됨", "success");
        return heifModule;
      })
      .catch((error) => {
        heifModulePromise = undefined;
        updateDiagnosticValue("heif", "불러오기 실패", "error");
        throw error;
      });
  }

  return heifModulePromise;
}

async function getRawModule() {
  if (!rawModulePromise) {
    updateDiagnosticValue("raw", "불러오는 중", "pending");
    rawModulePromise = import("./vendor/libraw/index.js")
      .then((module) => {
        updateDiagnosticValue("raw", "준비됨", "success");
        return module.default;
      })
      .catch((error) => {
        rawModulePromise = undefined;
        updateDiagnosticValue("raw", "불러오기 실패", "error");
        throw error;
      });
  }

  return rawModulePromise;
}

async function loadNativeImage(file) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("image-load-failed"));
      image.src = objectUrl;
    });
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }

  return {
    drawable: image,
    previewUrl: objectUrl,
    sourceType: formatFileLabel(file),
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

async function decodeHeifImage(file) {
  const libheif = await getHeifModule();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoder = new libheif.HeifDecoder();
  const frames = decoder.decode(bytes);

  if (!frames.length) {
    throw new Error("heif-empty");
  }

  const frame = frames[0];
  const width = frame.get_width();
  const height = frame.get_height();
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const imageData = context.createImageData(width, height);

  await new Promise((resolve, reject) => {
    frame.display(imageData, (displayData) => {
      if (!displayData) {
        reject(new Error("heif-display-failed"));
        return;
      }

      resolve(displayData);
    });
  });

  context.putImageData(imageData, 0, 0);
  frames.forEach((item) => item.free?.());

  return {
    drawable: canvas,
    previewUrl: await createPreviewUrl(canvas),
    sourceType: formatFileLabel(file),
    width,
    height,
  };
}

async function decodeTiffImage(file) {
  const UTIF = window.UTIF;

  if (!UTIF) {
    updateDiagnosticValue("tiff", "스크립트 없음", "error");
    throw new Error("utif-not-loaded");
  }

  updateDiagnosticValue("tiff", "준비됨", "success");

  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  const ifd = ifds.find((item) => item?.t256?.[0] && item?.t257?.[0]) || ifds[0];

  if (!ifd) {
    throw new Error("tiff-empty");
  }

  UTIF.decodeImage(buffer, ifd, ifds);
  const rgba = UTIF.toRGBA8(ifd);

  if (!rgba?.length || !ifd.width || !ifd.height) {
    throw new Error("tiff-rgba-failed");
  }

  const canvas = createCanvasFromPixels(ifd.width, ifd.height, rgba);

  return {
    drawable: canvas,
    previewUrl: await createPreviewUrl(canvas),
    sourceType: formatFileLabel(file),
    width: ifd.width,
    height: ifd.height,
  };
}

function resolveRawDimensions(meta, payload, pixelLength) {
  const candidates = [
    [payload?.width, payload?.height],
    [meta?.width, meta?.height],
    [meta?.iwidth, meta?.iheight],
    [meta?.cwidth, meta?.cheight],
    [meta?.raw_width, meta?.raw_height],
    [meta?.sizes?.width, meta?.sizes?.height],
    [meta?.sizes?.iwidth, meta?.sizes?.iheight],
    [meta?.sizes?.raw_width, meta?.sizes?.raw_height],
    [meta?.thumb_width, meta?.thumb_height],
  ].filter(([width, height]) => Number(width) > 0 && Number(height) > 0);

  for (const [width, height] of candidates) {
    const area = Number(width) * Number(height);
    if (area * 4 === pixelLength || area * 3 === pixelLength) {
      return { width: Number(width), height: Number(height) };
    }
  }

  const [fallbackWidth, fallbackHeight] = candidates[0] || [];
  if (fallbackWidth && fallbackHeight) {
    return { width: Number(fallbackWidth), height: Number(fallbackHeight) };
  }

  return null;
}

function normalizePixelBuffer(pixelSource, width, height) {
  const payload =
    pixelSource &&
    typeof pixelSource === "object" &&
    ("data" in pixelSource || "imageData" in pixelSource)
      ? pixelSource
      : null;
  const pixels = payload?.data ?? payload?.imageData ?? pixelSource;
  const typed =
    ArrayBuffer.isView(pixels) && !(pixels instanceof DataView)
      ? pixels
      : new Uint8Array(pixels);
  const pixelCount = width * height;
  const channels = typed.length / pixelCount;
  const bitsPerSample =
    Number(payload?.bits) > 0 ? Number(payload.bits) : Math.max(8, typed.BYTES_PER_ELEMENT * 8);

  if (!Number.isInteger(channels) || (channels !== 3 && channels !== 4)) {
    throw new Error("raw-unsupported-channel-layout");
  }

  if (bitsPerSample <= 8 && (typed instanceof Uint8Array || typed instanceof Uint8ClampedArray)) {
    if (channels === 4) {
      return new Uint8ClampedArray(typed);
    }
  }

  const rgba = new Uint8ClampedArray(pixelCount * 4);
  const maxSampleValue = Math.max(1, (2 ** Math.min(bitsPerSample, 16)) - 1);
  const scaleToByte =
    bitsPerSample <= 8
      ? (value) => value
      : (value) => Math.round((Number(value) / maxSampleValue) * 255);

  for (
    let sourceIndex = 0, targetIndex = 0;
    sourceIndex < typed.length;
    sourceIndex += channels, targetIndex += 4
  ) {
    rgba[targetIndex] = scaleToByte(typed[sourceIndex]);
    rgba[targetIndex + 1] = scaleToByte(typed[sourceIndex + 1]);
    rgba[targetIndex + 2] = scaleToByte(typed[sourceIndex + 2]);
    rgba[targetIndex + 3] = channels === 4 ? scaleToByte(typed[sourceIndex + 3]) : 255;
  }

  return rgba;
}

async function decodeRawImage(file) {
  const extension = getFileExtension(file.name);

  if (previewPreferredRawExtensions.has(extension)) {
    try {
      const preview = await extractEmbeddedRawPreview(file);
      updateDiagnosticValue("raw", "임베디드 JPEG 프리뷰 사용", "warning");
      pushDiagnostic(`${file.name}은 LibRaw 대신 내장 프리뷰 JPEG로 열었습니다.`, "warning");
      return preview;
    } catch (error) {
      pushDiagnostic(`${file.name} 내장 프리뷰를 찾지 못해 LibRaw 디코더로 진행합니다.`, "info");
    }
  }

  const LibRaw = await getRawModule();
  const raw = new LibRaw();
  const bytes = new Uint8Array(await file.arrayBuffer());

  await raw.open(bytes, rawSettings);

  const metadata = await raw.metadata(true).catch(() => raw.metadata());
  const payload = await raw.imageData();
  const pixels = payload?.data ?? payload?.imageData ?? payload;
  const dimensions = resolveRawDimensions(metadata, payload, pixels.length);

  if (!dimensions) {
    throw new Error("raw-size-unavailable");
  }

  const rgba = normalizePixelBuffer(payload, dimensions.width, dimensions.height);
  const canvas = createCanvasFromPixels(dimensions.width, dimensions.height, rgba);

  updateDiagnosticValue(
    "raw",
    `준비됨 · ${payload?.bits || 8}bit ${payload?.data?.constructor?.name || ""}`.trim(),
    "success"
  );

  return {
    drawable: canvas,
    previewUrl: await createPreviewUrl(canvas),
    sourceType: formatFileLabel(file),
    width: dimensions.width,
    height: dimensions.height,
  };
}

async function decodeSourceFile(file) {
  const kind = getFileKind(file);

  if (kind === "raw") {
    return decodeRawImage(file);
  }

  if (kind === "heif") {
    return decodeHeifImage(file);
  }

  if (kind === "tiff") {
    return decodeTiffImage(file);
  }

  return loadNativeImage(file);
}

async function loadImage(file) {
  if (!isSupportedFile(file)) {
    setSourceFailure(
      file,
      "이 파일 형식은 아직 지원하지 않습니다. PNG, JPEG, WebP, HEIC, TIFF, RAW 계열을 사용해 주세요."
    );
    setStatus(
      "지원하지 않는 파일 형식입니다. PNG, JPEG, WebP, HEIC, TIFF, RAW 계열을 사용해 주세요.",
      { log: true, tone: "warning" }
    );
    return;
  }

  const loadRequestId = state.loadRequestId + 1;
  state.loadRequestId = loadRequestId;
  state.isLoading = true;
  clearLoadedSource();
  cleanupOutput();
  toggleControls(false);
  setSourceSummary({
    kicker: "불러오는 중",
    title: file.name,
    detail: `${formatFileLabel(file)} · ${formatBytes(file.size)}`,
  });
  setPreviewMessage(
    elements.originalFrame,
    elements.originalPreview,
    `${file.name} 미리보기를 준비 중입니다.`,
    "pending"
  );
  setStatus(`${file.name} 파일을 읽는 중입니다...`);

  let decoded;

  try {
    decoded = await decodeSourceFile(file);
  } catch (error) {
    if (!isActiveLoad(loadRequestId)) {
      return;
    }

    state.isLoading = false;
    toggleControls(Boolean(state.image));
    console.error(error);
    setSourceFailure(
      file,
      "파일을 읽지 못했습니다. 일부 RAW는 카메라별 지원 상태에 따라 열리지 않을 수 있습니다."
    );
    setStatus(
      "파일을 읽지 못했습니다. 일부 RAW는 카메라별 지원 상태에 따라 열리지 않을 수 있습니다.",
      { log: true, tone: "error" }
    );
    return;
  }

  if (!isActiveLoad(loadRequestId)) {
    disposeDecodedResult(decoded);
    return;
  }

  state.isLoading = false;

  if (state.inputUrl && state.inputUrl !== decoded.previewUrl) {
    revokeObjectUrl(state.inputUrl);
  }

  state.image = decoded.drawable;
  state.inputUrl = decoded.previewUrl;
  state.originalName = file.name.replace(/\.[^.]+$/, "");
  state.originalSize = file.size;
  state.originalType = decoded.sourceType;
  state.originalWidth = decoded.width;
  state.originalHeight = decoded.height;
  state.aspectRatio = decoded.width / decoded.height;

  showOriginalPreview(decoded.previewUrl, decoded.width, decoded.height);

  setSourceSummary({
    kicker: "원본 파일",
    title: file.name,
    detail: `${decoded.sourceType} · ${formatBytes(file.size)}`,
  });

  updateDimensionInputs(decoded.width, decoded.height);
  toggleControls(true);
  syncQualityLabel();

  pushDiagnostic(
    `${file.name} 불러옴 · ${decoded.sourceType} · ${decoded.width} × ${decoded.height}`,
    "success"
  );
  setStatus("파일을 불러왔습니다. 출력 포맷과 크기를 정한 뒤 변환하세요.");
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      try {
        const dataUrl = canvas.toDataURL(type, quality);
        if (!dataUrl.startsWith(`data:${type}`) && type !== "image/png") {
          reject(new Error("unsupported-type"));
          return;
        }

        fetch(dataUrl)
          .then((response) => response.blob())
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    }, type, quality);
  });
}

async function createConvertedBlob(canvas, type, quality) {
  if (type === "image/tiff") {
    const UTIF = window.UTIF;
    if (!UTIF) {
      throw new Error("utif-not-loaded");
    }

    const context = canvas.getContext("2d");
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const buffer = UTIF.encodeImage(imageData.data, canvas.width, canvas.height);
    return new Blob([buffer], { type: "image/tiff" });
  }

  return canvasToBlob(canvas, type, quality);
}

async function convertImage() {
  if (!state.image) {
    setStatus("먼저 사진을 선택해 주세요.", { log: true, tone: "warning" });
    return;
  }

  if (state.isLoading) {
    setStatus("새 파일을 읽는 중입니다. 불러오기가 끝난 뒤 다시 시도해 주세요.", {
      log: true,
      tone: "warning",
    });
    return;
  }

  const { width, height } = getRequestedOutputDimensions();
  const sizeError = validateOutputDimensions(width, height);
  updateDimensionInputs(width, height);
  if (sizeError) {
    setStatus(sizeError, { log: true, tone: "warning" });
    return;
  }

  const type = elements.formatSelect.value;
  const quality = Number(elements.qualityInput.value);
  const background = elements.backgroundInput.value;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (type === "image/jpeg") {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(state.image, 0, 0, width, height);
  cleanupOutput();

  setStatus("이미지를 변환 중입니다...", { log: true });

  try {
    const blob = await createConvertedBlob(canvas, type, quality);
    state.convertedBlob = blob;
    state.convertedUrl = URL.createObjectURL(blob);
    state.currentFormat = type;
    state.quality = quality;
    state.background = background;

    showConvertedPreview(state.convertedUrl, `${formatLabels[type]} · ${formatBytes(blob.size)}`);
    elements.downloadButton.disabled = false;

    const sizeDelta = state.originalSize
      ? Math.round((1 - blob.size / state.originalSize) * 100)
      : 0;

    setStatus(
      `변환 완료. ${width} × ${height}, ${formatLabels[type]} ${formatBytes(blob.size)}${
        Number.isFinite(sizeDelta) ? `, 원본 대비 ${sizeDelta >= 0 ? "-" : "+"}${Math.abs(sizeDelta)}%` : ""
      }`,
      { log: true, tone: "success" }
    );
  } catch (error) {
    console.error(error);
    setPreviewMessage(
      elements.convertedFrame,
      elements.convertedPreview,
      "현재 환경에서 이 출력 포맷을 만들지 못했습니다.",
      "error"
    );
    setStatus(
      "현재 환경에서 이 출력 포맷을 만들지 못했습니다. 다른 포맷으로 다시 시도해 주세요.",
      { log: true, tone: "error" }
    );
  }
}

function downloadResult() {
  if (!state.convertedBlob || !state.convertedUrl) {
    return;
  }

  const link = document.createElement("a");
  link.href = state.convertedUrl;
  link.download = `${state.originalName || "converted-image"}.${extensionForMime(state.currentFormat)}`;
  document.body.append(link);
  link.click();
  link.remove();
  pushDiagnostic(`${link.download} 저장 시작.`, "success");
}

function handleFiles(fileList) {
  const [file] = Array.from(fileList);
  if (!file) {
    return;
  }
  loadImage(file);
}

elements.pickButton.addEventListener("click", () => {
  elements.imageInput.click();
});

elements.imageInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
});

elements.resetButton.addEventListener("click", () => {
  resetAll();
  pushDiagnostic("작업 상태를 초기화했습니다.", "info");
});

elements.widthInput.addEventListener("input", onWidthChange);
elements.heightInput.addEventListener("input", onHeightChange);

elements.lockAspect.addEventListener("change", () => {
  if (elements.lockAspect.checked) {
    onWidthChange();
  }
});

elements.qualityInput.addEventListener("input", syncQualityLabel);
elements.formatSelect.addEventListener("change", () => {
  updateFormatControls();
});
elements.convertButton.addEventListener("click", () => {
  convertImage();
});

elements.downloadButton.addEventListener("click", () => {
  downloadResult();
});

elements.copyDiagnosticsButton.addEventListener("click", () => {
  copyDiagnostics();
});

elements.dropzone.addEventListener("dragenter", () => {
  elements.dropzone.classList.add("is-active");
});

elements.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropzone.classList.add("is-active");
});

elements.dropzone.addEventListener("dragleave", (event) => {
  if (!elements.dropzone.contains(event.relatedTarget)) {
    elements.dropzone.classList.remove("is-active");
  }
});

elements.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropzone.classList.remove("is-active");
  handleFiles(event.dataTransfer.files);
});

elements.dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.imageInput.click();
  }
});

syncRuntimeDiagnostics();
syncDecoderDiagnostics();
syncCommercialInfo();
pushDiagnostic("진단 패널 준비 완료.", "success");

if (getDesktopBridge()?.isDesktop) {
  updateDiagnosticValue("serviceWorker", "데스크톱 앱에서는 사용 안 함", "neutral");
} else if ("serviceWorker" in navigator) {
  updateDiagnosticValue("serviceWorker", "등록 대기", "pending");
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => {
        updateDiagnosticValue("serviceWorker", "등록됨", "success");
        pushDiagnostic("오프라인 캐시 등록 완료.", "success");
      })
      .catch((error) => {
        console.error("Service worker registration failed", error);
        updateDiagnosticValue("serviceWorker", "등록 실패", "error");
        pushDiagnostic("오프라인 캐시 등록에 실패했습니다.", "error");
      });
  });
} else {
  updateDiagnosticValue("serviceWorker", "지원 안 함", "warning");
}

resetAll();
scheduleIdleTask(() => {
  probeHeifDecoder();
});
