import { createConversation, type Conversation } from '../../../domain/entities/Conversation';
import { createMessage, MessageDelivery, type Message } from '../../../domain/entities/Message';
import type {
  MessagingRepository,
  OutgoingMessage,
} from '../../../domain/repositories/MessagingRepository';
import { threadFor } from './dataset/threads';

interface SeedConversation {
  readonly id: string;
  readonly name: string;
  readonly handle: string;
  readonly unreadCount: number;
  readonly time: string;
}

const CONVERSATIONS: readonly SeedConversation[] = [
  { id: '1', name: 'Nova', handle: 'nova', unreadCount: 2, time: '09:42' },
  { id: '2', name: 'Kairo', handle: 'kairo', unreadCount: 0, time: '08:15' },
  { id: '3', name: 'Lumen', handle: 'lumen', unreadCount: 5, time: 'Yesterday' },
  { id: '4', name: 'Echo', handle: 'echo', unreadCount: 0, time: 'Yesterday' },
  { id: '5', name: 'Vex', handle: 'vex', unreadCount: 0, time: 'Tuesday' },
  { id: '6', name: 'Aria', handle: 'aria', unreadCount: 1, time: 'Monday' },
  { id: '7', name: 'Zephyr', handle: 'zephyr', unreadCount: 0, time: 'Monday' },
];

const VIEWER = 'me';

export class SeedMessagingRepository implements MessagingRepository {
  async conversations(): Promise<readonly Conversation[]> {
    return CONVERSATIONS.map(entry => {
      const thread = threadFor(entry.id);
      const last = thread.length > 0 ? thread[thread.length - 1] : undefined;
      return createConversation({
        id: entry.id,
        participantIds: [VIEWER, entry.id],
        peer: { id: entry.id, handle: entry.handle, displayName: entry.name, avatarUrl: null },
        unreadCount: entry.unreadCount,
        lastMessage: last
          ? { body: last.text, mine: last.mine, createdAt: entry.time }
          : null,
        createdAt: entry.time,
      });
    });
  }

  async openConversation(peerId: string): Promise<string> {
    return peerId;
  }

  async messages(conversationId: string): Promise<readonly Message[]> {
    return threadFor(conversationId).map(raw =>
      createMessage(
        {
          id: raw.id,
          conversationId,
          senderId: raw.mine ? VIEWER : conversationId,
          body: raw.text,
          createdAt: raw.time,
          delivery: MessageDelivery.SENT,
        },
        VIEWER,
      ),
    );
  }

  async sendMessage(conversationId: string, message: OutgoingMessage): Promise<Message> {
    return createMessage(
      {
        id: message.clientNonce,
        conversationId,
        senderId: VIEWER,
        body: message.body,
        createdAt: new Date().toISOString(),
        delivery: MessageDelivery.SENT,
      },
      VIEWER,
    );
  }

  async markRead(): Promise<void> {}
}

export default SeedMessagingRepository;
