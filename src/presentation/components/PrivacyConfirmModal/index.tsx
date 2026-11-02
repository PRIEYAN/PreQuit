import React from 'react';
import { View, Text, Modal, Pressable, Image, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS } from '../../theme';

const OMNI_MAN_GIF = require('../../../assets/omniman.gif');

export interface PrivacyConfirmModalProps {
  readonly visible: boolean;
  /** The mode the account would move to if the viewer confirms. */
  readonly target: 'private' | 'public';
  readonly isSaving: boolean;
  readonly error: string | null;
  onConfirm(): void;
  onCancel(): void;
}

const COPY = {
  private: {
    title: 'Go private?',
    body: 'Only people who already follow you keep seeing your posts. Everyone else has to send a follow request.',
    confirm: 'Go private',
    icon: 'lock-closed' as const,
  },
  public: {
    title: 'Go public?',
    body: 'Anyone on PreQuit will be able to find your profile and read every post you have published.',
    confirm: 'Go public',
    icon: 'earth' as const,
  },
};

const PrivacyConfirmModal = ({
  visible,
  target,
  isSaving,
  error,
  onConfirm,
  onCancel,
}: PrivacyConfirmModalProps) => {
  const copy = COPY[target];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={isSaving ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Image source={OMNI_MAN_GIF} style={styles.gif} resizeMode="cover" />

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Ionicons name={copy.icon} size={18} color={COLORS.white} />
              <Text style={styles.title}>{copy.title}</Text>
            </View>
            <Text style={styles.body}>{copy.body}</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={isSaving}>
                <Text style={styles.cancelText}>Not yet</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.confirmButton, isSaving && styles.buttonDisabled]}
                onPress={onConfirm}
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color={COLORS.black} size="small" />
                ) : (
                  <Text style={styles.confirmText}>{copy.confirm}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default PrivacyConfirmModal;
