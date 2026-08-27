import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ height: 16 }} />
      {children}
    </View>
  );
}
