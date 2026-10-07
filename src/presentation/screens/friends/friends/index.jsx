import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import ROUTES from '../../../navigation/routes';
import styles from './styles';
import { useConversations } from '../../../hooks/useConversations';

const Separator = () => <View style={styles.separator} />;

const nameOf = conversation => conversation.peer?.displayName || conversation.peer?.handle || 'Conversation';

const ConversationRow = ({ conversation, onPress }) => {
  const unread = conversation.unreadCount > 0;
  const name = nameOf(conversation);
  const preview = conversation.lastMessage?.body ?? 'No messages yet';
  const time = conversation.lastMessage?.createdAt ?? '';

  return (
    <Pressable style={styles.row} android_ripple={{ color: COLORS.glass }} onPress={() => onPress(conversation)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.time, unread && styles.timeUnread]}>{time}</Text>
        </View>
        <View style={styles.rowBottom}>
          <Text style={[styles.message, unread && styles.messageUnread]} numberOfLines={1}>
            {conversation.lastMessage?.mine ? `You: ${preview}` : preview}
          </Text>
          {unread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const Friends = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const { conversations, isLoading, isRefreshing, error, refresh } = useConversations();

  const openConversation = useCallback(
    conversation =>
      navigation.navigate(ROUTES.DM, {
        conversationId: conversation.id,
        peerId: conversation.peer?.id ?? null,
        name: nameOf(conversation),
        status: conversation.unreadCount > 0 ? 'Online' : 'Last seen recently',
      }),
    [navigation],
  );

  const data = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter(conversation => nameOf(conversation).toLowerCase().includes(needle));
  }, [conversations, query]);

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ConversationRow conversation={item} onPress={openConversation} />}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_SPACE }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={COLORS.white} />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 12 }}>
            <Text style={styles.header}>Chats</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={COLORS.placeholder} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search chats"
                placeholderTextColor={COLORS.placeholder}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={COLORS.white} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={34} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>
                {error ? error.message : 'Follow someone back to start a conversation'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default Friends;
