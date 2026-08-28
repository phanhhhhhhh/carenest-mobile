import React from 'react';
import { View, Text, StyleSheet, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubtitleGray, SuccessGreen, Teal, White } from './constants';

export function SuccessModal({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.popupOverlay}>
        <View style={styles.popupCard}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={38} color={White} />
          </View>
          <Text style={styles.popupTitle}>Xác thực thành công!</Text>
          <Text style={styles.popupSubtitle}>Bạn đã xác thực số điện thoại{'\n'}thành công.</Text>
          <Image
            source={require('../../../../../assets/brand/logo_wordmark.jpg')}
            style={styles.popupLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  popupCard: {
    backgroundColor: White,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SuccessGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  popupTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Teal,
    marginBottom: 8,
  },
  popupSubtitle: {
    fontSize: 14.5,
    color: SubtitleGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  popupLogo: {
    width: 150,
    height: 44,
  },
});
