import type { PostAuthor } from './Post';

export interface ConversationPreview {
  readonly body: string;
  readonly mine: boolean;
  readonly createdAt: string | null;
}

export type ConversationState = 'open' | 'closed' | 'hidden';

export interface Conversation {
  readonly id: string;
  readonly participantIds: readonly string[];
  readonly peer: PostAuthor | null;
  readonly lastMessage: ConversationPreview | null;
  readonly unreadCount: number;
  readonly state: ConversationState;
  readonly createdAt: string | null;
}

export type ConversationPayload = Partial<Conversation>;

export const createConversation = (raw: ConversationPayload = {}): Conversation => ({
  id: raw.id ?? '',
  participantIds: raw.participantIds ?? [],
  peer: raw.peer ?? null,
  lastMessage: raw.lastMessage ?? null,
  unreadCount: raw.unreadCount ?? 0,
  state: raw.state ?? 'open',
  createdAt: raw.createdAt ?? null,
});

export const peerIdOf = (conversation: Conversation, viewerId: string | null): string | null =>
  conversation.participantIds.find(id => id !== viewerId) ?? null;
