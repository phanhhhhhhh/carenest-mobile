import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';

export function ChatBubble({
  text,
  isAi,
  time,
  intent,
}: {
  text: string;
  isAi: boolean;
  time: string;
  intent?: string;
}) {
  const isError = isAi && intent === 'ERROR';

  return (
    <View style={[styles.bubbleRow, !isAi && styles.bubbleRowUser]}>
      {isAi && (
        <>
          <View style={[styles.aiAvatarTiny, isError && styles.errorAvatarTiny]}>
            <Ionicons
              name={isError ? 'alert-circle' : 'sparkles'}
              size={18}
              color={isError ? '#EF4444' : '#4F46E5'}
            />
          </View>
          <View style={{ width: 8 }} />
        </>
      )}
      <View
        style={{ flexShrink: 1, alignItems: isAi ? 'flex-start' : 'flex-end', maxWidth: '84%' }}
      >
        {!!intent && !isError && (
          <View style={styles.intentBadge}>
            <Text style={styles.intentText}>{intent}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isAi ? styles.aiMessageBubble : styles.userMessageBubble,
            isError && styles.errorMessageBubble,
          ]}
        >
          <Text
            style={[
              isAi ? styles.aiBubbleText : styles.userBubbleText,
              isError && styles.errorBubbleText,
            ]}
          >
            {text}
          </Text>
        </View>
        <Text style={styles.timeText}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  aiAvatarTiny: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorAvatarTiny: { backgroundColor: '#FEE2E2' },
  intentBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  intentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    ...Shadows.sm,
  },
  aiMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  errorMessageBubble: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  aiBubbleText: { color: '#0F172A', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  userBubbleText: { color: '#FFFFFF', fontSize: 16, lineHeight: 24, fontWeight: '600' },
  errorBubbleText: { color: '#EF4444' },
  timeText: { fontSize: 12, color: '#94A3B8', marginTop: 4, marginHorizontal: 4 },
});
