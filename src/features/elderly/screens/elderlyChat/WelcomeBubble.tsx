import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
          <Ionicons name="sparkles" size={22} color="#FFFFFF" />
        </View>
        <View style={{ width: 12 }} />
        <View style={styles.aiBubble}>
          <View style={styles.badgeRow}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>Trợ lý sức khỏe AI</Text>
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
  mascotWelcomeImage: { width: 170, height: 170 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 },
  aiAvatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBubble: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 24,
    borderTopLeftRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    ...Shadows.md,
  },
  badgeRow: { marginBottom: 8 },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aiBadgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },
  aiBubbleText: { color: '#0F172A', fontSize: 15.5, lineHeight: 24, fontWeight: '500' },
});
