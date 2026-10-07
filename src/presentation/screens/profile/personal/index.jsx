import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import styles from './styles';
import ROUTES from '../../../navigation/routes';
import { useMyProfile } from '../../../hooks/useProfile';
import { initialOf } from '../../../../domain/entities/User';

const Stat = ({ value, label }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Personal = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, isLoading, isRefreshing, error, refresh } = useMyProfile();

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
        <Text style={styles.statLabel}>{error ? error.message : 'Profile unavailable'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={COLORS.white} />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + TAB_BAR_SPACE,
        }}>
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
      </ScrollView>
    </View>
  );
};

export default Personal;
