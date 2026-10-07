import { abstractMethod } from './Repository';

export const FeedSurface = {
  HOME: 'home',
  EXPLORE: 'explore',
  TRENDING: 'trending',
};

export class FeedRepository {
  load() {
    return abstractMethod('FeedRepository.load');
  }
}
