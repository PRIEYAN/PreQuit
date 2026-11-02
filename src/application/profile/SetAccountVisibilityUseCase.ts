import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';

export class SetAccountVisibilityUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  execute(isPrivate: boolean): Promise<unknown> {
    return this.profileRepository.updateProfile({ isPrivate });
  }
}

export default SetAccountVisibilityUseCase;
