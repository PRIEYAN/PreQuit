/**
 * @format
 */

import { request, ApiError, setUnauthorizedHandler } from '../src/api/client';
import { saveSession, clearSession, getAccessToken } from '../src/api/tokens';

const jsonResponse = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  text: async () => JSON.stringify(body),
});

beforeEach(async () => {
  await clearSession();
  setUnauthorizedHandler(() => {});
  global.fetch = jest.fn();
});

describe('request', () => {
  it('unwraps the data envelope', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(200, { data: { id: 'p1' } }));
    await expect(request('/posts/p1')).resolves.toEqual({ id: 'p1' });
  });

  it('sends the access token when there is a session', async () => {
    await saveSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    global.fetch.mockResolvedValueOnce(jsonResponse(200, { data: null }));
    await request('/auth/me');
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer access-1');
  });

  it('throws an ApiError carrying the API error code', async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse(403, { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Verify first.' } }),
    );
    await expect(request('/posts', { method: 'POST' })).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      status: 403,
    });
  });

  it('reports an unreachable server as a network error', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    const error = await request('/auth/me').catch(e => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.isNetworkError).toBe(true);
  });

  it('treats an empty body as a success, not a parse failure', async () => {
    global.fetch.mockResolvedValueOnce({ status: 204, ok: true, text: async () => '' });
    await expect(request('/posts/p1', { method: 'DELETE' })).resolves.toBeNull();
  });
});

describe('401 handling', () => {
  it('refreshes once and replays the original request', async () => {
    await saveSession({ accessToken: 'expired', refreshToken: 'refresh-1' });
    global.fetch
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'UNAUTHORIZED' } }))
      .mockResolvedValueOnce(
        jsonResponse(200, { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { data: { handle: 'nova' } }));

    await expect(request('/auth/me')).resolves.toEqual({ handle: 'nova' });
    expect(getAccessToken()).toBe('access-2');
  });

  it('shares one refresh across concurrent 401s', async () => {
    await saveSession({ accessToken: 'expired', refreshToken: 'refresh-1' });
    global.fetch.mockImplementation(async (url, options) => {
      if (String(url).endsWith('/auth/refresh')) {
        return jsonResponse(200, { data: { accessToken: 'access-2', refreshToken: 'refresh-2' } });
      }
      const token = options?.headers?.Authorization;
      if (token === 'Bearer expired') return jsonResponse(401, { error: { code: 'UNAUTHORIZED' } });
      return jsonResponse(200, { data: { handle: 'nova' } });
    });

    const results = await Promise.all([request('/a'), request('/b'), request('/c')]);
    expect(results).toEqual([{ handle: 'nova' }, { handle: 'nova' }, { handle: 'nova' }]);

    // Rotating the refresh token more than once would present an already-used
    // token to the server, which correctly treats that as replay.
    const refreshCalls = global.fetch.mock.calls.filter(([url]) =>
      String(url).endsWith('/auth/refresh'),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('clears the session and notifies when refresh fails', async () => {
    await saveSession({ accessToken: 'expired', refreshToken: 'dead' });
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    global.fetch
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'UNAUTHORIZED' } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'INVALID_REFRESH' } }));

    await expect(request('/auth/me')).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    expect(getAccessToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('does not attempt refresh for unauthenticated calls', async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(401, { error: { code: 'INVALID_CREDENTIALS' } }));
    await expect(request('/auth/login', { auth: false, method: 'POST' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
