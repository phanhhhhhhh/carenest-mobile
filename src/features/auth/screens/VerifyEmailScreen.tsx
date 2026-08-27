import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  // Deep-linked from the verification email — the token may be absent if the
  // URL was opened without its query string.
  const token = route.params?.token ?? '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const verifyEmail = useAuthStore((s) => s.verifyEmail);

  useEffect(() => {
    (async () => {
      const result = await verifyEmail(token);
      if (result.success) {
        setState('success');
      } else {
        setErrorMsg(result.error || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn');
        setState('error');
      }
    })();
  }, [token, verifyEmail]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {state === 'loading' ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang xác minh email của bạn...</Text>
          </>
        ) : state === 'success' ? (
          <>
            <View style={styles.iconSuccess}>
              <Ionicons name="checkmark-circle" size={50} color={Colors.success} />
            </View>
            <Text style={styles.title}>Email đã được xác minh!</Text>
            <Text style={styles.subtitle}>Tài khoản của bạn hiện đã hoạt động</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Phone')}>
              <Text style={styles.btnText}>Đến trang đăng nhập</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.iconError}>
              <Ionicons name="close-circle" size={50} color={Colors.error} />
            </View>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: Colors.success }]}
              onPress={() => navigation.navigate('Phone')}
            >
              <Text style={styles.btnText}>Đến trang đăng nhập</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 16, color: Colors.textSecondary, marginTop: 20 },
  iconSuccess: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconError: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, marginBottom: 32 },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center', marginBottom: 32 },
  btn: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
