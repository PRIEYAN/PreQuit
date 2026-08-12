import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { getAccessToken, getRefreshToken, saveSession, clearSession } from './tokens';

/**
 * An error carrying the API's own code so screens can branch on it
 * ("EMAIL_NOT_VERIFIED") instead of pattern-matching on message text.
 */
export class ApiError extends Error {
  constructor(message, { code, status, details = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code ?? 'UNKNOWN';
    this.status = status ?? 0;
    this.details = details;
  }

  get isNetworkError() {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }
}

// Called when refresh fails and the session is unrecoverable, so the app can
// send the user back to sign-in from wherever they are.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = handler => {
  onUnauthorized = typeof handler === 'function' ? handler : () => {};
};

async function rawRequest(path, { method = 'GET', body, token, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // Honour a caller's cancellation (screen unmounted) as well as the timeout.
  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener('abort', onAbort);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // 204 and other empty bodies are valid successes, not parse failures.
    const text = await response.text();
    const payload = text ? safeParse(text) : null;
    return { response, payload };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The request timed out.', { code: 'TIMEOUT' });
    }
    throw new ApiError('Could not reach the server.', { code: 'NETWORK_ERROR' });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Serialises refresh across concurrent 401s. A feed screen can fire several
 * requests at once; without this each would start its own refresh and all but
 * one would present an already-rotated refresh token, which the server revokes
 * as replay.
 */
let refreshInFlight = null;

async function refreshSession() {
  const token = getRefreshToken();
  if (!token) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const { response, payload } = await rawRequest('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: token },
      });
      if (!response.ok || !payload?.data?.accessToken) return false;
      await saveSession({
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken ?? token,
        user: payload.data.user,
      });
      return true;
    })()
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function request(path, options = {}) {
  const { auth = true, retryOn401 = true, ...rest } = options;
  const token = auth ? getAccessToken() : undefined;
  const { response, payload } = await rawRequest(path, { ...rest, token });

  if (response.status === 401 && auth && retryOn401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request(path, { ...options, retryOn401: false });
    }
    await clearSession();
    onUnauthorized();
    throw new ApiError('Your session expired. Please sign in again.', {
      code: 'SESSION_EXPIRED',
      status: 401,
    });
  }

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(error?.message ?? 'Something went wrong.', {
      code: error?.code,
      status: response.status,
      details: error?.details ?? [],
    });
  }

  // The API wraps every success in { data: ... }.
  return payload?.data ?? null;
}

export const get = (path, options) => request(path, { ...options, method: 'GET' });
export const post = (path, body, options) => request(path, { ...options, method: 'POST', body });
export const patch = (path, body, options) => request(path, { ...options, method: 'PATCH', body });
export const del = (path, options) => request(path, { ...options, method: 'DELETE' });

export default { request, get, post, patch, del, ApiError, setUnauthorizedHandler };
