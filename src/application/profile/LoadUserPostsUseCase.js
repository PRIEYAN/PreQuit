export class LoadUserPostsUseCase {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  execute(userId, options) {
    return this.profileRepository.postsOf(userId, options);
  }
}

export default LoadUserPostsUseCase;
