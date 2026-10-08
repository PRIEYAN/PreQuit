import { createPost, type Post } from '../../../domain/entities/Post';
import {
  FeedSurface,
  type FeedRepository,
  type FeedSurfaceValue,
} from '../../../domain/repositories/FeedRepository';
import type { Page, PageOptions } from '../../../domain/repositories/common';
import { MOCK_POSTS, type SeedPost } from './dataset/posts';

type Arrange = (posts: readonly SeedPost[]) => readonly SeedPost[];

const ORDER: Readonly<Record<FeedSurfaceValue, Arrange>> = {
  [FeedSurface.HOME]: posts => posts,
  [FeedSurface.EXPLORE]: posts => [...posts].reverse(),
  [FeedSurface.TRENDING]: posts =>
    [...posts].sort((a, b) => (b.counts?.likes ?? 0) - (a.counts?.likes ?? 0)),
};

export class SeedFeedRepository implements FeedRepository {
  async load(
    surface: FeedSurfaceValue = FeedSurface.HOME,
    options: PageOptions = {},
  ): Promise<Page<Post>> {
    const arrange = ORDER[surface] ?? ORDER[FeedSurface.HOME];
    const items = arrange(MOCK_POSTS)
      .slice(0, options.limit ?? 20)
      .map(entry => createPost(entry));
    return { items, nextCursor: null };
  }
}

export default SeedFeedRepository;
