import { FeedRepository, FeedSurface } from '../../domain/repositories/FeedRepository';
import { toFeedPage } from '../mappers/PostMapper';

const PATHS = {
  [FeedSurface.HOME]: '/feed/home',
  [FeedSurface.EXPLORE]: '/feed/explore',
  [FeedSurface.TRENDING]: '/feed/trending',
};

export class HttpFeedRepository extends FeedRepository {
  constructor(http) {
    super();
    this.http = http;
  }

  async load(surface = FeedSurface.HOME, { limit = 20, signal } = {}) {
    const path = PATHS[surface] ?? PATHS[FeedSurface.HOME];
    const authenticated = surface === FeedSurface.HOME;
    return toFeedPage(await this.http.get(`${path}?limit=${limit}`, { authenticated, signal }));
  }
}

export default HttpFeedRepository;
