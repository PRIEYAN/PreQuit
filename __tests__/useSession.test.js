import { useSession } from '../src/presentation/hooks/useSession';
import { AppError, ErrorCode } from '../src/domain/errors/AppError';
import { renderHookValue, flush, actAsync } from '../test-support/renderHookValue';
import { createTestContainer, withSession } from '../test-support/testContainer';
import { FakeSessionRepository } from '../test-support/fakeRepositories';

const setup = container => ({
  container,
  ...renderHookValue(() => useSession(), withSession(container)),
});

describe('session lifecycle', () => {
  it('starts signed out when nothing is stored', async () => {
    const { ref } = setup(createTestContainer());
    await flush();

    expect(ref.current.isSignedIn).toBe(false);
    expect(ref.current.user).toBeNull();
  });

  it('restores a stored session by confirming it with the server', async () => {
    const session = new FakeSessionRepository({ accessToken: 'a', refreshToken: 'r' });
    const { ref } = setup(createTestContainer({ session }));
    await flush();

    expect(ref.current.isSignedIn).toBe(true);
    expect(ref.current.user.handle).toBe('you');
  });

  it('keeps the cached user signed in while offline', async () => {
    const cached = { id: 'me', handle: 'cached', displayName: 'Cached' };
    const session = new FakeSessionRepository({ accessToken: 'a', refreshToken: 'r', user: cached });
    const container = createTestContainer({ session });
    container.repositories.auth.meError = new AppError('offline', { code: ErrorCode.NETWORK });

    const { ref } = setup(container);
    await flush();

    expect(ref.current.isSignedIn).toBe(true);
    expect(ref.current.user.handle).toBe('cached');
  });

  it('drops a session the server rejects', async () => {
    const session = new FakeSessionRepository({ accessToken: 'a', refreshToken: 'r', user: { id: 'me' } });
    const container = createTestContainer({ session });
    container.repositories.auth.meError = new AppError('gone', { code: ErrorCode.UNAUTHENTICATED, status: 401 });

    const { ref } = setup(container);
    await flush();

    expect(ref.current.isSignedIn).toBe(false);
    expect(session.accessToken()).toBeNull();
  });

  it('signs in and persists the tokens', async () => {
    const session = new FakeSessionRepository();
    const { ref } = setup(createTestContainer({ session }));
    await flush();

    await actAsync(() => ref.current.signIn('you', 'password'));

    expect(ref.current.isSignedIn).toBe(true);
    expect(session.accessToken()).toBe('a');
  });

  it('surfaces a failed sign-in without changing state', async () => {
    const container = createTestContainer();
    container.repositories.auth.signInError = new AppError('bad', { code: 'INVALID_CREDENTIALS', status: 401 });
    const { ref } = setup(container);
    await flush();

    await expect(ref.current.signIn('you', 'wrong')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(ref.current.isSignedIn).toBe(false);
  });

  it('clears the session on sign out', async () => {
    const session = new FakeSessionRepository({ accessToken: 'a', refreshToken: 'r' });
    const { ref } = setup(createTestContainer({ session }));
    await flush();
    await actAsync(() => ref.current.signOut());

    expect(ref.current.isSignedIn).toBe(false);
    expect(session.accessToken()).toBeNull();
  });

  it('signs the viewer out when the data layer reports the session is gone', async () => {
    const session = new FakeSessionRepository({ accessToken: 'a', refreshToken: 'r' });
    const container = createTestContainer({ session });
    const { ref } = setup(container);
    await flush();
    expect(ref.current.isSignedIn).toBe(true);

    await actAsync(async () => container.notifySessionLost());

    expect(ref.current.isSignedIn).toBe(false);
  });
});
