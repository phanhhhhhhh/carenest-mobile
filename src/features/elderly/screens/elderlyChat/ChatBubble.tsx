import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

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
              color={isError ? Colors.error : Colors.primary}
            />
          </View>
          <View style={{ width: 8 }} />
        </>
      )}
      <View style={{ flexShrink: 1, alignItems: isAi ? 'flex-start' : 'flex-end' }}>
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
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  aiAvatarTiny: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(46, 125, 154, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorAvatarTiny: { backgroundColor: Colors.sosLight },
  messageBubble: {
    maxWidth: 280,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  aiMessageBubble: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4 },
  userMessageBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  errorMessageBubble: {
    backgroundColor: Colors.sosLight,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  aiBubbleText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 22 },
  userBubbleText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  errorBubbleText: { color: Colors.error },
  timeText: { color: Colors.textHint, fontSize: 11, marginTop: 3 },
  intentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    marginBottom: 4,
  },
  intentText: { color: Colors.primary, fontSize: 10, fontWeight: '600' },
});
