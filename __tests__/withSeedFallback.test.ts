import { withSeedFallback } from '../src/data/repositories/withSeedFallback';
import { AppError, ErrorCode } from '../src/domain/errors/AppError';
import type { Post } from '../src/domain/entities/Post';
import type {
  FeedRepository,
  FeedSurfaceValue,
} from '../src/domain/repositories/FeedRepository';
import type { Page } from '../src/domain/repositories/common';
import { samplePost } from '../test-support/fakeRepositories';

const LIVE_POST = samplePost('live');
const SEED_POST = samplePost('seed');

class FailingFeed implements FeedRepository {
  calls = 0;

  constructor(private readonly error: unknown) {}

  async load(): Promise<Page<Post>> {
    this.calls += 1;
    throw this.error;
  }
}

class WorkingFeed implements FeedRepository {
  calls = 0;

  async load(): Promise<Page<Post>> {
    this.calls += 1;
    return { items: [LIVE_POST], nextCursor: null };
  }
}

const seed = {
  load: jest.fn(async (_surface?: FeedSurfaceValue): Promise<Page<Post>> => ({
    items: [SEED_POST],
    nextCursor: null,
  })),
};

beforeEach(() => {
  seed.load.mockClear();
});

describe('withSeedFallback', () => {
  it('passes through when the live repository succeeds', async () => {
    const repository = withSeedFallback<FeedRepository>(new WorkingFeed(), seed);

    const page = await repository.load('home');
    expect(page.items).toEqual([LIVE_POST]);
    expect(seed.load).not.toHaveBeenCalled();
  });

  it('falls back to the seed dataset when the server is unreachable', async () => {
    const live = new FailingFeed(new AppError('offline', { code: ErrorCode.NETWORK }));
    const notify = jest.fn();
    const repository = withSeedFallback<FeedRepository>(live, seed, notify);

    const page = await repository.load('home');
    expect(page.items).toEqual([SEED_POST]);
    expect(live.calls).toBe(1);
    expect(seed.load).toHaveBeenCalledWith('home');
    expect(notify).toHaveBeenCalledWith('load', expect.any(AppError));
  });

  it('falls back on a timeout too', async () => {
    const live = new FailingFeed(new AppError('slow', { code: ErrorCode.TIMEOUT }));
    const repository = withSeedFallback<FeedRepository>(live, seed);

    const page = await repository.load('home');
    expect(page.items).toEqual([SEED_POST]);
  });

  it('rethrows an error the server actually answered with', async () => {
    const live = new FailingFeed(new AppError('nope', { code: 'POST_NOT_FOUND', status: 404 }));
    const repository = withSeedFallback<FeedRepository>(live, seed);

    await expect(repository.load('home')).rejects.toMatchObject({ code: 'POST_NOT_FOUND' });
    expect(seed.load).not.toHaveBeenCalled();
  });

  it('rethrows when the seed repository cannot serve that method', async () => {
    const live = new FailingFeed(new AppError('offline', { code: ErrorCode.NETWORK }));
    const repository = withSeedFallback<FeedRepository>(live, {});

    await expect(repository.load('home')).rejects.toMatchObject({ code: ErrorCode.NETWORK });
  });

  it('rethrows a plain error rather than masking it with fixtures', async () => {
    const live = new FailingFeed(new Error('programmer error'));
    const repository = withSeedFallback<FeedRepository>(live, seed);

    await expect(repository.load('home')).rejects.toThrow('programmer error');
    expect(seed.load).not.toHaveBeenCalled();
  });
});
