import React from 'react';
import {
  NavigationContainer,
  type LinkingOptions,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../../features/auth/store/authStore';
import { navigationRef } from './navigationRef';
import { flushPendingDeepLink } from '../services/pushNotificationService';
import type { ElderlyTabParamList } from './ElderlyShell';
import type { FamilyTabParamList } from './FamilyShell';

import WelcomeScreen from '../../features/auth/screens/WelcomeScreen';
import GetStartedScreen from '../../features/auth/screens/GetStartedScreen';
import RegisterSuccessScreen from '../../features/auth/screens/RegisterSuccessScreen';
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
import ElderlyEditProfileScreen from '../../features/elderly/screens/ElderlyEditProfileScreen';
import ElderlyEmergencyContactsScreen from '../../features/elderly/screens/ElderlyEmergencyContactsScreen';
import ElderlyMedicationHistoryScreen from '../../features/elderly/screens/ElderlyMedicationHistoryScreen';
import ElderlyAppointmentsScreen from '../../features/elderly/screens/ElderlyAppointmentsScreen';
import HealthReportScreen from '../../features/elderly/screens/HealthReportScreen';
import ElderlyChatScreen from '../../features/elderly/screens/ElderlyChatScreen';
import ElderlyHealthScreen from '../../features/elderly/screens/ElderlyHealthScreen';
import CameraScreen from '../../features/family/screens/CameraScreen';
import HealthThresholdScreen from '../../features/family/screens/HealthThresholdScreen';
import FamilyHealthScreen from '../../features/family/screens/FamilyHealthScreen';
import FamilyAlertsScreen from '../../features/family/screens/FamilyAlertsScreen';
import PremiumPlansScreen from '../../features/family/screens/PremiumPlansScreen';
import NotificationsScreen from '../../features/notifications/screens/NotificationsScreen';
import NotificationSettingsScreen from '../../features/notifications/screens/NotificationSettingsScreen';
import WeeklySummaryScreen from '../../features/family/screens/WeeklySummaryScreen';

export type RootStackParamList = {
  Welcome: undefined;
  GetStarted: undefined;
  RegisterSuccess: { userName?: string } | undefined;
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
  ElderlyShell: NavigatorScreenParams<ElderlyTabParamList> | undefined;
  FamilyShell: NavigatorScreenParams<FamilyTabParamList> | undefined;
  FamilyHealth: undefined;
  FamilyAlerts: undefined;
  WeeklySummary: undefined;
  ElderlyEditProfile: undefined;
  ElderlyEmergencyContacts: undefined;
  ElderlyMedicationHistory: { medicationId: string; medicationName: string };
  ElderlyAppointments: undefined;
  HealthReport: undefined;
  ElderlyChat: undefined;
  ElderlyHealth: undefined;
  CameraScreen: { elderlyId: string };
  HealthThreshold: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  PremiumPlans: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// The backend's password-reset / email-verification emails link to
// `<frontendUrl>/reset-password?token=…` and `<frontendUrl>/verify-email?token=…`
// (see EmailService.java). This maps those URLs onto the corresponding screens
// on web (query params become route params); `carenest://` covers native builds.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['carenest://'],
  config: {
    initialRouteName: 'Welcome',
    screens: {
      NewPassword: 'reset-password',
      VerifyEmail: 'verify-email',
    },
  },
};

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  return (
    // A notification tap on cold start can restore auth before the container is
    // ready — flush the queued deep link from here as well (see App.tsx).
    <NavigationContainer ref={navigationRef} linking={linking} onReady={flushPendingDeepLink}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="GetStarted" component={GetStartedScreen} />
            <Stack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} />
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
        ) : (
          <>
            {user?.role === 'ELDERLY' ? (
              <Stack.Screen name="ElderlyShell" component={ElderlyShell} />
            ) : (
              <Stack.Screen name="FamilyShell" component={FamilyShell} />
            )}
            <Stack.Screen name="ElderlyEditProfile" component={ElderlyEditProfileScreen} />
            <Stack.Screen name="ElderlyEmergencyContacts" component={ElderlyEmergencyContactsScreen} />
            <Stack.Screen name="ElderlyMedicationHistory" component={ElderlyMedicationHistoryScreen} />
            <Stack.Screen name="ElderlyAppointments" component={ElderlyAppointmentsScreen} />
            <Stack.Screen name="HealthReport" component={HealthReportScreen} />
            <Stack.Screen name="ElderlyChat" component={ElderlyChatScreen} />
            <Stack.Screen name="ElderlyHealth" component={ElderlyHealthScreen} />
            <Stack.Screen name="CameraScreen" component={CameraScreen} />
            <Stack.Screen name="HealthThreshold" component={HealthThresholdScreen} />
            <Stack.Screen name="FamilyHealth" component={FamilyHealthScreen} />
            <Stack.Screen name="FamilyAlerts" component={FamilyAlertsScreen} />
            <Stack.Screen name="WeeklySummary" component={WeeklySummaryScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="PremiumPlans" component={PremiumPlansScreen} />
            <Stack.Screen name="PinSetup" component={PinSetupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}