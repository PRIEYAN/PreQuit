import { SearchRepository } from '../../domain/repositories/SearchRepository';
import { toSearchResults, toTopicList } from '../mappers/SearchMapper';

export class HttpSearchRepository extends SearchRepository {
  constructor(http) {
    super();
    this.http = http;
  }

  async search(query, { limit = 20, signal } = {}) {
    const path = `/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    return toSearchResults(await this.http.get(path, { authenticated: true, signal }));
  }

  async trendingTopics({ limit = 20, signal } = {}) {
    const data = await this.http.get(`/search/trending?limit=${limit}`, { authenticated: false, signal });
    return toTopicList(data);
  }
}

export default HttpSearchRepository;
