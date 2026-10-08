import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS } from '../../../theme';
import ROUTES from '../../../navigation/routes';
import { useAppNavigation, useAppRoute } from '../../../navigation/hooks';
import { useConversation } from '../../../hooks/useConversation';
import { useUseCases } from '../../../container/DependencyProvider';
import { MessageDelivery, type Message } from '../../../../domain/entities/Message';

const timeOf = (value: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
};

interface BubbleProps {
  readonly message: Message;
}

const Bubble = ({ message }: BubbleProps) => {
  const mine = message.mine;
  const failed = message.delivery === MessageDelivery.FAILED;
  const pending = message.delivery === MessageDelivery.PENDING;

  return (
    <View style={[styles.bubble, mine ? styles.bubbleOut : styles.bubbleIn]}>
      <Text style={mine ? styles.textOut : styles.textIn}>{message.body}</Text>
      <Text style={[styles.time, mine ? styles.timeOut : styles.timeIn]}>
        {failed ? 'Not delivered' : pending ? 'Sending…' : timeOf(message.createdAt)}
      </Text>
    </View>
  );
};

const DM = () => {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const route = useAppRoute<typeof ROUTES.DM>();
  const useCases = useUseCases();
  const listRef = useRef<FlatList<Message>>(null);

  const {
    conversationId: routeConversationId,
    peerId,
    name = 'Chat',
    status = 'Offline',
  } = route.params ?? {};
  const [conversationId, setConversationId] = useState<string | null>(routeConversationId ?? null);
  const [draft, setDraft] = useState('');
  const { messages, isLoading, send } = useConversation(conversationId);

  useEffect(() => {
    if (conversationId || !peerId) return;
    let cancelled = false;

    useCases.openConversation
      .execute(peerId)
      .then(opened => {
        if (!cancelled && opened) setConversationId(opened);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [conversationId, peerId, useCases]);

  const submit = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    await send(body);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [draft, send]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Message>) => <Bubble message={item} />,
    [],
  );
  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.headerName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.headerStatus}>{status}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 8}>
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.empty}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            ) : null
          }
        />

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.inputField}
            placeholder="Message"
            placeholderTextColor={COLORS.placeholder}
            value={draft}
            onChangeText={setDraft}
            multiline
            returnKeyType="send"
            onSubmitEditing={submit}
          />
          <Pressable style={styles.sendBtn} onPress={submit} hitSlop={6}>
            <Ionicons name="send" size={19} color={COLORS.black} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default DM;
