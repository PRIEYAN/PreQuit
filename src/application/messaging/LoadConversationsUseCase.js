export class LoadConversationsUseCase {
  constructor(messagingRepository) {
    this.messagingRepository = messagingRepository;
  }

  execute(options) {
    return this.messagingRepository.conversations(options);
  }
}

export default LoadConversationsUseCase;
