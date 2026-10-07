import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import styles, { COLORS } from './styles';
import { useSession } from '../../../hooks/useSession';

const EXPAND_MS = 340;

const formatDob = date => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd} / ${mm} / ${yyyy}`;
};

const SignUp = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const origin =
    route.params?.origin ??
    { x: width * 0.1, y: height * 0.72, width: width * 0.8, height: 52 };

  const progress = useSharedValue(0);
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dob, setDob] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const { signUp } = useSession();

  const onDobChange = (event, selected) => {
    setShowPicker(false);
    if (event.type === 'set' && selected) {
      setDob(selected);
    }
  };

  const scaleX = origin.width / width;
  const scaleY = origin.height / height;
  const originCenterX = origin.x + origin.width / 2;
  const originCenterY = origin.y + origin.height / 2;
  const translateX = originCenterX - width / 2;
  const translateY = originCenterY - height / 2;

  const expand = useCallback(() => {
    progress.value = withTiming(1, {
      duration: EXPAND_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    if (!handle.trim() || !email.trim() || !password) {
      setFailure('Username, email and password are required.');
      return;
    }
    if (password !== confirm) {
      setFailure('Those passwords do not match.');
      return;
    }
    if (!dob) {
      setFailure('Select your date of birth.');
      return;
    }

    setIsSubmitting(true);
    setFailure(null);

    try {
      await signUp({
        handle: handle.trim().toLowerCase(),
        displayName: displayName.trim() || handle.trim(),
        email: email.trim().toLowerCase(),
        password,
        dateOfBirth: dob.toISOString().slice(0, 10),
      });
      setVerificationSent(true);
    } catch (error) {
      setFailure(error?.message ?? 'Could not create your account.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, handle, displayName, email, password, confirm, dob, signUp]);

  const close = useCallback(() => {
    progress.value = withTiming(
      0,
      { duration: EXPAND_MS, easing: Easing.in(Easing.cubic) },
      finished => {
        'worklet';
        if (finished) {
          scheduleOnRN(navigation.goBack);
        }
      },
    );
  }, [progress, navigation]);

  React.useEffect(() => {
    expand();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [expand, close]);

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: interpolate(p, [0, 1], [translateX, 0]) },
        { translateY: interpolate(p, [0, 1], [translateY, 0]) },
        { scaleX: interpolate(p, [0, 1], [scaleX, 1]) },
        { scaleY: interpolate(p, [0, 1], [scaleY, 1]) },
      ],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0.55, 1], [0, 1], 'clamp'),
      transform: [{ translateY: interpolate(p, [0.55, 1], [16, 0], 'clamp') }],
    };
  });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.panel, { width, height }, panelStyle]}>
        <Animated.View
          style={[
            styles.content,
            { paddingTop: insets.top + 8 },
            contentStyle,
          ]}>
          <Pressable style={styles.backRow} onPress={close} hitSlop={12}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>Join PreQuit — the eye of internet.</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <Text style={styles.sectionLabel}>ACCOUNT INFORMATION</Text>

            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={COLORS.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                value={handle}
                onChangeText={setHandle}
              />
            </View>

            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor={COLORS.placeholder}
                autoCorrect={false}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(v => !v)}
                hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={COLORS.black}
                />
              </Pressable>
            </View>

            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter Password"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirm(v => !v)}
                hitSlop={8}>
                <Ionicons
                  name={showConfirm ? 'eye' : 'eye-off'}
                  size={20}
                  color={COLORS.black}
                />
              </Pressable>
            </View>

            <Pressable
              style={styles.field}
              onPress={() => setShowPicker(true)}>
              <Text
                style={[
                  styles.input,
                  !dob && { color: COLORS.placeholder },
                ]}>
                {dob ? formatDob(dob) : 'Date of Birth (DD / MM / YYYY)'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={COLORS.black} />
            </Pressable>

            {showPicker && (
              <DateTimePicker
                value={dob ?? new Date(2000, 0, 1)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onDobChange}
              />
            )}

            {failure ? <Text style={styles.error}>{failure}</Text> : null}
            {verificationSent ? (
              <Text style={styles.notice}>
                Account created. Check {email.trim()} for the verification link, then log in.
              </Text>
            ) : null}

            <Pressable
              style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
              onPress={submit}
              disabled={isSubmitting}>
              <Text style={styles.createButtonText}>
                {isSubmitting ? 'Creating…' : 'Create Account'}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default SignUp;
