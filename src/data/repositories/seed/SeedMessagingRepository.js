import { MessagingRepository } from '../../../domain/repositories/MessagingRepository';
import { createConversation } from '../../../domain/entities/Conversation';
import { createMessage, MessageDelivery } from '../../../domain/entities/Message';
import { threadFor } from './dataset/threads';

const CONVERSATIONS = [
  { id: '1', name: 'Nova', handle: 'nova', unreadCount: 2, time: '09:42' },
  { id: '2', name: 'Kairo', handle: 'kairo', unreadCount: 0, time: '08:15' },
  { id: '3', name: 'Lumen', handle: 'lumen', unreadCount: 5, time: 'Yesterday' },
  { id: '4', name: 'Echo', handle: 'echo', unreadCount: 0, time: 'Yesterday' },
  { id: '5', name: 'Vex', handle: 'vex', unreadCount: 0, time: 'Tuesday' },
  { id: '6', name: 'Aria', handle: 'aria', unreadCount: 1, time: 'Monday' },
  { id: '7', name: 'Zephyr', handle: 'zephyr', unreadCount: 0, time: 'Monday' },
];

const lastOf = conversationId => {
  const thread = threadFor(conversationId);
  return thread.length > 0 ? thread[thread.length - 1] : null;
};

export class SeedMessagingRepository extends MessagingRepository {
  async conversations() {
    return CONVERSATIONS.map(entry => {
      const last = lastOf(entry.id);
      return createConversation({
        id: entry.id,
        participantIds: ['me', entry.id],
        peer: { id: entry.id, handle: entry.handle, displayName: entry.name, avatarUrl: null },
        unreadCount: entry.unreadCount,
        lastMessage: last ? { body: last.text, mine: Boolean(last.mine), createdAt: entry.time } : null,
        createdAt: entry.time,
      });
    });
  }

  async openConversation(peerId) {
    return peerId;
  }

  async messages(conversationId) {
    return threadFor(conversationId).map(raw =>
      createMessage({
        id: raw.id,
        conversationId,
        senderId: raw.mine ? 'me' : conversationId,
        body: raw.text,
        createdAt: raw.time,
        delivery: MessageDelivery.SENT,
      }, 'me'),
    );
  }

  async sendMessage(conversationId, { body, clientNonce }) {
    return createMessage({
      id: clientNonce,
      conversationId,
      senderId: 'me',
      body,
      createdAt: new Date().toISOString(),
      delivery: MessageDelivery.SENT,
    }, 'me');
  }

  async markRead() {}
}

export default SeedMessagingRepository;
