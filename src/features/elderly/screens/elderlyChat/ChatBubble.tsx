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
              size={16}
              color={isError ? Colors.error : Colors.aiPrimary}
            />
          </View>
          <View style={{ width: 8 }} />
        </>
      )}
      <View
        style={{ flexShrink: 1, alignItems: isAi ? 'flex-start' : 'flex-end', maxWidth: '82%' }}
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
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  aiAvatarTiny: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.aiLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorAvatarTiny: { backgroundColor: Colors.sosLight },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    ...Shadows.sm,
  },
  aiMessageBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  errorMessageBubble: {
    backgroundColor: Colors.sosLight,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  aiBubbleText: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  userBubbleText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22, fontWeight: '500' },
  errorBubbleText: { color: Colors.error },
  timeText: { color: Colors.textSecondary, fontSize: 11, marginTop: 4, marginHorizontal: 4 },
  intentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.aiLighter,
    marginBottom: 4,
  },
  intentText: { color: Colors.aiPrimary, fontSize: 10, fontWeight: '700' },
});
