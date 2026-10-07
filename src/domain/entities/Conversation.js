export const createConversation = (raw = {}) => ({
  id: raw.id ?? '',
  participantIds: Array.isArray(raw.participantIds) ? raw.participantIds : [],
  peer: raw.peer ?? null,
  lastMessage: raw.lastMessage ?? null,
  unreadCount: raw.unreadCount ?? 0,
  state: raw.state ?? 'open',
  createdAt: raw.createdAt ?? null,
});

export const peerIdOf = (conversation, viewerId) =>
  conversation.participantIds.find(id => id !== viewerId) ?? null;
