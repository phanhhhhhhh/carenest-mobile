import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import ElderlyHomeScreen from '../../features/elderly/screens/ElderlyHomeScreen';
import ElderlyMedicationScreen from '../../features/elderly/screens/ElderlyMedicationScreen';
import ElderlyCameraScreen from '../../features/elderly/screens/ElderlyCameraScreen';
import ElderlyProfileScreen from '../../features/elderly/screens/ElderlyProfileScreen';

export type ElderlyTabParamList = {
  ElderlyHome: undefined;
  ElderlyMeds: undefined;
  ElderlyCamera: undefined;
  ElderlyProfile: undefined;
};

const Tab = createBottomTabNavigator<ElderlyTabParamList>();

export default function ElderlyShell() {
  return (
    <Tab.Navigator
      // On native, the tab bar auto-detects real safe-area insets (home indicator /
      // gesture bar). On web there's no viewport-fit=cover, so that inset is always 0
      // and the bar's label row renders flush against — and partly past — the physical
      // screen edge. Override it for web only; native keeps its real detected inset.
      safeAreaInsets={Platform.OS === 'web' ? { bottom: 6 } : undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textHint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 6 },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, [string, string]> = {
            ElderlyHome: ['home-outline', 'home'],
            ElderlyMeds: ['medkit-outline', 'medkit'],
            ElderlyCamera: ['videocam-outline', 'videocam'],
            ElderlyProfile: ['person-outline', 'person'],
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
      <Tab.Screen name="ElderlyHome" component={ElderlyHomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="ElderlyMeds" component={ElderlyMedicationScreen} options={{ tabBarLabel: 'Thuốc' }} />
      <Tab.Screen name="ElderlyCamera" component={ElderlyCameraScreen} options={{ tabBarLabel: 'Camera' }} />
      <Tab.Screen name="ElderlyProfile" component={ElderlyProfileScreen} options={{ tabBarLabel: 'Hồ sơ' }} />
    </Tab.Navigator>
  );
}
