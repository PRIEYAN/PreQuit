import type { PrivacySettings } from '../../domain/entities/User';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';

export class UpdatePrivacySettingsUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  execute(patch: Partial<PrivacySettings>): Promise<unknown> {
    return this.profileRepository.updatePrivacy(patch);
  }
}

export default UpdatePrivacySettingsUseCase;
