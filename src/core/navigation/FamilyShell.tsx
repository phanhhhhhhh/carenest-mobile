import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
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
        safeAreaInsets={Platform.OS === 'web' ? { bottom: 8 } : undefined}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11.5,
            fontWeight: '600',
            marginTop: -2,
            marginBottom: Platform.OS === 'ios' ? 0 : 4,
          },
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 86 : 68,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 8,
          },
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
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons
                  name={(focused ? filled : outline) as keyof typeof Ionicons.glyphMap}
                  size={21}
                  color={focused ? Colors.primary : color}
                />
              </View>
            );
          },
        })}
      >
        <Tab.Screen
          name="FamilyDashboard"
          component={FamilyDashboardScreen}
          options={{ tabBarLabel: 'Trang chủ' }}
        />
        <Tab.Screen
          name="FamilyMeds"
          component={FamilyMedicationScreen}
          options={{ tabBarLabel: 'Thuốc' }}
        />
        <Tab.Screen
          name="FamilyAppointmentsTab"
          component={FamilyAppointmentsScreen}
          options={{ tabBarLabel: 'Lịch hẹn' }}
        />
        <Tab.Screen
          name="FamilyCamera"
          component={CameraScreen}
          options={{ tabBarLabel: 'Camera' }}
        />
        <Tab.Screen
          name="FamilyProfile"
          component={FamilyProfileScreen}
          options={{ tabBarLabel: 'Hồ sơ' }}
        />
      </Tab.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: Colors.primaryLighter,
  },
});
