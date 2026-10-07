import { createConversation } from '../../domain/entities/Conversation';
import { createMessage } from '../../domain/entities/Message';

export const toConversationList = (dto = {}, viewerId = null) => {
  const rows = Array.isArray(dto) ? dto : (dto.data ?? dto.items ?? []);
  return rows.map(row =>
    createConversation({
      ...row,
      peer: row.peer ?? null,
      participantIds: row.participantIds ?? [],
      lastMessage: row.lastMessage
        ? { ...row.lastMessage, mine: Boolean(viewerId) && row.lastMessage.senderId === viewerId }
        : null,
    }),
  );
};

export const toMessageList = (dto = {}, viewerId = null) => {
  const rows = Array.isArray(dto) ? dto : (dto.data ?? dto.items ?? []);
  return rows.map(row => createMessage(row, viewerId));
};

export const toMessage = (dto, viewerId = null) => createMessage(dto, viewerId);
