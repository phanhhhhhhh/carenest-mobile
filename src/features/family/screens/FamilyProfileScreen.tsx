import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import * as storage from '../../../core/storage/secureStorage';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';
import { useAuthStore } from '../../auth/store/authStore';
import {
  useFamilyDashboardStore,
  useFamilyLinkStore,
  useLinkedFamilyStore,
} from '../store/familyStore';
import { usePaymentStore } from '../store/paymentStore';
import { styles } from './familyProfile/styles';
import {
  AddFamilyCard,
  Avatar,
  ConnectedElderly,
  ConnectedFamilyMembers,
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
  const selectElderly = useFamilyDashboardStore((s) => s.selectElderly);
  const linkedElderlyList = dashboardData?.linkedElderly ?? [];
  const selectedIndex = dashboardData?.selectedIndex ?? 0;

  const selectedElderly =
    linkedElderlyList.length > 0 && selectedIndex < linkedElderlyList.length
      ? linkedElderlyList[selectedIndex]
      : null;
  const elderlyName = selectedElderly?.elderlyName ?? null;
  const healthConditions = selectedElderly?.healthConditions ?? [];
  const totalMeds = dashboardData?.totalMedications ?? 0;

  const familyMembers = useLinkedFamilyStore((s) => s.members);
  const familyLoading = useLinkedFamilyStore((s) => s.isLoading);
  const loadFamilyMembers = useLinkedFamilyStore((s) => s.load);
  const isPremium = usePaymentStore((s) => s.isPremium());
  const maxFamilyAccounts = isPremium ? 6 : 1;
  const maxElderlyAccounts = isPremium ? 4 : 1;

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
    usePaymentStore.getState().load();
  });

  useEffect(() => {
    if (selectedElderly?.elderlyId) {
      loadFamilyMembers(String(selectedElderly.elderlyId));
    }
  }, [selectedElderly?.elderlyId, loadFamilyMembers]);

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

    if (!/^\+\d{8,15}$/.test(normalized)) {
      Alert.alert('', 'Số điện thoại không hợp lệ. Vui lòng kiểm tra và thử lại.');
      return;
    }

    const targetUser = await lookupUserByPhone(normalized);

    if (targetUser == null) {
      const lookupError = useFamilyLinkStore.getState().error;
      Alert.alert('', lookupError || 'Không tìm thấy tài khoản CareNest với số điện thoại này.');
      return;
    }

    const elderlyId = targetUser.role === 'FAMILY' ? selectedElderly?.elderlyId : targetUser.id;
    if (!elderlyId) {
      Alert.alert('', 'Vui lòng chọn người cao tuổi muốn kết nối trước.');
      return;
    }

    Alert.alert(
      'Gửi yêu cầu kết nối?',
      `Bạn đang gửi yêu cầu liên kết với ${targetUser.name || normalized}. Người cao tuổi sẽ phải đồng ý trước khi CareNest chia sẻ dữ liệu chăm sóc.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi yêu cầu',
          onPress: async () => {
            const ok = await sendLinkRequest(
              String(elderlyId),
              targetUser.role === 'FAMILY' ? targetUser.id : undefined,
            );
            const { error, errorKind } = useFamilyLinkStore.getState();

            if (!ok) {
              Alert.alert(
                errorKind === 'premium_required' ? 'Đã đạt giới hạn gói' : 'Không thể gửi yêu cầu',
                error || 'Vui lòng thử lại.',
                errorKind === 'premium_required'
                  ? [
                      { text: 'Để sau', style: 'cancel' },
                      { text: 'Xem Premium', onPress: () => navigation.navigate('PremiumPlans') },
                    ]
                  : undefined,
              );
              return;
            }

            setAddDialogVisible(false);
            setPhoneInput('');
            Alert.alert(
              'Đã gửi yêu cầu',
              'Kết nối đang chờ người cao tuổi đồng ý. CareNest sẽ chỉ hiển thị dữ liệu sau khi yêu cầu được chấp nhận.',
            );
            usePaymentStore.getState().load();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Avatar name={name} phone={phone} />
        <View style={{ height: 28 }} />

        {linkedElderlyList.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {linkedElderlyList.map((e, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <TouchableOpacity
                    key={e.elderlyId}
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 9999,
                        backgroundColor: '#E6F7F5',
                        marginRight: 8,
                        borderWidth: 1,
                        borderColor: '#99E6E0',
                      },
                      isSelected && {
                        backgroundColor: Colors.primary,
                        borderColor: Colors.primary,
                      },
                    ]}
                    onPress={() => selectElderly(i)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="person"
                      size={14}
                      color={isSelected ? '#FFFFFF' : Colors.primary}
                    />
                    <Text
                      style={[
                        { fontSize: 13, fontWeight: '700', color: Colors.primary },
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {e.elderlyName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {elderlyName != null && (
          <>
            <ConnectedElderly
              name={elderlyName}
              conditions={healthConditions}
              totalMeds={totalMeds}
              elderlyCount={linkedElderlyList.length}
              maxElderly={maxElderlyAccounts}
            />
            <View style={{ height: 16 }} />

            <ConnectedFamilyMembers
              members={familyMembers}
              maxMembers={maxFamilyAccounts}
              isLoading={familyLoading}
              onUpgradePress={() => navigation.navigate('PremiumPlans')}
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
          onVisitStreak={() => navigation.navigate('FamilyVisitStreak')}
          onDigest={() => navigation.navigate('FamilyDigest')}
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
