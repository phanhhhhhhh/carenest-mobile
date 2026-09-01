import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { styles } from './styles';

export function Avatar({ name, phone }: { name: string; phone: string }) {
  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatarStack}>
        <View style={styles.avatarCircle}>
          <Image
            source={require('../../../../../assets/mascot/mascot_cap_thumbsup.jpg')}
            style={styles.avatarMascot}
            resizeMode="cover"
          />
        </View>
        <View style={styles.avatarCameraBadge}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </View>
      </View>
      <View style={{ height: 14 }} />
      <Text style={styles.avatarName}>{name}</Text>
      {phone.length > 0 && (
        <>
          <View style={{ height: 4 }} />
          <Text style={styles.avatarPhone}>{phone}</Text>
        </>
      )}
      <View style={{ height: 10 }} />
      <View style={styles.roleBadge}>
        <Ionicons name="people" size={14} color={Colors.primary} />
        <Text style={styles.roleBadgeText}>Gia đình / Người chăm sóc</Text>
      </View>
    </View>
  );
}

export function ConnectedElderly({
  name,
  conditions,
  totalMeds,
}: {
  name: string;
  conditions: string[];
  totalMeds: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.headerIconCircle}>
          <Ionicons name="people" size={18} color={Colors.primary} />
        </View>
        <Text style={styles.cardHeaderTitle}>Người thân đang theo dõi</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.elderlyRow}>
        <View style={styles.elderlyAvatar}>
          <Ionicons name="person" size={24} color={Colors.primary} />
        </View>
        <View style={styles.elderlyInfo}>
          <Text style={styles.elderlyName}>{name}</Text>
          <View style={styles.elderlySubtitleRow}>
            {conditions.length > 0 && <Text style={styles.elderlySubtitle}>{conditions[0]}</Text>}
            {totalMeds > 0 && (
              <>
                {conditions.length > 0 && <Text style={styles.elderlySubtitle}> • </Text>}
                <Text style={styles.elderlySubtitle}>{`${totalMeds} loại thuốc`}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.statusDot} />
      </View>
    </View>
  );
}

export function AddFamilyCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addFamilyCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.addFamilyIconWrap}>
        <Ionicons name="person-add" size={22} color={Colors.primary} />
      </View>
      <View style={styles.addFamilyText}>
        <Text style={styles.addFamilyTitle}>Thêm thành viên gia đình</Text>
        <Text style={styles.addFamilySubtitle}>
          Kết nối với tài khoản người cao tuổi để theo dõi sức khỏe
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
    </TouchableOpacity>
  );
}

export function ScanQRCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.scanQRCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.scanQRIconWrap}>
        <Ionicons name="qr-code-outline" size={22} color={Colors.secondaryDark} />
      </View>
      <View style={styles.addFamilyText}>
        <Text style={styles.scanQRTitle}>Quét mã QR kết nối</Text>
        <Text style={styles.addFamilySubtitle}>Quét mã QR do người cao tuổi cung cấp</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.secondaryDark} />
    </TouchableOpacity>
  );
}

export function Settings({
  onEditProfile,
  onNotificationSettings,
  onUpgradePremium,
  onHelpSupport,
  onLogout,
}: {
  onEditProfile: () => void;
  onNotificationSettings: () => void;
  onUpgradePremium: () => void;
  onHelpSupport: () => void;
  onLogout: () => void;
}) {
  const items: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    bg: string;
    onPress: () => void;
  }[] = [
    {
      icon: 'create-outline',
      label: 'Chỉnh sửa hồ sơ',
      color: Colors.primary,
      bg: Colors.primaryLighter,
      onPress: onEditProfile,
    },
    {
      icon: 'notifications-outline',
      label: 'Cài đặt thông báo',
      color: Colors.secondaryDark,
      bg: Colors.secondaryLighter,
      onPress: onNotificationSettings,
    },
    {
      icon: 'ribbon-outline',
      label: 'Nâng cấp Premium',
      color: Colors.warningDark,
      bg: Colors.warningLight,
      onPress: onUpgradePremium,
    },
    {
      icon: 'help-circle-outline',
      label: 'Trợ giúp & Hỗ trợ',
      color: Colors.textSecondary,
      bg: Colors.backgroundSecondary,
      onPress: onHelpSupport,
    },
  ];

  return (
    <View style={styles.settingsCard}>
      {items.map((item, i) => (
        <View key={i}>
          <TouchableOpacity style={styles.settingRow} onPress={item.onPress} activeOpacity={0.7}>
            <View style={[styles.settingIconWrap, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
          </TouchableOpacity>
          <View style={styles.settingDivider} />
        </View>
      ))}

      <TouchableOpacity style={styles.settingRow} onPress={onLogout} activeOpacity={0.7}>
        <View style={[styles.settingIconWrap, { backgroundColor: Colors.errorLight }]}>
          <Ionicons name="log-out" size={20} color={Colors.error} />
        </View>
        <Text style={[styles.settingLabel, { color: Colors.error }]}>Đăng xuất</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
      </TouchableOpacity>
    </View>
  );
}
