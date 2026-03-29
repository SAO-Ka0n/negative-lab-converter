export class ConverterError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ConverterError";
  }
}

export function normalizeUnknownError(error: unknown, fallback = "알 수 없는 오류가 발생했습니다.") {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
