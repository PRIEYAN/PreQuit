import type { User } from '../../domain/entities/User';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';

export class LoadUserProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  execute(handle: string): Promise<User> {
    return this.profileRepository.byHandle(handle);
  }
}

export default LoadUserProfileUseCase;
