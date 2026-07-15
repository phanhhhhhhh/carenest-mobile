import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'WelcomeBack'>;

const Teal = '#12A79C';
const TealDark = '#0E8A81';
const SubtitleGray = '#8E8E8E';
const White = '#FFFFFF';

export default function WelcomeBackScreen() {
  const route = useRoute<Route>();
  const authStoreUser = useAuthStore((s) => s.user);
  const completeLogin = useAuthStore((s) => s.completeLogin);

  const userName = route.params?.userName || authStoreUser?.name || 'bạn';

  const handleContinue = () => {
    completeLogin();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../../../assets/mascot/mascot_cap_thumbsup.jpg')}
          style={styles.mascot}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Chào mừng trở lại,{'\n'}
          {userName}!
        </Text>
        <Text style={styles.subtitle}>
          Tài khoản của bạn đã được xác thực thành công
        </Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: White,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  mascot: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Teal,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: SubtitleGray,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  btn: {
    backgroundColor: Teal,
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  btnText: {
    color: White,
    fontSize: 16,
    fontWeight: '700',
  },
});
