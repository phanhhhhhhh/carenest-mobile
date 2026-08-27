import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export function WelcomeBubble({ message }: { message: string }) {
  return (
    <View>
      <View style={styles.mascotWelcomeWrap}>
        <Image
          source={require('../../../../../assets/mascot/mascot_wave_heart.jpg')}
          style={styles.mascotWelcomeImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.bubbleRow}>
        <View style={styles.aiAvatarSmall}>
          <Ionicons name="sparkles" size={20} color={Colors.primary} />
        </View>
        <View style={{ width: 8 }} />
        <View style={styles.aiBubble}>
          <Text style={styles.aiBubbleText}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mascotWelcomeWrap: { alignItems: 'center', paddingTop: 16, paddingBottom: 4 },
  mascotWelcomeImage: { width: 150, height: 150 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  aiAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 154, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBubble: {
    flexShrink: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  aiBubbleText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 22 },
});
