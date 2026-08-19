import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS } from '../../../theme';
import { threadFor } from './mockThreads';

const Bubble = ({ message }) => {
  const mine = message.mine;
  return (
    <View style={[styles.bubble, mine ? styles.bubbleOut : styles.bubbleIn]}>
      <Text style={mine ? styles.textOut : styles.textIn}>{message.text}</Text>
      <Text style={[styles.time, mine ? styles.timeOut : styles.timeIn]}>{message.time}</Text>
    </View>
  );
};

/**
 * One conversation. The chat to open arrives as route params from whatever
 * opened it, so the same screen serves the chat list and (later) a profile.
 * History is local mock data while messaging is not wired to the API.
 */
const DM = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const listRef = useRef(null);

  const { chatId, name = 'Chat', status = 'Offline' } = route.params ?? {};
  const [messages, setMessages] = useState(() => threadFor(chatId));
  const [draft, setDraft] = useState('');

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    // Appended locally only — there is no backend to deliver it yet.
    setMessages(current => [...current, { id: `local_${current.length + 1}`, mine: true, text, time }]);
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [draft]);

  const renderItem = useCallback(({ item }) => <Bubble message={item} />, []);
  const keyExtractor = useCallback(item => item.id, []);

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
            onSubmitEditing={send}
          />
          <Pressable style={styles.sendBtn} onPress={send} hitSlop={6}>
            <Ionicons name="send" size={19} color={COLORS.black} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default DM;
