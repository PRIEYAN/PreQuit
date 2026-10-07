export class OpenConversationUseCase {
  constructor(messagingRepository) {
    this.messagingRepository = messagingRepository;
  }

  execute(peerId) {
    return this.messagingRepository.openConversation(peerId);
  }
}

export default OpenConversationUseCase;
