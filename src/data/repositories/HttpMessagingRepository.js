import { MessagingRepository } from '../../domain/repositories/MessagingRepository';
import { toConversationList, toMessage, toMessageList } from '../mappers/MessagingMapper';

export class HttpMessagingRepository extends MessagingRepository {
  constructor(http) {
    super();
    this.http = http;
  }

  async conversations({ limit = 20, viewerId = null, signal } = {}) {
    const data = await this.http.get(`/conversations?limit=${limit}`, { signal });
    return toConversationList(data, viewerId);
  }

  async openConversation(peerId) {
    const data = await this.http.post('/conversations', { userId: peerId });
    return data?.id ?? null;
  }

  async messages(conversationId, { limit = 50, viewerId = null, signal } = {}) {
    const data = await this.http.get(`/conversations/${conversationId}/messages?limit=${limit}`, { signal });
    return toMessageList(data, viewerId);
  }

  async sendMessage(conversationId, { body, clientNonce, viewerId = null }) {
    const data = await this.http.post(`/conversations/${conversationId}/messages`, { body, clientNonce });
    return toMessage(data, viewerId);
  }

  markRead(conversationId) {
    return this.http.post(`/conversations/${conversationId}/read`, {});
  }
}

export default HttpMessagingRepository;
