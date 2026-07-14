import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import ElderlyHomeScreen from '../../features/elderly/screens/ElderlyHomeScreen';
import ElderlyMedicationScreen from '../../features/elderly/screens/ElderlyMedicationScreen';
import ElderlyCameraScreen from '../../features/elderly/screens/ElderlyCameraScreen';
import ElderlyHealthScreen from '../../features/elderly/screens/ElderlyHealthScreen';
import ElderlyChatScreen from '../../features/elderly/screens/ElderlyChatScreen';
import ElderlyProfileScreen from '../../features/elderly/screens/ElderlyProfileScreen';

// Note: would add a typed param list here (e.g. `createBottomTabNavigator<ElderlyTabParamList>()`)
// but the nested tab params aren't modeled yet — see RootStackParamList.
const Tab = createBottomTabNavigator();

export default function ElderlyShell() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textHint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, [string, string]> = {
            ElderlyHome: ['home-outline', 'home'],
            ElderlyMeds: ['medkit-outline', 'medkit'],
            ElderlyCamera: ['videocam-outline', 'videocam'],
            ElderlyHealth: ['heart-outline', 'heart'],
            ElderlyChat: ['chatbubble-outline', 'chatbubble'],
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
      <Tab.Screen name="ElderlyHome" component={ElderlyHomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ElderlyMeds" component={ElderlyMedicationScreen} options={{ tabBarLabel: 'Meds' }} />
      <Tab.Screen name="ElderlyCamera" component={ElderlyCameraScreen} options={{ tabBarLabel: 'Camera' }} />
      <Tab.Screen name="ElderlyHealth" component={ElderlyHealthScreen} options={{ tabBarLabel: 'Health' }} />
      <Tab.Screen name="ElderlyChat" component={ElderlyChatScreen} options={{ tabBarLabel: 'Chat AI' }} />
      <Tab.Screen name="ElderlyProfile" component={ElderlyProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
