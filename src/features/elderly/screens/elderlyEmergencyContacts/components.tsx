import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../../../../shared/utils/crossPlatformAlert';
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
    case 'con trai':
    case 'con gái':
    case 'con':
    case 'son':
    case 'daughter':
    case 'child':
      return 'happy-outline';
    case 'vợ':
    case 'chồng':
    case 'wife':
    case 'husband':
      return 'heart';
    case 'bác sĩ':
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
          source={require('../../../../../assets/mascot/mascot_phone.jpg')}
          style={{ width: 160, height: 160, marginBottom: 12 }}
          resizeMode="contain"
        />
        <Text style={styles.emptyTitle}>Chưa có liên hệ khẩn cấp</Text>
        <Text style={styles.emptySubtitle}>
          Bác hãy thêm ít nhất một số điện thoại của con cháu hoặc bác sĩ để liên hệ nhanh khi cần
          trợ giúp.
        </Text>
        <View style={{ height: 20 }} />
        <TouchableOpacity style={styles.emptyAddBtn} onPress={onAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.emptyAddBtnText}>Thêm liên hệ ngay</Text>
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

  const handleCall = () => {
    if (!contact.phone) return;
    Linking.openURL(`tel:${contact.phone}`).catch(() => {
      Alert.alert('Không thể thực hiện cuộc gọi', 'Vui lòng kiểm tra lại thiết bị của Bác.');
    });
  };

  return (
    <View style={[styles.card, isPriority && styles.cardPriority]}>
      <View style={[styles.cardIconWrap, { backgroundColor: isPriority ? '#E6F7F5' : '#ECFDF5' }]}>
        <Ionicons
          name={relationIcon(contact.relationship)}
          size={26}
          color={isPriority ? Colors.primary : '#059669'}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.cardName}>{contact.name}</Text>
          {isPriority && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityBadgeText}>Ưu tiên 1</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardPhone}>{contact.phone}</Text>
        {contact.relationship.length > 0 && (
          <Text style={styles.cardRelationship}>Mối quan hệ: {contact.relationship}</Text>
        )}
      </View>

      {/* 1-tap Quick Call Button */}
      <TouchableOpacity
        style={styles.directCallBtn}
        onPress={handleCall}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="call" size={18} color="#FFFFFF" />
        <Text style={styles.directCallBtnText}>Gọi</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}
