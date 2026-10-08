import { AppError, ErrorCode, type ErrorDetail } from '../../domain/errors/AppError';
import type { SessionRepository } from '../../domain/repositories/SessionRepository';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestInitOptions {
  readonly method?: HttpMethod;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly authenticated?: boolean;
  readonly allowRefresh?: boolean;
}

export type CallOptions = Omit<RequestInitOptions, 'method' | 'body'>;

interface Envelope<T> {
  readonly data?: T;
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
    readonly details?: readonly ErrorDetail[];
  };
}

interface RawExchange<T> {
  readonly response: Response;
  readonly payload: Envelope<T> | null;
}

export interface HttpClientOptions {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly session: SessionRepository;
  readonly onSessionLost?: () => void;
}

const JSON_HEADERS: Readonly<Record<string, string>> = { Accept: 'application/json' };

const parseJson = <T>(text: string): Envelope<T> | null => {
  if (!text) return null;
  try {
    return JSON.parse(text) as Envelope<T>;
  } catch {
    return null;
  }
};

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly session: SessionRepository;
  private readonly onSessionLost: () => void;
  private refreshInFlight: Promise<boolean> | null = null;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.timeoutMs = options.timeoutMs;
    this.session = options.session;
    this.onSessionLost = options.onSessionLost ?? (() => {});
  }

  get<T>(path: string, options?: CallOptions): Promise<T | null> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: CallOptions): Promise<T | null> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown, options?: CallOptions): Promise<T | null> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  put<T>(path: string, body?: unknown, options?: CallOptions): Promise<T | null> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  delete<T>(path: string, options?: CallOptions): Promise<T | null> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  async request<T>(path: string, options: RequestInitOptions = {}): Promise<T | null> {
    const { authenticated = true, allowRefresh = true, ...rest } = options;
    const token = authenticated ? this.session.accessToken() : undefined;
    const { response, payload } = await this.send<T>(path, rest, token);

    if (response.status === 401 && authenticated && allowRefresh) {
      const refreshed = await this.refreshSession();
      if (refreshed) return this.request<T>(path, { ...options, allowRefresh: false });

      await this.session.clear();
      this.onSessionLost();
      throw new AppError('Your session expired. Please sign in again.', {
        code: ErrorCode.SESSION_EXPIRED,
        status: 401,
      });
    }

    if (!response.ok) throw this.toError(response, payload);
    return payload?.data ?? null;
  }

  private async send<T>(
    path: string,
    options: Omit<RequestInitOptions, 'authenticated' | 'allowRefresh'>,
    token?: string | null,
  ): Promise<RawExchange<T>> {
    const { method = 'GET', body, signal } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const forwardAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', forwardAbort);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          ...JSON_HEADERS,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return { response, payload: parseJson<T>(await response.text()) };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError('The request timed out.', { code: ErrorCode.TIMEOUT });
      }
      throw new AppError('Could not reach the server.', { code: ErrorCode.NETWORK });
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', forwardAbort);
    }
  }

  private toError(response: Response, payload: Envelope<unknown> | null): AppError {
    const error = payload?.error;
    return new AppError(error?.message ?? 'Something went wrong.', {
      code: error?.code ?? ErrorCode.UNKNOWN,
      status: response.status,
      details: error?.details ?? [],
    });
  }

  private refreshSession(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const refreshToken = this.session.refreshToken();
    if (!refreshToken) return Promise.resolve(false);

    this.refreshInFlight = this.performRefresh(refreshToken)
      .catch(() => false)
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  private async performRefresh(refreshToken: string): Promise<boolean> {
    const { response, payload } = await this.send<{
      accessToken?: string;
      refreshToken?: string;
      user?: never;
    }>('/auth/refresh', { method: 'POST', body: { refreshToken } });

    const data = payload?.data;
    if (!response.ok || !data?.accessToken) return false;

    await this.session.write({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
      ...(data.user ? { user: data.user } : {}),
    });
    return true;
  }
}

export default HttpClient;
