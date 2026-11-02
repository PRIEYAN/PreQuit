import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import styles from './styles';
import ROUTES from '../../../navigation/routes';
import { useAppNavigation } from '../../../navigation/hooks';
import { useMyProfile, useUserPosts } from '../../../hooks/useProfile';
import PostCard from '../../../components/PostCard';
import PostSortBar from '../../../components/PostSortBar';
import PrivacyConfirmModal from '../../../components/PrivacyConfirmModal';
import { initialOf } from '../../../../domain/entities/User';
import type { Post } from '../../../../domain/entities/Post';
import { messageOf } from '../../../../domain/errors/AppError';

interface StatProps {
  readonly value: number;
  readonly label: string;
}

const Stat = ({ value, label }: StatProps) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Personal = () => {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const { profile, isLoading, isRefreshing, error, refresh, isSavingPrivacy, privacyError, setAccountPrivate } =
    useMyProfile();
  const posts = useUserPosts(profile?.id ?? null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isPrivate = Boolean(profile?.isPrivate);

  const confirmToggle = useCallback(async () => {
    const saved = await setAccountPrivate(!isPrivate);
    if (saved) setConfirmOpen(false);
  }, [setAccountPrivate, isPrivate]);

  const renderItem = useCallback(({ item }: { item: Post }) => <PostCard post={item} />, []);

  if (isLoading && !profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={COLORS.white} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.statLabel}>
          {error ? messageOf(error, 'Profile unavailable') : 'Profile unavailable'}
        </Text>
      </View>
    );
  }

  const header = (
    <View>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialOf(profile)}</Text>
        </View>
        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.handle}>@{profile.handle}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      <View style={styles.stats}>
        <Stat value={profile.counts.posts} label="Posts" />
        <View style={styles.statDivider} />
        <Stat value={profile.counts.followers} label="Followers" />
        <View style={styles.statDivider} />
        <Stat value={profile.counts.following} label="Following" />
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit profile</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate(ROUTES.SETTINGS)}>
          <Text style={styles.actionButtonText}>Settings</Text>
        </Pressable>
      </View>

      <View style={styles.sortWrap}>
        <PostSortBar value={posts.sort} disabled={posts.isLoading} onChange={posts.setSort} />
      </View>
    </View>
  );

  const empty = posts.isLoading ? (
    <View style={styles.placeholder}>
      <ActivityIndicator color={COLORS.white} />
    </View>
  ) : (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderBody}>
        {posts.error ? messageOf(posts.error, 'Could not load your posts') : 'No posts yet.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          style={styles.visibilityBadge}
          hitSlop={10}
          onPress={() => setConfirmOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={
            isPrivate ? 'Account is private. Switch to public.' : 'Account is public. Switch to private.'
          }>
          <Ionicons
            name={isPrivate ? 'lock-closed' : 'person'}
            size={15}
            color={COLORS.white}
          />
          <Text style={styles.visibilityText}>{isPrivate ? 'Private' : 'Public'}</Text>
        </Pressable>
      </View>

      <FlatList
        data={posts.posts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              refresh().catch(() => undefined);
              posts.refresh().catch(() => undefined);
            }}
            tintColor={COLORS.white}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_SPACE }}
      />

      <PrivacyConfirmModal
        visible={confirmOpen}
        target={isPrivate ? 'public' : 'private'}
        isSaving={isSavingPrivacy}
        error={privacyError}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
};

export default Personal;
