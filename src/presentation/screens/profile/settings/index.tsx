import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS } from '../../../theme';
import { useSession } from '../../../hooks/useSession';
import { useMyProfile } from '../../../hooks/useProfile';
import PrivacyConfirmModal from '../../../components/PrivacyConfirmModal';
import type { PostAudience } from '../../../../domain/entities/User';

interface AudienceRowProps {
  readonly label: string;
  readonly value: PostAudience;
  readonly disabled: boolean;
  onChange(next: PostAudience): void;
}

const AUDIENCE_OPTIONS: ReadonlyArray<{ value: PostAudience; label: string }> = [
  { value: 'followers', label: 'Followers' },
  { value: 'everyone', label: 'Everyone' },
];

const AudienceRow = ({ label, value, disabled, onChange }: AudienceRowProps) => (
  <View style={styles.stackRow}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.segment}>
      {AUDIENCE_OPTIONS.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
            disabled={disabled}
            onPress={() => onChange(option.value)}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const Settings = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, signOut } = useSession();
  const { profile, isLoading, isSavingPrivacy, privacyError, setAccountPrivate, updatePrivacy } =
    useMyProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isPrivate = Boolean(profile?.isPrivate);
  const privacy = profile?.privacy;

  const confirmToggle = useCallback(async () => {
    const saved = await setAccountPrivate(!isPrivate);
    if (saved) setConfirmOpen(false);
  }, [setAccountPrivate, isPrivate]);

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
          <Text style={styles.sectionLabel}>ACCOUNT PRIVACY</Text>
          <View style={styles.card}>
            <Pressable style={styles.row} onPress={() => setConfirmOpen(true)} disabled={isLoading}>
              <Ionicons
                name={isPrivate ? 'lock-closed' : 'person'}
                size={16}
                color={COLORS.white}
                style={styles.rowIcon}
              />
              <Text style={styles.rowLabel}>{isPrivate ? 'Private account' : 'Public account'}</Text>
              {isLoading ? (
                <ActivityIndicator color={COLORS.textMuted} size="small" />
              ) : (
                <Text style={styles.rowAction}>Switch</Text>
              )}
            </Pressable>
          </View>
          <Text style={styles.sectionHint}>
            {isPrivate
              ? 'Only approved followers can see what you post.'
              : 'Anyone on PreQuit can see what you post.'}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionLabel}>PRIVATE ACCOUNT</Text>
            {isPrivate ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.card, !isPrivate && styles.cardInactive]}>
            <AudienceRow
              label="Who can view and interact with my posts"
              value={privacy?.whoCanViewPosts ?? 'everyone'}
              disabled={isSavingPrivacy}
              onChange={next => {
                updatePrivacy({ whoCanViewPosts: next }).catch(() => undefined);
              }}
            />
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Let non-followers request to message me</Text>
              <Switch
                value={privacy?.allowMessageRequests ?? true}
                disabled={isSavingPrivacy}
                onValueChange={next => {
                  updatePrivacy({ allowMessageRequests: next }).catch(() => undefined);
                }}
                trackColor={{ true: COLORS.white, false: COLORS.glassStrong }}
                thumbColor={COLORS.black}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionLabel}>PUBLIC ACCOUNT</Text>
            {isPrivate ? null : (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            )}
          </View>
          <View style={[styles.card, isPrivate && styles.cardInactive]}>
            <AudienceRow
              label="Who can message me"
              value={privacy?.whoCanMessage ?? 'followers'}
              disabled={isSavingPrivacy}
              onChange={next => {
                updatePrivacy({ whoCanMessage: next }).catch(() => undefined);
              }}
            />
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Show my activity status</Text>
              <Switch
                value={privacy?.showActivityStatus ?? true}
                disabled={isSavingPrivacy}
                onValueChange={next => {
                  updatePrivacy({ showActivityStatus: next }).catch(() => undefined);
                }}
                trackColor={{ true: COLORS.white, false: COLORS.glassStrong }}
                thumbColor={COLORS.black}
              />
            </View>
          </View>
          <Text style={styles.sectionHint}>
            These preferences are kept whichever mode your account is in.
          </Text>
        </View>

        {privacyError ? (
          <View style={styles.section}>
            <Text style={styles.errorText}>{privacyError}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SESSION</Text>
          <View style={styles.card}>
            <Pressable style={styles.row} onPress={confirmSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

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

export default Settings;
