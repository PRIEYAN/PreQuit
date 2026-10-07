import { abstractMethod } from './Repository';

export class SearchRepository {
  search() {
    return abstractMethod('SearchRepository.search');
  }

  trendingTopics() {
    return abstractMethod('SearchRepository.trendingTopics');
  }
}
