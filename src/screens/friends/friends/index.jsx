import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import styles from './styles';

// Sample chats. Swap for real conversations from the API later.
const CHATS = [
  { id: '1', name: 'Nova', message: 'See you at the launch 🚀', time: '09:42', unread: 2 },
  { id: '2', name: 'Kairo', message: 'Sent the mockups over', time: '08:15', unread: 0 },
  { id: '3', name: 'Lumen', message: 'Typing...', time: 'Yesterday', unread: 5 },
  { id: '4', name: 'Echo', message: 'You: got it, thanks!', time: 'Yesterday', unread: 0 },
  { id: '5', name: 'Vex', message: 'Voice message (0:12)', time: 'Tuesday', unread: 0 },
  { id: '6', name: 'Aria', message: 'Are we still on for tonight?', time: 'Monday', unread: 1 },
  { id: '7', name: 'Zephyr', message: 'Haha that was wild 😄', time: 'Monday', unread: 0 },
];

const Separator = () => <View style={styles.separator} />;

const ChatRow = ({ chat }) => {
  const unread = chat.unread > 0;
  return (
    <Pressable style={styles.row} android_ripple={{ color: COLORS.glass }}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{chat.name.charAt(0)}</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.name} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={[styles.time, unread && styles.timeUnread]}>
            {chat.time}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[styles.message, unread && styles.messageUnread]}
            numberOfLines={1}>
            {chat.message}
          </Text>
          {unread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{chat.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const Friends = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const data = CHATS.filter(c =>
    c.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ChatRow chat={item} />}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_SPACE }}
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
      />
    </View>
  );
};

export default Friends;
