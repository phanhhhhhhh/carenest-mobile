import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    const timeout = setTimeout(() => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.4,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    }, delay);
    return () => {
      clearTimeout(timeout);
      loop?.stop();
    };
  }, [anim, delay]);

  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

export function TypingIndicator() {
  return (
    <View style={styles.bubbleRow}>
      <View style={styles.aiAvatarTiny}>
        <Ionicons name="sparkles" size={16} color={Colors.primary} />
      </View>
      <View style={{ width: 8 }} />
      <View style={styles.typingBubble}>
        <Dot delay={0} />
        <View style={{ width: 4 }} />
        <Dot delay={200} />
        <View style={{ width: 4 }} />
        <Dot delay={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  aiAvatarTiny: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(46, 125, 154, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: Colors.surface,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textHint },
});
