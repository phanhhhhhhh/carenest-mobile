import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadows } from '../../../../core/theme/spacing';
import type { DailyDigest } from '../../store/familyDigestStore';

interface Props {
  digest: DailyDigest | null;
  onPress: () => void;
}

export function FamilyDigestCard({ digest, onPress }: Props) {
  const snippet = digest?.body
    ? digest.body.length > 110
      ? digest.body.slice(0, 110).trim() + '...'
      : digest.body
    : 'Bản tin AI kể lại một ngày của cha mẹ sẽ được gửi tự động lúc 20:00 tối mỗi ngày. Chạm để xem.';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={22} color="#FFFFFF" />
      </View>
      <View style={styles.content}>
        <View style={styles.tagRow}>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>BẢN TIN GIA ĐÌNH 20:00</Text>
          </View>
          {digest?.quietDay && (
            <View style={styles.quietBadge}>
              <Text style={styles.quietText}>Một ngày bình yên</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {digest?.title || 'Tóm tắt một ngày yêu thương'}
        </Text>
        <Text style={styles.snippet} numberOfLines={2}>
          {snippet}
        </Text>
      </View>
      <Ionicons name="chevron-forward" color="#6366F1" size={22} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    ...Shadows.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 14,
    marginRight: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  quietBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quietText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  snippet: {
    fontSize: 12.5,
    color: '#4338CA',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 17,
  },
});
