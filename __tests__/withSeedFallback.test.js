import { withSeedFallback } from '../src/data/repositories/withSeedFallback';
import { FeedRepository } from '../src/domain/repositories/FeedRepository';
import { AppError, ErrorCode } from '../src/domain/errors/AppError';

class FailingFeed extends FeedRepository {
  constructor(error) {
    super();
    this.error = error;
    this.calls = 0;
  }

  async load() {
    this.calls += 1;
    throw this.error;
  }
}

class WorkingFeed extends FeedRepository {
  constructor() {
    super();
    this.calls = 0;
  }

  async load() {
    this.calls += 1;
    return { items: ['live'], nextCursor: null };
  }
}

const seed = { load: jest.fn(async () => ({ items: ['seed'], nextCursor: null })) };

beforeEach(() => {
  seed.load.mockClear();
});

describe('withSeedFallback', () => {
  it('passes through when the live repository succeeds', async () => {
    const live = new WorkingFeed();
    const repository = withSeedFallback(live, seed);

    await expect(repository.load('home')).resolves.toEqual({ items: ['live'], nextCursor: null });
    expect(seed.load).not.toHaveBeenCalled();
  });

  it('falls back to the seed dataset when the server is unreachable', async () => {
    const live = new FailingFeed(new AppError('offline', { code: ErrorCode.NETWORK }));
    const notify = jest.fn();
    const repository = withSeedFallback(live, seed, notify);

    await expect(repository.load('home')).resolves.toEqual({ items: ['seed'], nextCursor: null });
    expect(live.calls).toBe(1);
    expect(seed.load).toHaveBeenCalledWith('home');
    expect(notify).toHaveBeenCalledWith('load', expect.any(AppError));
  });

  it('falls back on a timeout too', async () => {
    const live = new FailingFeed(new AppError('slow', { code: ErrorCode.TIMEOUT }));
    const repository = withSeedFallback(live, seed);

    await expect(repository.load('home')).resolves.toEqual({ items: ['seed'], nextCursor: null });
  });

  it('rethrows an error the server actually answered with', async () => {
    const live = new FailingFeed(new AppError('nope', { code: 'POST_NOT_FOUND', status: 404 }));
    const repository = withSeedFallback(live, seed);

    await expect(repository.load('home')).rejects.toMatchObject({ code: 'POST_NOT_FOUND' });
    expect(seed.load).not.toHaveBeenCalled();
  });

  it('rethrows when the seed repository cannot serve that method', async () => {
    const live = new FailingFeed(new AppError('offline', { code: ErrorCode.NETWORK }));
    const repository = withSeedFallback(live, {});

    await expect(repository.load('home')).rejects.toMatchObject({ code: ErrorCode.NETWORK });
  });

  it('keeps the decorated repository substitutable for its port', () => {
    const repository = withSeedFallback(new WorkingFeed(), seed);
    expect(repository).toBeInstanceOf(FeedRepository);
  });
});
