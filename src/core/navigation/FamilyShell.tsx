import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import FamilyDashboardScreen from '../../features/family/screens/FamilyDashboardScreen';
import FamilyMedicationScreen from '../../features/family/screens/FamilyMedicationScreen';
import CameraScreen from '../../features/family/screens/CameraScreen';
import FamilyProfileScreen from '../../features/family/screens/FamilyProfileScreen';

const Tab = createBottomTabNavigator();

export default function FamilyShell() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textHint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, [string, string]> = {
            FamilyDashboard: ['home-outline', 'home'],
            FamilyMeds: ['medkit-outline', 'medkit'],
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
      <Tab.Screen name="FamilyDashboard" component={FamilyDashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="FamilyMeds" component={FamilyMedicationScreen} options={{ tabBarLabel: 'Meds' }} />
      <Tab.Screen name="FamilyCamera" component={CameraScreen} options={{ tabBarLabel: 'Camera' }} />
      <Tab.Screen name="FamilyProfile" component={FamilyProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}