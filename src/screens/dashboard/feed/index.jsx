import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import PostCard from '../../../components/PostCard';
import { useFeed } from '../../../hooks/useFeed';

const SURFACES = [
  { key: 'home', label: 'For You' },
  { key: 'explore', label: 'Explore' },
  { key: 'trending', label: 'Trending' },
];

/**
 * The ranked feed. `home` is the personalised surface; `explore` leans on
 * discovery for cold-start accounts and `trending` needs no personal history
 * at all, so a brand-new account still has something to read.
 */
const Feed = () => {
  const insets = useSafeAreaInsets();
  const [surface, setSurface] = useState('home');
  const { items, isLoading, isRefreshing, error, refresh, reload, toggleLike, toggleSave } =
    useFeed(surface);

  const renderItem = useCallback(
    ({ item }) => <PostCard post={item} onToggleLike={toggleLike} onToggleSave={toggleSave} />,
    [toggleLike, toggleSave],
  );

  const keyExtractor = useCallback(item => item.id, []);

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.white} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>
            {error.isNetworkError ? "Can't reach the server" : 'Something went wrong'}
          </Text>
          <Text style={styles.emptyBody}>{error.message}</Text>
          <Pressable style={styles.retryButton} onPress={() => reload()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={COLORS.white}
            colors={[COLORS.white]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="sparkles-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              {surface === 'home'
                ? 'Follow a few accounts, or try Explore to find something new.'
                : 'Be the first to post something worth reading.'}
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>PreQuit</Text>
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

      {renderBody()}
    </View>
  );
};

export default Feed;
