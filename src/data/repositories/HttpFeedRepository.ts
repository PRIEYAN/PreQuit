import type { Post } from '../../domain/entities/Post';
import {
  FeedSurface,
  type FeedRepository,
  type FeedSurfaceValue,
} from '../../domain/repositories/FeedRepository';
import type { Page, PageOptions } from '../../domain/repositories/common';
import type { HttpClient } from '../http/HttpClient';
import { toFeedPage } from '../mappers/PostMapper';

const PATHS: Readonly<Record<FeedSurfaceValue, string>> = {
  [FeedSurface.HOME]: '/feed/home',
  [FeedSurface.EXPLORE]: '/feed/explore',
  [FeedSurface.TRENDING]: '/feed/trending',
};

export class HttpFeedRepository implements FeedRepository {
  constructor(private readonly http: HttpClient) {}

  async load(
    surface: FeedSurfaceValue = FeedSurface.HOME,
    options: PageOptions = {},
  ): Promise<Page<Post>> {
    const { limit = 20, signal } = options;
    const path = PATHS[surface] ?? PATHS[FeedSurface.HOME];
    const authenticated = surface === FeedSurface.HOME;
    const dto = await this.http.get<Parameters<typeof toFeedPage>[0]>(`${path}?limit=${limit}`, {
      authenticated,
      ...(signal ? { signal } : {}),
    });
    return toFeedPage(dto);
  }
}

export default HttpFeedRepository;
