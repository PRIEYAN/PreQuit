import React, { useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import ROUTES from '../../../navigation/routes';
import { useAppNavigation, useAppRoute } from '../../../navigation/hooks';
import { useUserProfile, useUserPosts } from '../../../hooks/useProfile';
import PostCard from '../../../components/PostCard';
import PostSortBar from '../../../components/PostSortBar';
import { initialOf } from '../../../../domain/entities/User';
import type { Post } from '../../../../domain/entities/Post';
import { isPrivateProfileError, messageOf } from '../../../../domain/errors/AppError';

const UserProfile = () => {
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const { params } = useAppRoute<typeof ROUTES.USER_PROFILE>();

  const { profile, isLoading, error } = useUserProfile(params.handle);
  const posts = useUserPosts(profile?.id ?? null);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostCard post={item} />,
    [],
  );

  const header = (
    <View>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialOf(profile)}</Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile?.displayName ?? params.handle}</Text>
          {profile?.isPrivate ? (
            <Ionicons name="lock-closed" size={15} color={COLORS.textMuted} />
          ) : null}
        </View>
        <Text style={styles.handle}>@{profile?.handle ?? params.handle}</Text>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      {profile ? (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.counts.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.counts.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.counts.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      ) : null}

      {posts.error ? null : (
        <View style={styles.sortWrap}>
          <PostSortBar value={posts.sort} disabled={posts.isLoading} onChange={posts.setSort} />
        </View>
      )}
    </View>
  );

  const empty = () => {
    if (posts.isLoading) {
      return (
        <View style={styles.placeholder}>
          <ActivityIndicator color={COLORS.white} />
        </View>
      );
    }

    // A private account the viewer does not follow answers 403 rather than an
    // empty list, so the two cases get different copy.
    if (isPrivateProfileError(posts.error)) {
      return (
        <View style={styles.placeholder}>
          <Ionicons name="lock-closed" size={26} color={COLORS.textMuted} />
          <Text style={styles.placeholderTitle}>This account is private</Text>
          <Text style={styles.placeholderBody}>
            Follow @{profile?.handle ?? params.handle} to see their posts.
          </Text>
        </View>
      );
    }

    if (posts.error) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderBody}>
            {messageOf(posts.error, 'Could not load these posts')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderBody}>No posts yet.</Text>
      </View>
    );
  };

  if (isLoading && !profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={COLORS.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {profile?.handle ? `@${profile.handle}` : params.handle}
        </Text>
      </View>

      {!profile && error ? (
        <View style={[styles.placeholder, styles.centered]}>
          <Text style={styles.placeholderBody}>{messageOf(error, 'Profile unavailable')}</Text>
        </View>
      ) : (
        <FlatList
          data={posts.posts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_SPACE }}
        />
      )}
    </View>
  );
};

export default UserProfile;
