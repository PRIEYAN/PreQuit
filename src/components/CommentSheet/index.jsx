import React, { useCallback } from 'react';
import { View, Text, Modal, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS } from '../../theme';

const CommentRow = ({ comment }) => {
  const initial = (comment.author.displayName || comment.author.handle || '?')
    .charAt(0)
    .toUpperCase();
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={styles.handle}>@{comment.author.handle}</Text>
          <Text style={styles.time}>{comment.time}</Text>
        </View>
        <Text style={styles.text}>{comment.body}</Text>
        <View style={styles.actions}>
          <Ionicons name="heart-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.likes}>{comment.likes}</Text>
        </View>
      </View>
    </View>
  );
};

const CommentSheet = ({ post, comments, onClose }) => {
  const insets = useSafeAreaInsets();
  const renderItem = useCallback(({ item }) => <CommentRow comment={item} />, []);
  const keyExtractor = useCallback(item => item.id, []);

  return (
    <Modal
      visible={Boolean(post)}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={COLORS.white} />
            </Pressable>
          </View>

          <FlatList
            data={comments}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubble-outline" size={32} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No comments yet</Text>
              </View>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CommentSheet;
