import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import ROUTES from '../../../navigation/routes';
import PostCard from '../../../components/PostCard';
import CommentSheet from '../../../components/CommentSheet';
import { MOCK_POSTS, PAGE_SIZE } from './mockPosts';
import { commentsFor } from './mockComments';

const SURFACES = [
  { key: 'home', label: 'For You' },
  { key: 'explore', label: 'Explore' },
  { key: 'trending', label: 'Trending' },
];

const LOAD_DELAY_MS = 600;

const Feed = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [surface, setSurface] = useState('home');
  const [overrides, setOverrides] = useState({});
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const timerRef = useRef(null);

  const ordered = useMemo(() => {
    if (surface === 'trending') {
      return [...MOCK_POSTS].sort((a, b) => b.counts.likes - a.counts.likes);
    }
    if (surface === 'explore') {
      return [...MOCK_POSTS].reverse();
    }
    return MOCK_POSTS;
  }, [surface]);

  useEffect(() => {
    setPage(1);
  }, [surface]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const visible = useMemo(() => {
    const slice = ordered.slice(0, page * PAGE_SIZE);
    return slice.map(item => {
      const patch = overrides[item.id];
      if (!patch) return item;
      return {
        ...item,
        viewer: { ...item.viewer, ...patch.viewer },
        counts: { ...item.counts, ...patch.counts },
      };
    });
  }, [ordered, page, overrides]);

  const hasMore = page * PAGE_SIZE < ordered.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    timerRef.current = setTimeout(() => {
      setPage(current => current + 1);
      setIsLoadingMore(false);
    }, LOAD_DELAY_MS);
  }, [isLoadingMore, hasMore]);

  const openAuthorChat = useCallback(
    author =>
      navigation.navigate(ROUTES.DM, {
        chatId: author.id,
        name: author.displayName,
        status: `@${author.handle}`,
      }),
    [navigation],
  );

  const toggle = useCallback(
    (postId, field, countKey) => {
      const base = ordered.find(item => item.id === postId);
      if (!base) return;
      setOverrides(current => {
        const patch = current[postId];
        const active = patch?.viewer?.[field] ?? base.viewer[field];
        const count = patch?.counts?.[countKey] ?? base.counts[countKey];
        const next = !active;
        return {
          ...current,
          [postId]: {
            viewer: { ...(patch?.viewer ?? {}), [field]: next },
            counts: {
              ...(patch?.counts ?? {}),
              [countKey]: Math.max(0, count + (next ? 1 : -1)),
            },
          },
        };
      });
    },
    [ordered],
  );

  const toggleLike = useCallback(postId => toggle(postId, 'hasLiked', 'likes'), [toggle]);
  const toggleSave = useCallback(postId => toggle(postId, 'hasSaved', 'saves'), [toggle]);
  const openComments = useCallback(post => setActivePost(post), []);
  const closeComments = useCallback(() => setActivePost(null), []);

  const renderItem = useCallback(
    ({ item }) => (
      <PostCard
        post={item}
        onToggleLike={toggleLike}
        onToggleSave={toggleSave}
        onPressAuthor={openAuthorChat}
        onPressComments={openComments}
      />
    ),
    [toggleLike, toggleSave, openAuthorChat, openComments],
  );

  const keyExtractor = useCallback(item => item.id, []);

  const footer = useMemo(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={COLORS.white} />
        </View>
      );
    }
    if (!hasMore && visible.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>You are all caught up</Text>
        </View>
      );
    }
    return <View style={styles.footerSpacer} />;
  }, [isLoadingMore, hasMore, visible.length]);

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
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={footer}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={11}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="sparkles-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>Posts will appear here once the API is connected.</Text>
          </View>
        }
      />

      <CommentSheet
        post={activePost}
        comments={activePost ? commentsFor(activePost.id) : []}
        onClose={closeComments}
      />
    </View>
  );
};

export default Feed;
