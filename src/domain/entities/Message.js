export const MessageDelivery = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
};

export const createMessage = (raw = {}, viewerId = null) => ({
  id: raw.id ?? '',
  conversationId: raw.conversationId ?? '',
  senderId: raw.senderId ?? '',
  mine: Boolean(viewerId) && raw.senderId === viewerId,
  kind: raw.kind ?? 'text',
  body: raw.body ?? '',
  media: raw.media ?? null,
  replyToId: raw.replyToId ?? null,
  delivery: raw.delivery ?? MessageDelivery.SENT,
  createdAt: raw.createdAt ?? null,
});

export const createPendingMessage = ({ clientNonce, conversationId, senderId, body, createdAt }) => ({
  id: clientNonce,
  conversationId,
  senderId,
  mine: true,
  kind: 'text',
  body,
  media: null,
  replyToId: null,
  delivery: MessageDelivery.PENDING,
  createdAt,
  clientNonce,
});
