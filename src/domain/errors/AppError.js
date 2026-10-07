export const ErrorCode = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CAPACITY_EXHAUSTED: 'CAPACITY_EXHAUSTED',
  RATE_LIMITED: 'RATE_LIMIT_EXCEEDED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  UNKNOWN: 'UNKNOWN',
};

const OFFLINE_CODES = new Set([ErrorCode.NETWORK, ErrorCode.TIMEOUT]);
const RETRYABLE_CODES = new Set([ErrorCode.NETWORK, ErrorCode.TIMEOUT, ErrorCode.CAPACITY_EXHAUSTED, ErrorCode.RATE_LIMITED]);

export class AppError extends Error {
  constructor(message, { code = ErrorCode.UNKNOWN, status = 0, details = [] } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  get isOffline() {
    return OFFLINE_CODES.has(this.code);
  }

  get isRetryable() {
    return RETRYABLE_CODES.has(this.code);
  }

  get requiresSignIn() {
    return this.code === ErrorCode.SESSION_EXPIRED || this.code === ErrorCode.UNAUTHENTICATED;
  }
}

export class NotImplementedError extends AppError {
  constructor(member) {
    super(`${member} must be implemented by a concrete adapter.`, { code: ErrorCode.NOT_IMPLEMENTED });
    this.name = 'NotImplementedError';
  }
}
