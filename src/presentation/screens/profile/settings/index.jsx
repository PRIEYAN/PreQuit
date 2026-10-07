import React, { useCallback } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import styles from './styles';
import { useSession } from '../../../hooks/useSession';

const Settings = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, signOut } = useSession();

  const confirmSignOut = useCallback(() => {
    Alert.alert('Sign out', 'You will need to sign in again to use PreQuit.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut();
        },
      },
    ]);
  }, [signOut]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Username</Text>
              <Text style={styles.rowValue}>@{user?.handle ?? '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {user?.email ?? '—'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email verified</Text>
              <Text style={styles.rowValue}>{user?.emailVerified ? 'Yes' : 'Not yet'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SESSION</Text>
          <View style={styles.card}>
            <Pressable style={styles.row} onPress={confirmSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Settings;
