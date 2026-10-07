export class LoadTrendingTopicsUseCase {
  constructor(searchRepository) {
    this.searchRepository = searchRepository;
  }

  execute(options) {
    return this.searchRepository.trendingTopics(options);
  }
}

export default LoadTrendingTopicsUseCase;
