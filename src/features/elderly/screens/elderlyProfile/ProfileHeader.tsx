import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';

export function ProfileHeader({
  name,
  phone,
  isElderlyRole,
}: {
  name: string;
  phone: string;
  isElderlyRole: boolean;
}) {
  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <Image
            source={require('../../../../../assets/mascot/mascot_wave_heart.jpg')}
            style={styles.avatarMascot}
            resizeMode="cover"
          />
        </View>
        <View style={styles.avatarBadge}>
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
        </View>
      </View>
      <View style={{ height: 14 }} />
      <Text style={styles.name}>{name}</Text>
      {!!phone && (
        <View style={styles.phonePill}>
          <Ionicons name="call-outline" size={13} color="#475569" style={{ marginRight: 4 }} />
          <Text style={styles.phone}>{phone}</Text>
        </View>
      )}
      <View style={{ height: 10 }} />
      <View
        style={[
          styles.roleBadge,
          {
            backgroundColor: isElderlyRole ? '#E6F7F5' : '#ECFDF5',
            borderColor: isElderlyRole ? '#99E6E0' : '#A7F3D0',
          },
        ]}
      >
        <Ionicons
          name={isElderlyRole ? 'person' : 'people'}
          size={14}
          color={isElderlyRole ? Colors.primary : '#059669'}
        />
        <Text style={[styles.roleBadgeText, { color: isElderlyRole ? Colors.primary : '#059669' }]}>
          {isElderlyRole ? 'Tài khoản Người cao tuổi' : 'Tài khoản Gia đình'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', paddingTop: 8 },
  avatarWrap: {
    width: 110,
    height: 110,
    ...Shadows.lg,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3.5,
    borderColor: Colors.primary,
  },
  avatarMascot: { width: '100%', height: '100%' },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  phone: { color: '#475569', fontSize: 14, fontWeight: '600' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
