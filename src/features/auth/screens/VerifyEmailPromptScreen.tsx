import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'VerifyEmailPrompt'>;

export default function VerifyEmailPromptScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const email = route.params.email;
  const [resending, setResending] = useState(false);
  const resendVerification = useAuthStore((s) => s.resendVerification);

  const handleResend = async () => {
    setResending(true);
    const ok = await resendVerification(email);
    if (ok) {
      Alert.alert('Đã gửi', 'Email xác minh đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
    } else {
      Alert.alert('Lỗi', 'Không thể gửi lại email xác minh');
    }
    setResending(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={50} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Xác minh Email của bạn</Text>
        <Text style={styles.subtitle}>Một liên kết xác minh đã được gửi đến</Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.hint}>Nhấn vào liên kết trong email để kích hoạt tài khoản của bạn</Text>
        <TouchableOpacity style={[styles.btn, resending && styles.btnDisabled]} onPress={handleResend} disabled={resending}>
          <Text style={styles.btnText}>{resending ? 'Đang gửi...' : 'Gửi lại Email'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Phone')}>
          <Text style={styles.backLink}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  email: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginTop: 8 },
  hint: { fontSize: 13, color: Colors.textHint, textAlign: 'center', marginTop: 12, marginBottom: 32 },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  backLink: { fontSize: 14, color: Colors.textSecondary, marginTop: 20 },
});
