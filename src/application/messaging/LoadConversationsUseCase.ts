import type { Conversation } from '../../domain/entities/Conversation';
import type {
  MessagingRepository,
  ViewerScopedOptions,
} from '../../domain/repositories/MessagingRepository';

export class LoadConversationsUseCase {
  constructor(private readonly messagingRepository: MessagingRepository) {}

  execute(options?: ViewerScopedOptions): Promise<readonly Conversation[]> {
    return this.messagingRepository.conversations(options);
  }
}

export default LoadConversationsUseCase;
