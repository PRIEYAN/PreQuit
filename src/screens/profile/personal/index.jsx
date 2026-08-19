import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { TAB_BAR_SPACE } from '../../../theme';
import styles from './styles';
import ROUTES from '../../../navigation/routes';

// Placeholder profile until the API is wired back up.
const USER = {
  displayName: 'prie.aur',
  handle: 'mogger',
  bio: 'i use arch btw',
  counts: { posts: 27, followers: 2, following: 5 },
};

const Stat = ({ value, label }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Personal = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { displayName, handle, counts } = USER;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + TAB_BAR_SPACE,
        }}>
        {/* Profile Header */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(displayName || handle || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.handle}>@{handle}</Text>
          <Text style={styles.bio}>{USER.bio}</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Stat value={counts.posts} label="Posts" />
          <View style={styles.statDivider} />
          <Stat value={counts.followers} label="Followers" />
          <View style={styles.statDivider} />
          <Stat value={counts.following} label="Following" />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit profile</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => navigation.navigate(ROUTES.SETTINGS)}>
            <Text style={styles.actionButtonText}>Settings</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
};

export default Personal;
