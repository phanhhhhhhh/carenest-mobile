import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PasswordResetSuccessScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
        </View>
        <Text style={styles.title}>Đặt lại mật khẩu thành công!</Text>
        <Text style={styles.subtitle}>Giờ đây bạn có thể đăng nhập bằng mật khẩu mới</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Phone')}>
          <Text style={styles.btnText}>Đến trang đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.success + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  btn: { backgroundColor: Colors.success, borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
