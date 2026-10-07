export class LoadMyProfileUseCase {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  execute(options) {
    return this.profileRepository.myProfile(options);
  }
}

export default LoadMyProfileUseCase;
