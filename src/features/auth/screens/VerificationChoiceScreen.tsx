import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import api from '../../../core/api/client';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'VerificationChoice'>;

export default function VerificationChoiceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email, phone, userName } = route.params;
  const [loading, setLoading] = useState('');

  const sendOtp = async (method: string) => {
    const target = method === 'EMAIL' ? email : phone;
    if (!target) {
      Alert.alert('Error', `No ${method === 'EMAIL' ? 'email' : 'phone'} provided`);
      return;
    }
    setLoading(method);
    try {
      await api.post('/auth/send-otp', { target, method });
      navigation.navigate('OtpVerify', { target, method, userName });
    } catch {
      Alert.alert('Error', `Could not send ${method === 'EMAIL' ? 'email' : 'SMS'}`);
    }
    setLoading('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify your account</Text>
        <Text style={styles.subtitle}>Choose how you'd like to verify</Text>

        {email ? (
          <TouchableOpacity
            style={[styles.option, loading === 'EMAIL' && styles.optionDisabled]}
            onPress={() => sendOtp('EMAIL')}
            disabled={!!loading}
          >
            <Ionicons name="mail-outline" size={28} color={Colors.primary} />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Verify via Email</Text>
              <Text style={styles.optionDesc}>Send code to {email}</Text>
            </View>
            {loading === 'EMAIL' ? (
              <Text style={styles.loadingText}>Sending...</Text>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
            )}
          </TouchableOpacity>
        ) : null}

        {phone ? (
          <TouchableOpacity
            style={[styles.option, loading === 'SMS' && styles.optionDisabled]}
            onPress={() => sendOtp('SMS')}
            disabled={!!loading}
          >
            <Ionicons name="chatbubble-outline" size={28} color={Colors.secondary} />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Verify via SMS</Text>
              <Text style={styles.optionDesc}>Send code to {phone}</Text>
            </View>
            {loading === 'SMS' ? (
              <Text style={styles.loadingText}>Sending...</Text>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 28,
  },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  optionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});
