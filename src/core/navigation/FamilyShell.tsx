import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import FamilyDashboardScreen from '../../features/family/screens/FamilyDashboardScreen';
import FamilyMedicationScreen from '../../features/family/screens/FamilyMedicationScreen';
import FamilyAppointmentsScreen from '../../features/family/screens/FamilyAppointmentsScreen';
import CameraScreen from '../../features/family/screens/CameraScreen';
import FamilyProfileScreen from '../../features/family/screens/FamilyProfileScreen';
import SosAlertOverlay from '../../features/family/components/SosAlertOverlay';

export type FamilyTabParamList = {
  FamilyDashboard: undefined;
  FamilyMeds: undefined;
  FamilyAppointmentsTab: undefined;
  FamilyCamera: undefined;
  FamilyProfile: undefined;
};

const Tab = createBottomTabNavigator<FamilyTabParamList>();

export default function FamilyShell() {
  return (
    <>
      <SosAlertOverlay />
      <Tab.Navigator
      // See ElderlyShell.tsx — web has no safe-area bottom inset (no
      // viewport-fit=cover), so the tab bar's label row renders flush
      // against — and partly past — the physical screen edge there.
      safeAreaInsets={Platform.OS === 'web' ? { bottom: 6 } : undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textHint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 6 },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, [string, string]> = {
            FamilyDashboard: ['home-outline', 'home'],
            FamilyMeds: ['medkit-outline', 'medkit'],
            FamilyAppointmentsTab: ['calendar-outline', 'calendar'],
            FamilyCamera: ['videocam-outline', 'videocam'],
            FamilyProfile: ['person-outline', 'person'],
          };
          const [outline, filled] = icons[route.name] || ['ellipse-outline', 'ellipse'];
          return (
            <Ionicons
              name={(focused ? filled : outline) as keyof typeof Ionicons.glyphMap}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
        <Tab.Screen name="FamilyDashboard" component={FamilyDashboardScreen} options={{ tabBarLabel: 'Trang chủ' }} />
        <Tab.Screen name="FamilyMeds" component={FamilyMedicationScreen} options={{ tabBarLabel: 'Thuốc' }} />
        <Tab.Screen
          name="FamilyAppointmentsTab"
          component={FamilyAppointmentsScreen}
          options={{ tabBarLabel: 'Lịch hẹn' }}
        />
        <Tab.Screen name="FamilyCamera" component={CameraScreen} options={{ tabBarLabel: 'Camera' }} />
        <Tab.Screen name="FamilyProfile" component={FamilyProfileScreen} options={{ tabBarLabel: 'Hồ sơ' }} />
      </Tab.Navigator>
    </>
  );
}
