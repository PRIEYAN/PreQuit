import type { Topic } from '../../domain/entities/Topic';
import type {
  SearchRepository,
  SearchResults,
} from '../../domain/repositories/SearchRepository';
import type { PageOptions } from '../../domain/repositories/common';
import type { HttpClient } from '../http/HttpClient';
import { toSearchResults, toTopicList } from '../mappers/SearchMapper';

export class HttpSearchRepository implements SearchRepository {
  constructor(private readonly http: HttpClient) {}

  async search(query: string, options: PageOptions = {}): Promise<SearchResults> {
    const { limit = 20, signal } = options;
    const path = `/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const dto = await this.http.get<Parameters<typeof toSearchResults>[0]>(path, {
      authenticated: true,
      ...(signal ? { signal } : {}),
    });
    return toSearchResults(dto);
  }

  async trendingTopics(options: PageOptions = {}): Promise<readonly Topic[]> {
    const { limit = 20, signal } = options;
    const dto = await this.http.get<Parameters<typeof toTopicList>[0]>(
      `/search/trending?limit=${limit}`,
      { authenticated: false, ...(signal ? { signal } : {}) },
    );
    return toTopicList(dto);
  }
}

export default HttpSearchRepository;
