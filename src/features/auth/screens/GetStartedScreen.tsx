import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

const { width } = Dimensions.get('window');

const Teal = '#12A79C';
const TealDark = '#0E8A81';
const SubtitleGray = '#8E8E8E';
const White = '#FFFFFF';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function GetStartedScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{`Chủ động theo dõi\nsức khỏe mỗi ngày`}</Text>
        <Text style={styles.subtitle}>
          {`Nhắc nhở thông minh, kết nối bác sĩ\nvà người thân luôn bên cạnh`}
        </Text>

        <View style={styles.imageWrapper}>
          <Image
            source={require('../../../../assets/mascot/mascot_notifications.jpg')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonLabel}>Bắt đầu ngay  →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Phone')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonLabel}>Đăng nhập</Text>
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
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Teal,
    textAlign: 'center',
    lineHeight: 33,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15.5,
    color: SubtitleGray,
    textAlign: 'center',
    lineHeight: 23,
  },
  imageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: width * 0.88,
    height: width * 0.88,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Teal,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: White,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: White,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Teal,
    marginTop: 14,
  },
  secondaryButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Teal,
  },
});
