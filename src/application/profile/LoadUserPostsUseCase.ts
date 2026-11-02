import type { Post } from '../../domain/entities/Post';
import type {
  ProfilePostsOptions,
  ProfileRepository,
} from '../../domain/repositories/ProfileRepository';

export class LoadUserPostsUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  execute(userId: string, options?: ProfilePostsOptions): Promise<readonly Post[]> {
    return this.profileRepository.postsOf(userId, options);
  }
}

export default LoadUserPostsUseCase;
