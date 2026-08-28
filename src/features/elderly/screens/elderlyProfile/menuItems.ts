import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../core/navigation/AppNavigator';
import { Colors } from '../../../../core/theme/colors';
import { Alert } from '../../../../shared/utils/crossPlatformAlert';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export type ProfileMenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
};

export function buildProfileMenuItems(navigation: Nav): ProfileMenuItem[] {
  return [
    {
      icon: 'create-outline',
      label: 'Chỉnh sửa hồ sơ',
      color: Colors.primary,
      bg: 'rgba(46, 125, 154, 0.08)',
      onPress: () => navigation.navigate('ElderlyEditProfile'),
    },
    {
      icon: 'call-outline',
      label: 'Liên hệ khẩn cấp',
      color: Colors.sosPrimary,
      bg: 'rgba(211, 47, 47, 0.08)',
      onPress: () => navigation.navigate('ElderlyEmergencyContacts'),
    },
    {
      icon: 'notifications-outline',
      label: 'Cài đặt thông báo',
      color: Colors.secondary,
      bg: 'rgba(76, 175, 130, 0.08)',
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      icon: 'ribbon-outline',
      label: 'Nâng cấp Premium',
      color: Colors.warning,
      bg: 'rgba(255, 167, 38, 0.08)',
      onPress: () => navigation.navigate('PremiumPlans'),
    },
    {
      icon: 'qr-code-outline',
      label: 'Tạo mã QR kết nối',
      color: Colors.secondary,
      bg: 'rgba(76, 175, 130, 0.08)',
      onPress: () => navigation.navigate('ElderlyQRInvite'),
    },
    {
      icon: 'lock-closed-outline',
      label: 'Đặt mã PIN',
      color: Colors.primary,
      bg: 'rgba(46, 125, 154, 0.08)',
      onPress: () => navigation.navigate('PinSetup'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Trợ giúp & Hỗ trợ',
      color: Colors.textSecondary,
      bg: 'rgba(173, 181, 189, 0.08)',
      onPress: () => Alert.alert('Sắp ra mắt', 'Tính năng Trợ giúp & Hỗ trợ đang được phát triển.'),
    },
  ];
}
