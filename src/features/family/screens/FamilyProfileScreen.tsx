import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import * as storage from '../../../core/storage/secureStorage';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';
import { useAuthStore } from '../../auth/store/authStore';
import { useFamilyDashboardStore, useFamilyLinkStore } from '../store/familyStore';
import { styles } from './familyProfile/styles';
import {
  AddFamilyCard,
  Avatar,
  ConnectedElderly,
  ScanQRCard,
  Settings,
} from './familyProfile/sections';
import { AddFamilyDialog } from './familyProfile/AddFamilyDialog';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyProfileScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const selectedElderly =
    dashboardData &&
    dashboardData.linkedElderly.length > 0 &&
    dashboardData.selectedIndex < dashboardData.linkedElderly.length
      ? dashboardData.linkedElderly[dashboardData.selectedIndex]
      : null;
  const elderlyName = selectedElderly?.elderlyName ?? null;
  const healthConditions = selectedElderly?.healthConditions ?? [];
  const totalMeds = dashboardData?.totalMedications ?? 0;

  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const linkIsLoading = useFamilyLinkStore((s) => s.isLoading);
  const sendLinkRequest = useFamilyLinkStore((s) => s.sendLinkRequest);
  const lookupUserByPhone = useFamilyLinkStore((s) => s.lookupUserByPhone);

  useEffect(() => {
    (async () => {
      const [storedName, storedPhone] = await Promise.all([storage.getName(), storage.getPhone()]);
      setName(storedName || 'User');
      setPhone(storedPhone || '');
    })();
  }, []);

  useMountEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
  });

  const openAddFamilyDialog = () => {
    setPhoneInput('');
    setAddDialogVisible(true);
  };

  const handleSendRequest = async () => {
    const rawPhone = phoneInput.trim();
    if (!rawPhone) return;

    let normalized = rawPhone;
    if (normalized.startsWith('0')) {
      normalized = `+84${normalized.substring(1)}`;
    } else if (!normalized.startsWith('+')) {
      normalized = `+84${normalized}`;
    }
    const elderlyId = await lookupUserByPhone(normalized);

    if (elderlyId == null) {
      Alert.alert('', 'Không tìm thấy người dùng với số điện thoại này');
      return;
    }

    const ok = await sendLinkRequest(elderlyId);
    setAddDialogVisible(false);
    // Read the error fresh — the `linkError` from this render predates the call.
    const freshError = useFamilyLinkStore.getState().error;
    Alert.alert('', ok ? 'Đã gửi yêu cầu kết nối!' : freshError || 'Không thể gửi yêu cầu');
    if (ok) {
      loadDashboard();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Avatar name={name} phone={phone} />
        <View style={{ height: 28 }} />

        {elderlyName != null && (
          <>
            <ConnectedElderly
              name={elderlyName}
              conditions={healthConditions}
              totalMeds={totalMeds}
            />
            <View style={{ height: 20 }} />
          </>
        )}

        <AddFamilyCard onPress={openAddFamilyDialog} />
        <View style={{ height: 12 }} />
        <ScanQRCard onPress={() => navigation.navigate('FamilyScanQR')} />
        <View style={{ height: 20 }} />

        <Settings
          onEditProfile={() =>
            Alert.alert('Sắp ra mắt', 'Tính năng chỉnh sửa hồ sơ đang được phát triển.')
          }
          onNotificationSettings={() => navigation.navigate('NotificationSettings')}
          onUpgradePremium={() => navigation.navigate('PremiumPlans')}
          onHelpSupport={() =>
            Alert.alert('Sắp ra mắt', 'Tính năng trợ giúp & hỗ trợ đang được phát triển.')
          }
          onLogout={logout}
        />
        <View style={styles.brandFooter}>
          <Image
            source={require('../../../../assets/brand/logo_wordmark.jpg')}
            style={styles.brandFooterImage}
            resizeMode="contain"
          />
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      <AddFamilyDialog
        visible={addDialogVisible}
        phone={phoneInput}
        onChangePhone={setPhoneInput}
        loading={linkIsLoading}
        onCancel={() => setAddDialogVisible(false)}
        onSend={handleSendRequest}
      />
    </SafeAreaView>
  );
}
