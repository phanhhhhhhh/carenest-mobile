import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
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
      safeAreaInsets={Platform.OS === 'web' ? { bottom: 8 } : undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 70,
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
            ElderlyHome: ['home-outline', 'home'],
            ElderlyMeds: ['medkit-outline', 'medkit'],
            ElderlyCamera: ['videocam-outline', 'videocam'],
            ElderlyProfile: ['person-outline', 'person'],
          };
          const [outline, filled] = icons[route.name] || ['ellipse-outline', 'ellipse'];
          return (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons
                name={(focused ? filled : outline) as keyof typeof Ionicons.glyphMap}
                size={23}
                color={focused ? Colors.primary : color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="ElderlyHome"
        component={ElderlyHomeScreen}
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen
        name="ElderlyMeds"
        component={ElderlyMedicationScreen}
        options={{ tabBarLabel: 'Thuốc' }}
      />
      <Tab.Screen
        name="ElderlyCamera"
        component={ElderlyCameraScreen}
        options={{ tabBarLabel: 'Camera' }}
      />
      <Tab.Screen
        name="ElderlyProfile"
        component={ElderlyProfileScreen}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 38,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: Colors.primaryLighter,
  },
});
