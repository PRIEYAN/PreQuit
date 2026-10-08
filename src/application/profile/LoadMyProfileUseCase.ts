import type { User } from '../../domain/entities/User';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import type { RequestOptions } from '../../domain/repositories/common';

export class LoadMyProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  execute(options?: RequestOptions): Promise<User> {
    return this.profileRepository.myProfile(options);
  }
}

export default LoadMyProfileUseCase;
