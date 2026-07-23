import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,

  Modal,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useElderlyProfileStore } from '../store/elderlyStore';



interface Contact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

function relationIcon(relationship: string): keyof typeof Ionicons.glyphMap {
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

export default function ElderlyEmergencyContactsScreen() {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [relationshipInput, setRelationshipInput] = useState('');

  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);

  const loadEmergencyContacts = useElderlyProfileStore((s) => s.loadEmergencyContacts);
  const updateEmergencyContacts = useElderlyProfileStore((s) => s.updateEmergencyContacts);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const result = await loadEmergencyContacts();
      setContacts(result);
      setIsLoading(false);
    })();
  }, [loadEmergencyContacts]);

  const openAddDialog = () => {
    setNameInput('');
    setPhoneInput('');
    setRelationshipInput('');
    setAddModalVisible(true);
  };

  const handleAdd = async () => {
    const name = nameInput.trim();
    const phone = phoneInput.trim();
    const relationship = relationshipInput.trim();
    if (!name || !phone) return;

    const updated = [
      ...contacts.map((c) => ({
        ...(c.id != null ? { id: c.id } : {}),
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
      })),
      { name, phone, relationship },
    ];

    const ok = await updateEmergencyContacts(updated);
    if (ok) {
      setAddModalVisible(false);
      const result = await loadEmergencyContacts();
      setContacts(result);
    } else {
      const errMsg = useElderlyProfileStore.getState().error || 'Không thể lưu liên hệ';
      Alert.alert('Lỗi', errMsg);
    }
  };

  const removeContact = async (index: number) => {
    const contact = contacts[index];
    const remaining = contacts
      .filter((c) => c.id !== contact.id || c.name !== contact.name)
      .map((c) => ({
        ...(c.id != null ? { id: c.id } : {}),
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
      }));

    const ok = await updateEmergencyContacts(remaining);
    if (ok) {
      const result = await loadEmergencyContacts();
      setContacts(result);
    } else {
      const errMsg = useElderlyProfileStore.getState().error || 'Không thể xóa liên hệ';
      Alert.alert('Lỗi', errMsg);
    }
  };

  const deleteTarget = deleteTargetIndex != null ? contacts[deleteTargetIndex] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Liên hệ khẩn cấp</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : contacts.length === 0 ? (
        <EmptyState onAdd={openAddDialog} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.sosPrimary} />
            <Text style={styles.infoBannerText}>
              Những người này sẽ được thông báo khi bạn nhấn nút SOS.
            </Text>
          </View>

          {contacts.map((contact, index) => (
            <ContactCard
              key={`${contact.id ?? ''}-${index}`}
              contact={contact}
              index={index}
              onDelete={() => setDeleteTargetIndex(index)}
            />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddDialog}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Thêm liên hệ</Text>
      </TouchableOpacity>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Thêm liên hệ khẩn cấp</Text>

            <View style={{ height: 16 }} />

            <View style={styles.inputWrap}>
              <Ionicons name="person" size={18} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                placeholderTextColor={Colors.textHint}
                value={nameInput}
                onChangeText={setNameInput}
              />
            </View>

            <View style={{ height: 12 }} />

            <View style={styles.inputWrap}>
              <Ionicons name="call" size={18} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor={Colors.textHint}
                keyboardType="phone-pad"
                value={phoneInput}
                onChangeText={setPhoneInput}
              />
            </View>

            <View style={{ height: 12 }} />

            <View style={styles.inputWrap}>
              <Ionicons name="people" size={18} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mối quan hệ (VD: Con trai, Bác sĩ...)"
                placeholderTextColor={Colors.textHint}
                value={relationshipInput}
                onChangeText={setRelationshipInput}
              />
            </View>

            <View style={{ height: 20 }} />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogAddBtn} onPress={handleAdd}>
                <Text style={styles.dialogAddText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteTargetIndex != null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTargetIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Xóa liên hệ?</Text>
            <View style={{ height: 8 }} />
            <Text style={styles.dialogBody}>
              Xóa {deleteTarget?.name ?? ''} khỏi danh sách liên hệ khẩn cấp?
            </Text>
            <View style={{ height: 20 }} />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setDeleteTargetIndex(null)}
              >
                <Text style={styles.dialogCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => {
                  const index = deleteTargetIndex;
                  setDeleteTargetIndex(null);
                  if (index != null) removeContact(index);
                }}
              >
                <Text style={styles.dialogDeleteText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.centerFill}>
      <View style={styles.emptyWrap}>
        <Image
          source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
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

function ContactCard({
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { marginRight: 12 },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: Colors.sosLight,
    borderWidth: 1,
    borderColor: 'rgba(211, 47, 47, 0.2)',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, marginLeft: 14 },
  cardName: { fontWeight: '600', fontSize: 15, color: Colors.textPrimary },
  cardPhone: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  cardRelationship: { color: Colors.textHint, fontSize: 12, marginTop: 2 },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
  },
  priorityBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: '600' },
  deleteBtn: { marginLeft: 8, padding: 4 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyAddBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  dialogTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  dialogBody: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, height: '100%' },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dialogCancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  dialogCancelText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  dialogAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dialogAddText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  dialogDeleteText: { color: Colors.error, fontSize: 14, fontWeight: '600' },
});
