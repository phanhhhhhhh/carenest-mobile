import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export function ToggleTile({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onChanged,
  enabled = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onChanged: (v: boolean) => void;
  enabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View
        style={[
          styles.toggleIconWrap,
          { backgroundColor: withAlpha(iconColor, enabled ? 0.1 : 0.05) },
        ]}
      >
        <Ionicons name={icon} color={enabled ? iconColor : Colors.textHint} size={20} />
      </View>
      <View style={styles.toggleTextWrap}>
        <Text
          style={[
            styles.toggleTitle,
            { color: enabled ? Colors.textPrimary : Colors.textSecondary },
          ]}
        >
          {title}
        </Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={enabled ? onChanged : undefined}
        disabled={!enabled}
        trackColor={{ true: Colors.primary }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: { marginBottom: 0 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginLeft: 4,
    marginBottom: 4,
  },
  sectionSubtitle: { fontSize: 12, color: Colors.textHint, marginLeft: 4, marginBottom: 8 },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTextWrap: { flex: 1, marginLeft: 14 },
  toggleTitle: { fontSize: 14, fontWeight: '600' },
  toggleSubtitle: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
});
