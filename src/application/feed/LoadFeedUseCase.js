export class LoadFeedUseCase {
  constructor(feedRepository) {
    this.feedRepository = feedRepository;
  }

  execute(surface, options) {
    return this.feedRepository.load(surface, options);
  }
}

export default LoadFeedUseCase;
