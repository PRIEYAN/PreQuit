import type { Message } from '../../domain/entities/Message';
import type {
  MessagingRepository,
  OutgoingMessage,
} from '../../domain/repositories/MessagingRepository';

export class SendMessageUseCase {
  constructor(private readonly messagingRepository: MessagingRepository) {}

  execute(conversationId: string, message: OutgoingMessage): Promise<Message | null> {
    const body = message.body.trim();
    if (!body) return Promise.resolve(null);
    return this.messagingRepository.sendMessage(conversationId, { ...message, body });
  }
}

export default SendMessageUseCase;
