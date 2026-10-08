export const MessageDelivery = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type MessageDeliveryState = (typeof MessageDelivery)[keyof typeof MessageDelivery];

export type MessageKind = 'text' | 'image' | 'post_share';

export interface MessageMedia {
  readonly mediaId: string;
  readonly url?: string;
}

export interface MessageReaction {
  readonly userId: string;
  readonly emoji: string;
}

export interface Message {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly mine: boolean;
  readonly kind: MessageKind;
  readonly body: string;
  readonly media: MessageMedia | null;
  readonly replyToId: string | null;
  readonly reactions: readonly MessageReaction[];
  readonly delivery: MessageDeliveryState;
  readonly createdAt: string | null;
  readonly clientNonce?: string;
}

export type MessagePayload = Partial<Omit<Message, 'mine'>>;

export const createMessage = (raw: MessagePayload = {}, viewerId: string | null = null): Message => ({
  id: raw.id ?? '',
  conversationId: raw.conversationId ?? '',
  senderId: raw.senderId ?? '',
  mine: Boolean(viewerId) && raw.senderId === viewerId,
  kind: raw.kind ?? 'text',
  body: raw.body ?? '',
  media: raw.media ?? null,
  replyToId: raw.replyToId ?? null,
  reactions: raw.reactions ?? [],
  delivery: raw.delivery ?? MessageDelivery.SENT,
  createdAt: raw.createdAt ?? null,
});

export interface PendingMessageInput {
  readonly clientNonce: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly body: string;
  readonly createdAt: string;
}

export const createPendingMessage = (input: PendingMessageInput): Message => ({
  id: input.clientNonce,
  conversationId: input.conversationId,
  senderId: input.senderId,
  mine: true,
  kind: 'text',
  body: input.body,
  media: null,
  replyToId: null,
  reactions: [],
  delivery: MessageDelivery.PENDING,
  createdAt: input.createdAt,
  clientNonce: input.clientNonce,
});
