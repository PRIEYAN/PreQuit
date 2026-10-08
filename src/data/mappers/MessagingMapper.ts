import {
  createConversation,
  type Conversation,
  type ConversationPayload,
} from '../../domain/entities/Conversation';
import { createMessage, type Message, type MessagePayload } from '../../domain/entities/Message';
import { rowsOf, type ListLike } from './rows';

export interface ConversationDto extends Omit<ConversationPayload, 'lastMessage'> {
  readonly lastMessage?: {
    readonly body?: string;
    readonly senderId?: string;
    readonly createdAt?: string | null;
  } | null;
}

export const toConversationList = (
  dto: ListLike<ConversationDto>,
  viewerId: string | null = null,
): Conversation[] =>
  rowsOf(dto).map(row =>
    createConversation({
      ...row,
      peer: row.peer ?? null,
      participantIds: row.participantIds ?? [],
      lastMessage: row.lastMessage
        ? {
            body: row.lastMessage.body ?? '',
            mine: Boolean(viewerId) && row.lastMessage.senderId === viewerId,
            createdAt: row.lastMessage.createdAt ?? null,
          }
        : null,
    }),
  );

export const toMessageList = (
  dto: ListLike<MessagePayload>,
  viewerId: string | null = null,
): Message[] => rowsOf(dto).map(row => createMessage(row, viewerId));

export const toMessage = (dto: MessagePayload | null, viewerId: string | null = null): Message =>
  createMessage(dto ?? {}, viewerId);
