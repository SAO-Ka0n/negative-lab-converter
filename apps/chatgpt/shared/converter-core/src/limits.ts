export const MAX_OUTPUT_EDGE = 12_000;
export const MAX_OUTPUT_PIXELS = 75_000_000;

export function fitDimensionsWithinLimits(width: number, height: number) {
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

  return {
    width: nextWidth,
    height: nextHeight,
  };
}

export function validateOutputDimensions(width: number, height: number): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return "출력 크기는 1px 이상 정수여야 합니다.";
  }

  if (width > MAX_OUTPUT_EDGE || height > MAX_OUTPUT_EDGE) {
    return `출력 크기는 가로/세로 각각 최대 ${MAX_OUTPUT_EDGE.toLocaleString("ko-KR")}px까지 가능합니다.`;
  }

  const pixels = width * height;
  if (pixels > MAX_OUTPUT_PIXELS) {
    return `출력 크기는 최대 ${MAX_OUTPUT_PIXELS.toLocaleString("ko-KR")}픽셀까지 가능합니다.`;
  }

  return null;
}

export function clampRequestedLongEdge(value?: number | null) {
  if (!value || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(1, Math.min(MAX_OUTPUT_EDGE, Math.round(value)));
}
