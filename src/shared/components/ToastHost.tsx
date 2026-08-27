import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../core/theme/colors';
import { Spacing, BorderRadius } from '../../core/theme/spacing';
import { Typography } from '../../core/theme/typography';
import { ToastEntry, ToastVariant, useToastStore } from './toastStore';

const VARIANT_COLORS: Record<ToastVariant, string> = {
  error: Colors.error,
  success: Colors.success,
  info: Colors.primary,
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: (id: number) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, opacity, onDismiss]);

  return (
    <Animated.View
      style={[styles.toast, { backgroundColor: VARIANT_COLORS[toast.variant], opacity }]}
    >
      <Pressable style={styles.toastContent} onPress={() => onDismiss(toast.id)}>
        <Text style={styles.toastText} numberOfLines={3}>
          {toast.message}
        </Text>
        <Text style={styles.dismissHint}>✕</Text>
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
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  toastText: {
    ...Typography.body,
    color: Colors.surface,
    flex: 1,
    marginRight: Spacing.md,
  },
  dismissHint: {
    ...Typography.body,
    color: Colors.surface,
    opacity: 0.8,
  },
});
