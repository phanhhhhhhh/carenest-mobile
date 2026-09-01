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
            source={require('../../../../../assets/mascot/mascot_nurse.jpg')}
            style={styles.avatarMascot}
            resizeMode="cover"
          />
        </View>
        <View style={styles.avatarBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
        </View>
      </View>
      <View style={{ height: 14 }} />
      <Text style={styles.name}>{name}</Text>
      {!!phone && (
        <>
          <View style={{ height: 4 }} />
          <Text style={styles.phone}>{phone}</Text>
        </>
      )}
      <View style={{ height: 10 }} />
      <View
        style={[
          styles.roleBadge,
          {
            backgroundColor: isElderlyRole ? Colors.primaryLighter : Colors.secondaryLighter,
          },
        ]}
      >
        <Ionicons
          name={isElderlyRole ? 'person' : 'people'}
          size={14}
          color={isElderlyRole ? Colors.primary : Colors.secondaryDark}
        />
        <Text
          style={[
            styles.roleBadgeText,
            { color: isElderlyRole ? Colors.primary : Colors.secondaryDark },
          ]}
        >
          {isElderlyRole ? 'Tài khoản Người cao tuổi' : 'Tài khoản Gia đình'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center' },
  avatarWrap: {
    width: 104,
    height: 104,
    ...Shadows.lg,
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  avatarMascot: { width: '100%', height: '100%' },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  phone: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: { fontSize: 13, fontWeight: '700' },
});
