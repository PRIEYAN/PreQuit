import type { Conversation } from '../entities/Conversation';
import type { Message } from '../entities/Message';
import type { PageOptions } from './common';

export interface ViewerScopedOptions extends PageOptions {
  readonly viewerId?: string | null;
}

export interface OutgoingMessage {
  readonly body: string;
  readonly clientNonce: string;
  readonly viewerId?: string | null;
}

export interface MessagingRepository {
  conversations(options?: ViewerScopedOptions): Promise<readonly Conversation[]>;
  openConversation(peerId: string): Promise<string | null>;
  messages(conversationId: string, options?: ViewerScopedOptions): Promise<readonly Message[]>;
  sendMessage(conversationId: string, message: OutgoingMessage): Promise<Message>;
  markRead(conversationId: string): Promise<unknown>;
}
