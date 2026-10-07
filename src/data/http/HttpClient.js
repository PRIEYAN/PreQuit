import { AppError, ErrorCode } from '../../domain/errors/AppError';

const JSON_HEADERS = { Accept: 'application/json' };

const parseJson = text => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export class HttpClient {
  constructor({ baseUrl, timeoutMs, session, onSessionLost = () => {} }) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
    this.session = session;
    this.onSessionLost = onSessionLost;
    this.refreshInFlight = null;
  }

  get(path, options) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options) {
    return this.request(path, { ...options, method: 'POST', body });
  }

  patch(path, body, options) {
    return this.request(path, { ...options, method: 'PATCH', body });
  }

  put(path, body, options) {
    return this.request(path, { ...options, method: 'PUT', body });
  }

  delete(path, options) {
    return this.request(path, { ...options, method: 'DELETE' });
  }

  async request(path, options = {}) {
    const { authenticated = true, allowRefresh = true, ...rest } = options;
    const token = authenticated ? this.session.accessToken() : undefined;
    const { response, payload } = await this.send(path, { ...rest, token });

    if (response.status === 401 && authenticated && allowRefresh) {
      const refreshed = await this.refreshSession();
      if (refreshed) return this.request(path, { ...options, allowRefresh: false });

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

  async send(path, { method = 'GET', body, token, signal } = {}) {
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
      return { response, payload: parseJson(await response.text()) };
    } catch (err) {
      if (err?.name === 'AbortError') {
        throw new AppError('The request timed out.', { code: ErrorCode.TIMEOUT });
      }
      throw new AppError('Could not reach the server.', { code: ErrorCode.NETWORK });
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', forwardAbort);
    }
  }

  toError(response, payload) {
    const error = payload?.error;
    return new AppError(error?.message ?? 'Something went wrong.', {
      code: error?.code ?? ErrorCode.UNKNOWN,
      status: response.status,
      details: error?.details ?? [],
    });
  }

  refreshSession() {
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

  async performRefresh(refreshToken) {
    const { response, payload } = await this.send('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    if (!response.ok || !payload?.data?.accessToken) return false;

    await this.session.write({
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken ?? refreshToken,
      user: payload.data.user,
    });
    return true;
  }
}

export default HttpClient;
