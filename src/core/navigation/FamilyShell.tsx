import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import FamilyDashboardScreen from '../../features/family/screens/FamilyDashboardScreen';
import FamilyMedicationScreen from '../../features/family/screens/FamilyMedicationScreen';
import FamilyHealthScreen from '../../features/family/screens/FamilyHealthScreen';
import FamilyAlertsScreen from '../../features/family/screens/FamilyAlertsScreen';
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
            FamilyDashboard: ['grid-outline', 'grid'],
            FamilyMeds: ['medkit-outline', 'medkit'],
            FamilyHealth: ['fitness-outline', 'fitness'],
            FamilyAlerts: ['notifications-outline', 'notifications'],
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
      <Tab.Screen name="FamilyDashboard" component={FamilyDashboardScreen} options={{ tabBarLabel: 'Overview' }} />
      <Tab.Screen name="FamilyMeds" component={FamilyMedicationScreen} options={{ tabBarLabel: 'Meds' }} />
      <Tab.Screen name="FamilyHealth" component={FamilyHealthScreen} options={{ tabBarLabel: 'Health' }} />
      <Tab.Screen name="FamilyAlerts" component={FamilyAlertsScreen} options={{ tabBarLabel: 'Alerts' }} />
      <Tab.Screen name="FamilyProfile" component={FamilyProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
