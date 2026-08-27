import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { styles } from './styles';

export interface Contact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export function relationIcon(relationship: string): keyof typeof Ionicons.glyphMap {
  switch (relationship.toLowerCase()) {
    case 'son':
    case 'daughter':
    case 'child':
      return 'happy-outline';
    case 'wife':
    case 'husband':
      return 'heart';
    case 'doctor':
      return 'medkit';
    default:
      return 'person';
  }
}

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.centerFill}>
      <View style={styles.emptyWrap}>
        <Image
          source={require('../../../../../assets/mascot/mascot_wave_heart.jpg')}
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
        <View style={{ height: 8 }} />
        <Text style={styles.emptyTitle}>Chưa có liên hệ khẩn cấp</Text>
        <View style={{ height: 8 }} />
        <Text style={styles.emptySubtitle}>
          Thêm ít nhất một người để nhận{'\n'}thông báo khi bạn cần giúp đỡ.
        </Text>
        <View style={{ height: 24 }} />
        <TouchableOpacity style={styles.emptyAddBtn} onPress={onAdd}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.emptyAddBtnText}>Thêm liên hệ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ContactCard({
  contact,
  index,
  onDelete,
}: {
  contact: Contact;
  index: number;
  onDelete: () => void;
}) {
  const isPriority = index === 0;
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.cardIconWrap,
          { backgroundColor: isPriority ? 'rgba(46, 125, 154, 0.1)' : 'rgba(76, 175, 130, 0.08)' },
        ]}
      >
        <Ionicons
          name={relationIcon(contact.relationship)}
          size={24}
          color={isPriority ? Colors.primary : Colors.secondary}
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{contact.name}</Text>
        <Text style={styles.cardPhone}>{contact.phone}</Text>
        {contact.relationship.length > 0 && (
          <Text style={styles.cardRelationship}>{contact.relationship}</Text>
        )}
      </View>
      {isPriority && (
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityBadgeText}>Ưu tiên</Text>
        </View>
      )}
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}
