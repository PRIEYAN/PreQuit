import type { Post } from '../../domain/entities/Post';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import type { PageOptions } from '../../domain/repositories/common';

export class LoadUserPostsUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  execute(userId: string, options?: PageOptions): Promise<readonly Post[]> {
    return this.profileRepository.postsOf(userId, options);
  }
}

export default LoadUserPostsUseCase;
