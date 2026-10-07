export class SendMessageUseCase {
  constructor(messagingRepository) {
    this.messagingRepository = messagingRepository;
  }

  execute(conversationId, { body, clientNonce, viewerId }) {
    const trimmed = body.trim();
    if (!trimmed) return Promise.resolve(null);
    return this.messagingRepository.sendMessage(conversationId, { body: trimmed, clientNonce, viewerId });
  }
}

export default SendMessageUseCase;
