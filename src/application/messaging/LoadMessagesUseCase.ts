import type { Message } from '../../domain/entities/Message';
import type {
  MessagingRepository,
  ViewerScopedOptions,
} from '../../domain/repositories/MessagingRepository';

export class LoadMessagesUseCase {
  constructor(private readonly messagingRepository: MessagingRepository) {}

  execute(conversationId: string, options?: ViewerScopedOptions): Promise<readonly Message[]> {
    return this.messagingRepository.messages(conversationId, options);
  }
}

export default LoadMessagesUseCase;
