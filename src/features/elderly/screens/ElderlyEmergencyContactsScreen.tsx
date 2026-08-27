import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { styles } from './elderlyEmergencyContacts/styles';
import { ContactCard, EmptyState, type Contact } from './elderlyEmergencyContacts/components';
import { AddContactDialog, ConfirmDeleteContactDialog } from './elderlyEmergencyContacts/dialogs';

/** Strips the transient fields the API doesn't accept, keeping `id` when present. */
function toApiContact(c: Contact) {
  return {
    ...(c.id != null ? { id: c.id } : {}),
    name: c.name,
    phone: c.phone,
    relationship: c.relationship,
  };
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

  const persist = async (next: Contact[], failMsg: string): Promise<boolean> => {
    const ok = await updateEmergencyContacts(next.map(toApiContact));
    if (ok) {
      setContacts(await loadEmergencyContacts());
    } else {
      Alert.alert('Lỗi', useElderlyProfileStore.getState().error || failMsg);
    }
    return ok;
  };

  const handleAdd = async () => {
    const name = nameInput.trim();
    const phone = phoneInput.trim();
    const relationship = relationshipInput.trim();
    if (!name || !phone) return;

    const ok = await persist([...contacts, { name, phone, relationship }], 'Không thể lưu liên hệ');
    if (ok) setAddModalVisible(false);
  };

  const removeContact = (index: number) =>
    persist(
      contacts.filter((_, i) => i !== index),
      'Không thể xóa liên hệ',
    );

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

      <AddContactDialog
        visible={addModalVisible}
        name={nameInput}
        phone={phoneInput}
        relationship={relationshipInput}
        onChangeName={setNameInput}
        onChangePhone={setPhoneInput}
        onChangeRelationship={setRelationshipInput}
        onCancel={() => setAddModalVisible(false)}
        onAdd={handleAdd}
      />

      <ConfirmDeleteContactDialog
        visible={deleteTargetIndex != null}
        contactName={deleteTarget?.name ?? ''}
        onCancel={() => setDeleteTargetIndex(null)}
        onConfirm={() => {
          const index = deleteTargetIndex;
          setDeleteTargetIndex(null);
          if (index != null) removeContact(index);
        }}
      />
    </SafeAreaView>
  );
}
