import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import ROUTES from '../../../navigation/routes';
import { useAppNavigation } from '../../../navigation/hooks';
import PostCard from '../../../components/PostCard';
import CommentSheet from '../../../components/CommentSheet';
import { useFeed } from '../../../hooks/useFeed';
import {
  FeedSurface,
  type FeedSurfaceValue,
} from '../../../../domain/repositories/FeedRepository';
import type { Post, PostAuthor } from '../../../../domain/entities/Post';
import { messageOf } from '../../../../domain/errors/AppError';

interface SurfaceTab {
  readonly key: FeedSurfaceValue;
  readonly label: string;
}

const SURFACES: readonly SurfaceTab[] = [
  { key: FeedSurface.HOME, label: 'For You' },
  { key: FeedSurface.EXPLORE, label: 'Explore' },
  { key: FeedSurface.TRENDING, label: 'Trending' },
];

const Feed = () => {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const [surface, setSurface] = useState<FeedSurfaceValue>(FeedSurface.HOME);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const { items, isLoading, isRefreshing, error, refresh, toggleLike, toggleSave } = useFeed(surface);

  const openAuthorChat = useCallback(
    (author: PostAuthor) =>
      navigation.navigate(ROUTES.DM, {
        peerId: author.id,
        name: author.displayName,
        status: `@${author.handle}`,
      }),
    [navigation],
  );

  const openComments = useCallback((post: Post) => setActivePost(post), []);
  const closeComments = useCallback(() => setActivePost(null), []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Post>) => (
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

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const footer = useMemo(() => {
    if (items.length === 0) return <View style={styles.footerSpacer} />;
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>You are all caught up</Text>
      </View>
    );
  }, [items.length]);

  const empty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.white} />
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Ionicons name="sparkles-outline" size={40} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>{error ? 'Could not load the feed' : 'Nothing here yet'}</Text>
        <Text style={styles.emptyBody}>
          {error
            ? messageOf(error, 'Could not load the feed')
            : 'Follow a few people and their posts will show up here.'}
        </Text>
      </View>
    );
  }, [isLoading, error]);

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
              <Text style={[styles.surfaceText, active && styles.surfaceTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        ListFooterComponent={footer}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        removeClippedSubviews
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={COLORS.white} />
        }
        ListEmptyComponent={empty}
      />

      <CommentSheet post={activePost} onClose={closeComments} />
    </View>
  );
};

export default Feed;
