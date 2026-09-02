import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { Shadows } from '../../../core/theme/spacing';
import { useAuthStore } from '../../auth/store/authStore';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { useLinkedFamilyStore } from '../../family/store/familyStore';
import { getName, getPhone, getRole } from '../../../core/storage/secureStorage';
import { ProfileHeader } from './elderlyProfile/ProfileHeader';
import { ConditionTags, AllergyTags, InfoRow } from './elderlyProfile/tags';
import { buildProfileMenuItems } from './elderlyProfile/menuItems';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ElderlyProfileScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('ELDERLY');

  const profile = useElderlyProfileStore((s) => s.profile);
  const profileLoading = useElderlyProfileStore((s) => s.isLoading);
  const profileError = useElderlyProfileStore((s) => s.error);
  const loadProfile = useElderlyProfileStore((s) => s.load);

  const members = useLinkedFamilyStore((s) => s.members);
  const familyLoading = useLinkedFamilyStore((s) => s.isLoading);
  const loadFamily = useLinkedFamilyStore((s) => s.load);

  useMountEffect(() => {
    (async () => {
      const [n, p, r] = await Promise.all([getName(), getPhone(), getRole()]);
      setName(n || 'Người dùng');
      setPhone(p || '');
      setRole(r || 'ELDERLY');
    })();
    loadProfile();
    loadFamily();
  });

  const isElderlyRole = role === 'ELDERLY';

  const handleSignOut = () => {
    Alert.alert('Đăng xuất', 'Bác có chắc chắn muốn đăng xuất khỏi tài khoản CareNest không?', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const callMember = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Không thể thực hiện cuộc gọi', 'Vui lòng kiểm tra lại thiết bị của Bác.');
    });
  };

  const menuItems = buildProfileMenuItems(navigation);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader name={name} phone={phone} isElderlyRole={isElderlyRole} />

        <View style={{ height: 20 }} />

        {/* Health Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="medical" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderText}>Hồ sơ sức khỏe của Bác</Text>
              <Text style={styles.cardHeaderSub}>Thông tin y tế cơ bản</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ElderlyEditProfile')}
              style={styles.editBtnSmall}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
              <Text style={styles.editBtnSmallText}>Sửa</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {profileLoading ? (
            <View style={styles.centerPad}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : profileError ? (
            <View style={styles.centerPad}>
              <Text style={styles.errorText}>{profileError}</Text>
              <View style={{ height: 8 }} />
              <TouchableOpacity onPress={() => loadProfile()}>
                <Text style={styles.retryLink}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ConditionTags conditions={profile?.healthConditions ?? []} />
              {!!profile?.bloodType && (
                <>
                  <View style={{ height: 12 }} />
                  <InfoRow label="Nhóm máu" value={profile.bloodType} />
                </>
              )}
              {profile?.weight != null && (
                <>
                  <View style={{ height: 8 }} />
                  <InfoRow label="Cân nặng" value={`${profile.weight} kg`} />
                </>
              )}
              {profile?.height != null && (
                <>
                  <View style={{ height: 8 }} />
                  <InfoRow label="Chiều cao" value={`${profile.height} cm`} />
                </>
              )}
              {(profile?.allergies ?? []).length > 0 && (
                <>
                  <View style={{ height: 12 }} />
                  <AllergyTags allergies={profile!.allergies} />
                </>
              )}
              {!!profile?.notes && (
                <>
                  <View style={{ height: 12 }} />
                  <InfoRow label="Ghi chú" value={profile.notes} />
                </>
              )}
            </>
          )}
        </View>

        <View style={{ height: 16 }} />

        {/* Connected Family Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderText}>Người thân đang kết nối</Text>
              <Text style={styles.cardHeaderSub}>Gia đình chăm sóc Bác</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ElderlyQRInvite')}
              style={styles.qrBtnSmall}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="qr-code-outline" size={16} color="#059669" />
              <Text style={styles.qrBtnSmallText}>+ Mời</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {familyLoading && members.length === 0 ? (
            <View style={styles.centerPad}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : members.length === 0 ? (
            <View style={styles.centerPadSmall}>
              <Text style={styles.emptyFamilyText}>
                Chưa có người thân nào kết nối.{'\n'}Bác hãy mở mã QR để con cháu quét kết nối nhé!
              </Text>
            </View>
          ) : (
            members.map((m) => (
              <View key={m.id} style={styles.familyRow}>
                <View style={styles.familyAvatar}>
                  <Ionicons name="person" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.familyName}>{m.name}</Text>
                  <Text style={styles.familyPhone}>{m.phone}</Text>
                </View>
                {!!m.phone && (
                  <TouchableOpacity
                    style={styles.callSmallBtn}
                    onPress={() => callMember(m.phone)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.callSmallBtnText}>Gọi</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 16 }} />

        {/* Settings Menu Card */}
        <View style={styles.card}>
          {menuItems.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuRow} onPress={handleSignOut} activeOpacity={0.7}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.menuLabel, { color: '#EF4444' }]}>Đăng xuất tài khoản</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.brandFooter}>
          <Image
            source={require('../../../../assets/brand/logo_wordmark.jpg')}
            style={styles.brandFooterImage}
            resizeMode="contain"
          />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandFooter: { alignItems: 'center', marginTop: 24, marginBottom: 8 },
  brandFooterImage: { width: 140, height: 44, opacity: 0.8 },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20 },

  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  cardHeaderSub: { fontSize: 12.5, color: '#64748B', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  editBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  editBtnSmallText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },

  qrBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  qrBtnSmallText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#059669',
  },

  centerPad: { alignItems: 'center', paddingVertical: 16 },
  centerPadSmall: { alignItems: 'center', paddingVertical: 10 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  retryLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  emptyFamilyText: {
    color: '#64748B',
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
  },

  familyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  familyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  familyPhone: { color: '#64748B', fontSize: 13, marginTop: 2 },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  callSmallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { marginLeft: 14, fontSize: 15.5, fontWeight: '700', color: '#0F172A' },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 56 },
});
