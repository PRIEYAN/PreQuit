import type {
  SearchRepository,
  SearchResults,
} from '../../domain/repositories/SearchRepository';
import type { PageOptions } from '../../domain/repositories/common';

const EMPTY: SearchResults = { interpretation: null, posts: [], people: [], topics: [] };

export class SearchContentUseCase {
  constructor(private readonly searchRepository: SearchRepository) {}

  execute(query: string, options?: PageOptions): Promise<SearchResults> {
    const trimmed = query.trim();
    if (!trimmed) return Promise.resolve(EMPTY);
    return this.searchRepository.search(trimmed, options);
  }
}

export default SearchContentUseCase;
