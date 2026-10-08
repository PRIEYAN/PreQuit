import type { Post } from '../../domain/entities/Post';
import type {
  FeedRepository,
  FeedSurfaceValue,
} from '../../domain/repositories/FeedRepository';
import type { Page, PageOptions } from '../../domain/repositories/common';

export class LoadFeedUseCase {
  constructor(private readonly feedRepository: FeedRepository) {}

  execute(surface?: FeedSurfaceValue, options?: PageOptions): Promise<Page<Post>> {
    return this.feedRepository.load(surface, options);
  }
}

export default LoadFeedUseCase;
