export const ErrorCode = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CAPACITY_EXHAUSTED: 'CAPACITY_EXHAUSTED',
  RATE_LIMITED: 'RATE_LIMIT_EXCEEDED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode] | string;

export interface ErrorDetail {
  readonly field?: string;
  readonly issue?: string;
}

export interface AppErrorOptions {
  readonly code?: ErrorCodeValue;
  readonly status?: number;
  readonly details?: readonly ErrorDetail[];
}

const OFFLINE_CODES: ReadonlySet<string> = new Set([ErrorCode.NETWORK, ErrorCode.TIMEOUT]);

const RETRYABLE_CODES: ReadonlySet<string> = new Set([
  ErrorCode.NETWORK,
  ErrorCode.TIMEOUT,
  ErrorCode.CAPACITY_EXHAUSTED,
  ErrorCode.RATE_LIMITED,
]);

export class AppError extends Error {
  readonly code: ErrorCodeValue;
  readonly status: number;
  readonly details: readonly ErrorDetail[];

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = options.code ?? ErrorCode.UNKNOWN;
    this.status = options.status ?? 0;
    this.details = options.details ?? [];
  }

  get isOffline(): boolean {
    return OFFLINE_CODES.has(this.code);
  }

  get isRetryable(): boolean {
    return RETRYABLE_CODES.has(this.code);
  }

  get requiresSignIn(): boolean {
    return this.code === ErrorCode.SESSION_EXPIRED || this.code === ErrorCode.UNAUTHENTICATED;
  }
}

export const isAppError = (value: unknown): value is AppError => value instanceof AppError;

export const isOfflineError = (value: unknown): boolean => isAppError(value) && value.isOffline;

export const messageOf = (error: unknown, fallback: string): string => {
  if (isAppError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
