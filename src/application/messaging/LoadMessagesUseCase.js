export class LoadMessagesUseCase {
  constructor(messagingRepository) {
    this.messagingRepository = messagingRepository;
  }

  execute(conversationId, options) {
    return this.messagingRepository.messages(conversationId, options);
  }
}

export default LoadMessagesUseCase;
