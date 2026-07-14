import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';

export default function ElderlyCameraScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.placeholder}>
        <Ionicons name="videocam-outline" size={60} color={Colors.textHint} />
        <Text style={styles.title}>Camera Monitor</Text>
        <Text style={styles.subtitle}>Connect a camera device to monitor your elderly</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
