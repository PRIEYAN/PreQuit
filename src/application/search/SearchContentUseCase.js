export class SearchContentUseCase {
  constructor(searchRepository) {
    this.searchRepository = searchRepository;
  }

  execute(query, options) {
    const trimmed = query.trim();
    if (!trimmed) return Promise.resolve({ interpretation: null, posts: [], people: [], topics: [] });
    return this.searchRepository.search(trimmed, options);
  }
}

export default SearchContentUseCase;
