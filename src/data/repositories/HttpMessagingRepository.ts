import type { Conversation } from '../../domain/entities/Conversation';
import type { Message, MessagePayload } from '../../domain/entities/Message';
import type {
  MessagingRepository,
  OutgoingMessage,
  ViewerScopedOptions,
} from '../../domain/repositories/MessagingRepository';
import type { HttpClient } from '../http/HttpClient';
import { toConversationList, toMessage, toMessageList } from '../mappers/MessagingMapper';

export class HttpMessagingRepository implements MessagingRepository {
  constructor(private readonly http: HttpClient) {}

  async conversations(options: ViewerScopedOptions = {}): Promise<readonly Conversation[]> {
    const { limit = 20, viewerId = null, signal } = options;
    const dto = await this.http.get<Parameters<typeof toConversationList>[0]>(
      `/conversations?limit=${limit}`,
      signal ? { signal } : {},
    );
    return toConversationList(dto, viewerId);
  }

  async openConversation(peerId: string): Promise<string | null> {
    const data = await this.http.post<{ id?: string }>('/conversations', { userId: peerId });
    return data?.id ?? null;
  }

  async messages(
    conversationId: string,
    options: ViewerScopedOptions = {},
  ): Promise<readonly Message[]> {
    const { limit = 50, viewerId = null, signal } = options;
    const dto = await this.http.get<Parameters<typeof toMessageList>[0]>(
      `/conversations/${conversationId}/messages?limit=${limit}`,
      signal ? { signal } : {},
    );
    return toMessageList(dto, viewerId);
  }

  async sendMessage(conversationId: string, message: OutgoingMessage): Promise<Message> {
    const { body, clientNonce, viewerId = null } = message;
    const dto = await this.http.post<MessagePayload>(
      `/conversations/${conversationId}/messages`,
      { body, clientNonce },
    );
    return toMessage(dto, viewerId);
  }

  markRead(conversationId: string): Promise<unknown> {
    return this.http.post(`/conversations/${conversationId}/read`, {});
  }
}

export default HttpMessagingRepository;
