import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../../features/auth/store/authStore';
import { navigationRef } from './navigationRef';

// Screens
import WelcomeScreen from '../../features/auth/screens/WelcomeScreen';
import PhoneScreen from '../../features/auth/screens/PhoneScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../../features/auth/screens/ForgotPasswordScreen';
import NewPasswordScreen from '../../features/auth/screens/NewPasswordScreen';
import PasswordResetSuccessScreen from '../../features/auth/screens/PasswordResetSuccessScreen';
import VerifyEmailPromptScreen from '../../features/auth/screens/VerifyEmailPromptScreen';
import VerificationChoiceScreen from '../../features/auth/screens/VerificationChoiceScreen';
import OtpVerifyScreen from '../../features/auth/screens/OtpVerifyScreen';
import WelcomeBackScreen from '../../features/auth/screens/WelcomeBackScreen';
import PinSetupScreen from '../../features/auth/screens/PinSetupScreen';
import PinVerifyScreen from '../../features/auth/screens/PinVerifyScreen';
import VerifyEmailScreen from '../../features/auth/screens/VerifyEmailScreen';
import ElderlyShell from './ElderlyShell';
import FamilyShell from './FamilyShell';

export type RootStackParamList = {
  Welcome: undefined;
  Phone: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  NewPassword: { token: string };
  PasswordResetSuccess: undefined;
  VerifyEmailPrompt: { email: string };
  VerificationChoice: { email: string; phone: string; userName: string };
  OtpVerify: { target: string; method: string; userName: string };
  WelcomeBack: { userName?: string; user?: Record<string, unknown> };
  PinSetup: undefined;
  PinVerify: undefined;
  VerifyEmail: { token: string };
  ElderlyShell: undefined;
  FamilyShell: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // ── Auth flow ──────────────────────────────────────────
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Phone" component={PhoneScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
            <Stack.Screen name="PasswordResetSuccess" component={PasswordResetSuccessScreen} />
            <Stack.Screen name="VerifyEmailPrompt" component={VerifyEmailPromptScreen} />
            <Stack.Screen name="VerificationChoice" component={VerificationChoiceScreen} />
            <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
            <Stack.Screen name="WelcomeBack" component={WelcomeBackScreen} />
            <Stack.Screen name="PinSetup" component={PinSetupScreen} />
            <Stack.Screen name="PinVerify" component={PinVerifyScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        ) : user?.role === 'ELDERLY' ? (
          <Stack.Screen name="ElderlyShell" component={ElderlyShell} />
        ) : (
          <Stack.Screen name="FamilyShell" component={FamilyShell} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
