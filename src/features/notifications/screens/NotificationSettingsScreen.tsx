import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/theme/colors';

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({
    medicationReminder: true,
    healthAlert: true,
    familyUpdate: true,
    reminderMinutesBefore: 15,
  });

  const toggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings((s) => ({ ...s, [key]: !s[key] }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Notification Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Medication Reminders</Text>
            <Switch value={settings.medicationReminder} onValueChange={() => toggle('medicationReminder')} trackColor={{ true: Colors.primary }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Health Alerts</Text>
            <Switch value={settings.healthAlert} onValueChange={() => toggle('healthAlert')} trackColor={{ true: Colors.primary }} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Family Updates</Text>
            <Switch value={settings.familyUpdate} onValueChange={() => toggle('familyUpdate')} trackColor={{ true: Colors.primary }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
  section: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 15, color: Colors.textPrimary },
});
