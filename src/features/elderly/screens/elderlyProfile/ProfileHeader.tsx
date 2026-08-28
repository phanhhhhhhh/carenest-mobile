import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

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
          <Ionicons name="camera" size={16} color="#FFFFFF" />
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
            backgroundColor: isElderlyRole ? 'rgba(46, 125, 154, 0.1)' : 'rgba(76, 175, 130, 0.1)',
          },
        ]}
      >
        <Text
          style={[
            styles.roleBadgeText,
            { color: isElderlyRole ? Colors.primary : Colors.secondary },
          ]}
        >
          {isElderlyRole ? 'Người cao tuổi' : 'Gia đình'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center' },
  avatarWrap: { width: 100, height: 100 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(46, 125, 154, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarMascot: { width: '100%', height: '100%', borderRadius: 999 },
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
  name: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  phone: { color: Colors.textSecondary, fontSize: 14 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleBadgeText: { fontSize: 13, fontWeight: '600' },
});
