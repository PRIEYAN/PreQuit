import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import ROUTES from '../../../navigation/routes';
import PostCard from '../../../components/PostCard';
import { MOCK_POSTS } from './mockPosts';

const SURFACES = [
  { key: 'home', label: 'For You' },
  { key: 'explore', label: 'Explore' },
  { key: 'trending', label: 'Trending' },
];

/**
 * The post feed, shown under the Social tab. Runs on local mock data while the
 * app is not connected to the API; the surface tabs reorder the same posts so
 * each looks distinct, and once the backend is wired back in each maps to its
 * own ranked endpoint.
 */
const Feed = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [surface, setSurface] = useState('home');
  const [posts, setPosts] = useState(MOCK_POSTS);

  // Tapping an author opens the conversation with them. These mock authors
  // have no thread of their own yet, so the DM opens empty.
  const openAuthorChat = useCallback(
    author =>
      navigation.navigate(ROUTES.DM, {
        chatId: author.id,
        name: author.displayName,
        status: `@${author.handle}`,
      }),
    [navigation],
  );

  const visible = useMemo(() => {
    if (surface === 'trending') {
      return [...posts].sort((a, b) => b.counts.likes - a.counts.likes);
    }
    if (surface === 'explore') {
      return [...posts].reverse();
    }
    return posts;
  }, [posts, surface]);

  // Mirrors what the API-backed version does optimistically, minus the request.
  const toggle = useCallback((postId, field, countKey) => {
    setPosts(current =>
      current.map(item => {
        if (item.id !== postId) return item;
        const next = !item.viewer[field];
        return {
          ...item,
          viewer: { ...item.viewer, [field]: next },
          counts: {
            ...item.counts,
            [countKey]: Math.max(0, item.counts[countKey] + (next ? 1 : -1)),
          },
        };
      }),
    );
  }, []);

  const toggleLike = useCallback(postId => toggle(postId, 'hasLiked', 'likes'), [toggle]);
  const toggleSave = useCallback(postId => toggle(postId, 'hasSaved', 'saves'), [toggle]);

  const renderItem = useCallback(
    ({ item }) => (
      <PostCard
        post={item}
        onToggleLike={toggleLike}
        onToggleSave={toggleSave}
        onPressAuthor={openAuthorChat}
      />
    ),
    [toggleLike, toggleSave, openAuthorChat],
  );

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
      </View>

      <View style={styles.surfaces}>
        {SURFACES.map(item => {
          const active = item.key === surface;
          return (
            <Pressable
              key={item.key}
              style={[styles.surface, active && styles.surfaceActive]}
              onPress={() => setSurface(item.key)}>
              <Text style={[styles.surfaceText, active && styles.surfaceTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={visible}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="sparkles-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>Posts will appear here once the API is connected.</Text>
          </View>
        }
      />
    </View>
  );
};

export default Feed;
