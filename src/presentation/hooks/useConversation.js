import { useCallback, useRef, useState } from 'react';

import { useUseCases } from '../container/DependencyProvider';
import { useAsyncResource } from './useAsyncResource';
import { useSession } from './useSession';
import { createPendingMessage, MessageDelivery } from '../../domain/entities/Message';

let nonceCounter = 0;
const nextNonce = () => `local_${Date.now()}_${(nonceCounter += 1)}`;

export const useConversation = conversationId => {
  const useCases = useUseCases();
  const { viewerId } = useSession();
  const [messages, setMessages] = useState([]);
  const sending = useRef(new Set());

  const loader = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return [];
    }
    const loaded = await useCases.loadMessages.execute(conversationId, { viewerId });
    setMessages(loaded);
    return loaded;
  }, [useCases, conversationId, viewerId]);

  const resource = useAsyncResource(loader, {
    initialData: [],
    enabled: Boolean(conversationId),
    deps: [conversationId, viewerId],
  });

  const send = useCallback(
    async body => {
      const trimmed = body.trim();
      if (!trimmed || !conversationId) return;

      const clientNonce = nextNonce();
      const pending = createPendingMessage({
        clientNonce,
        conversationId,
        senderId: viewerId ?? 'me',
        body: trimmed,
        createdAt: new Date().toISOString(),
      });

      sending.current.add(clientNonce);
      setMessages(current => [...current, pending]);

      try {
        const confirmed = await useCases.sendMessage.execute(conversationId, {
          body: trimmed,
          clientNonce,
          viewerId,
        });
        setMessages(current =>
          current.map(message => (message.id === clientNonce ? { ...confirmed, mine: true } : message)),
        );
      } catch {
        setMessages(current =>
          current.map(message =>
            message.id === clientNonce ? { ...message, delivery: MessageDelivery.FAILED } : message,
          ),
        );
      } finally {
        sending.current.delete(clientNonce);
      }
    },
    [useCases, conversationId, viewerId],
  );

  return {
    messages,
    isLoading: resource.isLoading,
    error: resource.error,
    send,
    reload: resource.reload,
  };
};

export default useConversation;
