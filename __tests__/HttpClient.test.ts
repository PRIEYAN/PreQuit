import { HttpClient } from '../src/data/http/HttpClient';
import { AppError, ErrorCode } from '../src/domain/errors/AppError';
import { FakeSessionRepository } from '../test-support/fakeRepositories';
import type { SessionRepository } from '../src/domain/repositories/SessionRepository';

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit]>;

const fetchMock = (): FetchMock => globalThis.fetch as unknown as FetchMock;

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }) as Response;

const emptyResponse = (status: number): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => '',
  }) as Response;

const buildClient = (session: SessionRepository, onSessionLost = jest.fn()): HttpClient =>
  new HttpClient({ baseUrl: 'http://api.test/v1', timeoutMs: 100, session, onSessionLost });

const refreshCalls = (): unknown[][] =>
  fetchMock().mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'));

const asAppError = (value: unknown): AppError => {
  if (!(value instanceof AppError)) throw new Error('expected an AppError');
  return value;
};

beforeEach(() => {
  globalThis.fetch = jest.fn() as unknown as typeof fetch;
});

afterEach(() => {
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

describe('HttpClient', () => {
  it('unwraps the data envelope', async () => {
    fetchMock().mockResolvedValue(jsonResponse(200, { data: { id: 'p1' } }));
    const client = buildClient(new FakeSessionRepository());

    await expect(client.get('/posts/p1', { authenticated: false })).resolves.toEqual({ id: 'p1' });
  });

  it('treats an empty success body as null rather than a parse failure', async () => {
    fetchMock().mockResolvedValue(emptyResponse(204));
    const client = buildClient(new FakeSessionRepository());

    await expect(client.delete('/posts/p1', { authenticated: false })).resolves.toBeNull();
  });

  it('attaches the access token when the call is authenticated', async () => {
    fetchMock().mockResolvedValue(jsonResponse(200, { data: null }));
    const client = buildClient(new FakeSessionRepository({ accessToken: 'token-1' }));

    await client.get('/auth/me');

    const [, init] = fetchMock().mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-1');
  });

  it('maps an API error body onto its code', async () => {
    fetchMock().mockResolvedValue(
      jsonResponse(403, { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Verify first', details: [] } }),
    );
    const client = buildClient(new FakeSessionRepository());

    await expect(client.post('/posts', {}, { authenticated: false })).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      status: 403,
    });
  });

  it('reports an unreachable server as an offline error', async () => {
    fetchMock().mockRejectedValue(new TypeError('Network request failed'));
    const client = buildClient(new FakeSessionRepository());

    const error = asAppError(
      await client.get('/feed/home', { authenticated: false }).catch(caught => caught),
    );

    expect(error.code).toBe(ErrorCode.NETWORK);
    expect(error.isOffline).toBe(true);
  });

  it('reports an aborted request as a timeout', async () => {
    fetchMock().mockImplementation(() => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });
    const client = buildClient(new FakeSessionRepository());

    const error = asAppError(
      await client.get('/feed/home', { authenticated: false }).catch(caught => caught),
    );

    expect(error.code).toBe(ErrorCode.TIMEOUT);
    expect(error.isOffline).toBe(true);
  });

  it('refreshes once for concurrent 401s and retries both calls', async () => {
    const session = new FakeSessionRepository({ accessToken: 'stale', refreshToken: 'refresh-1' });
    const client = buildClient(session);

    fetchMock().mockImplementation((url: string, init: RequestInit) => {
      if (String(url).endsWith('/auth/refresh')) {
        return Promise.resolve(
          jsonResponse(200, { data: { accessToken: 'fresh', refreshToken: 'refresh-2' } }),
        );
      }
      const headers = init.headers as Record<string, string>;
      if (headers.Authorization === 'Bearer stale') {
        return Promise.resolve(jsonResponse(401, { error: { code: 'UNAUTHENTICATED' } }));
      }
      return Promise.resolve(jsonResponse(200, { data: { ok: true } }));
    });

    const [first, second] = await Promise.all([
      client.get('/feed/home'),
      client.get('/notifications'),
    ]);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(refreshCalls()).toHaveLength(1);
    expect(session.accessToken()).toBe('fresh');
  });

  it('clears the session and notifies once refresh is rejected', async () => {
    const session = new FakeSessionRepository({ accessToken: 'stale', refreshToken: 'refresh-1' });
    const onSessionLost = jest.fn();
    const client = buildClient(session, onSessionLost);

    fetchMock().mockImplementation((url: string) =>
      Promise.resolve(
        String(url).endsWith('/auth/refresh')
          ? jsonResponse(401, { error: { code: 'INVALID_REFRESH_TOKEN' } })
          : jsonResponse(401, { error: { code: 'UNAUTHENTICATED' } }),
      ),
    );

    await expect(client.get('/feed/home')).rejects.toMatchObject({
      code: ErrorCode.SESSION_EXPIRED,
    });
    expect(onSessionLost).toHaveBeenCalledTimes(1);
    expect(session.accessToken()).toBeNull();
  });

  it('does not attempt a refresh when there is no refresh token', async () => {
    const session = new FakeSessionRepository({ accessToken: 'stale' });
    const client = buildClient(session);
    fetchMock().mockResolvedValue(jsonResponse(401, { error: { code: 'UNAUTHENTICATED' } }));

    await expect(client.get('/feed/home')).rejects.toMatchObject({
      code: ErrorCode.SESSION_EXPIRED,
    });
    expect(refreshCalls()).toHaveLength(0);
  });
});
