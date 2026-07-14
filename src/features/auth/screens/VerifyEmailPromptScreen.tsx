import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
      Alert.alert('Sent', 'Verification email sent. Check your inbox.');
    } else {
      Alert.alert('Error', 'Could not resend verification email');
    }
    setResending(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={50} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>A verification link has been sent to</Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.hint}>Click the link in the email to activate your account</Text>
        <TouchableOpacity style={[styles.btn, resending && styles.btnDisabled]} onPress={handleResend} disabled={resending}>
          <Text style={styles.btnText}>{resending ? 'Sending...' : 'Resend Email'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Phone')}>
          <Text style={styles.backLink}>Back to Sign In</Text>
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
