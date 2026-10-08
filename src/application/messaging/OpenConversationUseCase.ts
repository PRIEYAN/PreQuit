import type { MessagingRepository } from '../../domain/repositories/MessagingRepository';

export class OpenConversationUseCase {
  constructor(private readonly messagingRepository: MessagingRepository) {}

  execute(peerId: string): Promise<string | null> {
    return this.messagingRepository.openConversation(peerId);
  }
}

export default OpenConversationUseCase;
