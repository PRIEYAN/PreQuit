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

const EXPAND_MS = 340;

// Format a Date as DD / MM / YYYY for display in the DOB field.
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

  // Fallback origin (lower-center) if we arrived without a measured rect.
  const origin =
    route.params?.origin ??
    { x: width * 0.1, y: height * 0.72, width: width * 0.8, height: 52 };

  // 0 = collapsed onto the button rect, 1 = fully expanded fullscreen.
  const progress = useSharedValue(0);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dob, setDob] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const onDobChange = (event, selected) => {
    // Android fires 'dismissed' when the user cancels; keep the old value.
    setShowPicker(false);
    if (event.type === 'set' && selected) {
      setDob(selected);
    }
  };

  // Transform-only morph: map a fullscreen box onto the button rect. Only
  // scale/translate/opacity animate, so it stays on the UI thread (smooth).
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
              />
            </View>

            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor={COLORS.placeholder}
                autoCorrect={false}
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

            <Pressable style={styles.createButton}>
              <Text style={styles.createButtonText}>Create Account</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default SignUp;
