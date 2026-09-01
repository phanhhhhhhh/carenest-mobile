import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';

export function WelcomeBubble({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.mascotWelcomeWrap}>
        <Image
          source={require('../../../../../assets/mascot/mascot_wave_heart.jpg')}
          style={styles.mascotWelcomeImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.bubbleRow}>
        <View style={styles.aiAvatarSmall}>
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </View>
        <View style={{ width: 10 }} />
        <View style={styles.aiBubble}>
          <View style={styles.badgeRow}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>CareNest AI Assistant</Text>
            </View>
          </View>
          <Text style={styles.aiBubbleText}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  mascotWelcomeWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 16 },
  mascotWelcomeImage: { width: 160, height: 160 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 },
  aiAvatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.aiPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBubble: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    borderTopLeftRadius: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    ...Shadows.md,
  },
  badgeRow: { marginBottom: 8 },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.aiLighter,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBadgeText: {
    color: Colors.aiPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  aiBubbleText: { color: Colors.textPrimary, fontSize: 14.5, lineHeight: 23, fontWeight: '500' },
});
