import { FeedRepository, FeedSurface } from '../../../domain/repositories/FeedRepository';
import { createPost } from '../../../domain/entities/Post';
import { MOCK_POSTS } from './dataset/posts';

const order = {
  [FeedSurface.HOME]: posts => posts,
  [FeedSurface.EXPLORE]: posts => [...posts].reverse(),
  [FeedSurface.TRENDING]: posts => [...posts].sort((a, b) => b.counts.likes - a.counts.likes),
};

export class SeedFeedRepository extends FeedRepository {
  async load(surface = FeedSurface.HOME, { limit = 20 } = {}) {
    const arrange = order[surface] ?? order[FeedSurface.HOME];
    const items = arrange(MOCK_POSTS).slice(0, limit).map(createPost);
    return { items, nextCursor: null };
  }
}

export default SeedFeedRepository;
