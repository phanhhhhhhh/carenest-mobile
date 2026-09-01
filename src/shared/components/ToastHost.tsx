import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../core/theme/colors';
import { Spacing } from '../../core/theme/spacing';
import { ToastEntry, ToastVariant, useToastStore } from './toastStore';

const VARIANT_CONFIG: Record<ToastVariant, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  error: { bg: Colors.error, icon: 'alert-circle' },
  success: { bg: Colors.success, icon: 'checkmark-circle' },
  info: { bg: Colors.primary, icon: 'information-circle' },
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: (id: number) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;
  const config = VARIANT_CONFIG[toast.variant];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, opacity, translateY, onDismiss]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: config.bg,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable style={styles.toastContent} onPress={() => onDismiss(toast.id)}>
        <Ionicons name={config.icon} size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
        <Text style={styles.toastText} numberOfLines={3}>
          {toast.message}
        </Text>
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" style={{ marginLeft: 8 }} />
      </Pressable>
    </Animated.View>
  );
}

/** Mount once at the app root. Renders queued toasts above the safe area. */
export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.container, { top: insets.top + Spacing.sm }]}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 999,
    gap: Spacing.sm,
  },
  toast: {
    borderRadius: 16,
    // Crisper than the card presets — a floating toast should read as clearly lifted.
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
  },
});
