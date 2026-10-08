import type { Topic } from '../../domain/entities/Topic';
import type { SearchRepository } from '../../domain/repositories/SearchRepository';
import type { PageOptions } from '../../domain/repositories/common';

export class LoadTrendingTopicsUseCase {
  constructor(private readonly searchRepository: SearchRepository) {}

  execute(options?: PageOptions): Promise<readonly Topic[]> {
    return this.searchRepository.trendingTopics(options);
  }
}

export default LoadTrendingTopicsUseCase;
