import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'RegisterSuccess'>;

const { width } = Dimensions.get('window');

const Teal = '#12A79C';
const SuccessGreen = '#22C55E';
const SubtitleGray = '#8E8E8E';
const White = '#FFFFFF';

export default function RegisterSuccessScreen() {
  const route = useRoute<Route>();
  const completeLogin = useAuthStore((s) => s.completeLogin);

  // Show the celebration screen briefly, then enter the app
  useEffect(() => {
    const timer = setTimeout(() => {
      completeLogin();
    }, 2000);
    return () => clearTimeout(timer);
  }, [completeLogin]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={40} color={White} />
        </View>
        <Text style={styles.title}>Đăng ký thành công!</Text>
        <Text style={styles.subtitle}>Chào mừng bạn đến với</Text>
        <Image
          source={require('../../../../assets/brand/logo_wordmark.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Image
        source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
        style={styles.mascot}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: White,
  },
  content: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 32,
  },
  checkCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: SuccessGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Teal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: SubtitleGray,
    marginBottom: 12,
  },
  logo: {
    width: 185,
    height: 52,
  },
  mascot: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: width * 1.05,
    height: width * 1.05,
  },
});
