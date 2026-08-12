import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { TAB_BAR_SPACE } from '../../../theme';
import styles from './styles';
import ROUTES from '../../../navigation/routes';
import { useAuth } from '../../../state/AuthContext';

const Stat = ({ value, label }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Personal = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();

  // The session is restored before this screen can mount, but guard anyway so
  // a signed-out render cannot crash on a missing field.
  const displayName = user?.displayName ?? '';
  const handle = user?.handle ?? '';
  const counts = user?.counts ?? { posts: 0, followers: 0, following: 0 };

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
          {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
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
