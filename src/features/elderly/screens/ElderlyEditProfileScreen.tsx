import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../core/theme/colors';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { getName, saveName } from '../../../core/storage/secureStorage';

/**
 * Port of Flutter's elderly_edit_profile_screen.dart.
 *
 * Note: the Flutter screen's `_save()` never sent `name` in the PUT body to
 * `/elderly-profiles/{userId}` — it only persisted the name locally via
 * SecureStorage. This port mirrors that exactly: name is saved locally only,
 * everything else goes through `useElderlyProfileStore.updateProfile`.
 *
 * The blood type field used a native Flutter `DropdownButton`. There is no
 * dropdown/picker dependency available here, so it's rebuilt as a small
 * Modal-based option sheet (same approach mandated for date/time pickers).
 */

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// TODO(routing): this screen is expected to be pushed as 'ElderlyEditProfile'
// from ElderlyProfileScreen's "Edit Profile" menu item. Route needs to be
// registered in RootStackParamList by the navigation owner.
type Nav = NativeStackNavigationProp<any>;

export default function ElderlyEditProfileScreen() {
  const navigation = useNavigation<Nav>();

  const profile = useElderlyProfileStore((s) => s.profile);
  const load = useElderlyProfileStore((s) => s.load);
  const updateProfile = useElderlyProfileStore((s) => s.updateProfile);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bloodType, setBloodType] = useState<string | undefined>(undefined);
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [bloodTypePickerVisible, setBloodTypePickerVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const storedName = await getName();
      setName(storedName ?? '');
    })();
    if (!profile) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) {
      setNotes(profile.notes ?? '');
      setConditions(profile.healthConditions ?? []);
      setAllergies(profile.allergies ?? []);
      setWeight(profile.weight != null ? String(profile.weight) : '');
      setHeight(profile.height != null ? String(profile.height) : '');
      setBloodType(profile.bloodType);
    }
  }, [profile]);

  const addCondition = () => {
    const text = conditionInput.trim();
    if (text && !conditions.includes(text)) {
      setConditions([...conditions, text]);
      setConditionInput('');
    }
  };

  const addAllergy = () => {
    const text = allergyInput.trim();
    if (text && !allergies.includes(text)) {
      setAllergies([...allergies, text]);
      setAllergyInput('');
    }
  };

  const removeCondition = (c: string) => setConditions(conditions.filter((x) => x !== c));
  const removeAllergy = (a: string) => setAllergies(allergies.filter((x) => x !== a));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const params: {
        healthConditions?: string[];
        allergies?: string[];
        notes?: string;
        bloodType?: string;
        weight?: number;
        height?: number;
      } = {
        healthConditions: conditions,
        allergies,
        notes: notes.trim(),
      };
      if (bloodType) params.bloodType = bloodType;
      const parsedWeight = parseFloat(weight.trim());
      if (!Number.isNaN(parsedWeight)) params.weight = parsedWeight;
      const parsedHeight = parseFloat(height.trim());
      if (!Number.isNaN(parsedHeight)) params.height = parsedHeight;

      await updateProfile(params);

      const storeError = useElderlyProfileStore.getState().error;
      if (storeError) {
        Alert.alert('Error', storeError);
        return;
      }

      if (name.trim()) {
        await saveName(name.trim());
      }

      Alert.alert('Success', 'Profile updated');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={64} color={Colors.primary} />
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          </View>
        </View>

        <View style={{ height: 28 }} />

        {/* Personal info */}
        <Card title="Personal Information">
          <View style={styles.inputWrap}>
            <Ionicons name="person" size={18} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.textHint}
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={{ height: 14 }} />
          <View style={[styles.inputWrap, styles.inputDisabled]}>
            <Ionicons name="call" size={18} color={Colors.textHint} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Linked via Firebase"
              placeholderTextColor={Colors.textHint}
              editable={false}
            />
          </View>
        </Card>

        <View style={{ height: 20 }} />

        {/* Vitals */}
        <Card title="Body Measurements">
          <View style={styles.bloodTypeRow}>
            <Ionicons name="water" size={20} color={Colors.error} />
            <Text style={styles.bloodTypeLabel}>Blood Type</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.bloodTypeSelect}
              onPress={() => setBloodTypePickerVisible(true)}
            >
              <Text style={bloodType ? styles.bloodTypeValue : styles.bloodTypePlaceholder}>
                {bloodType ?? 'Select'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textHint} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 14 }} />

          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Ionicons
                name="fitness"
                size={18}
                color={Colors.warning}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                placeholderTextColor={Colors.textHint}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Ionicons
                name="resize"
                size={18}
                color={Colors.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Height (cm)"
                placeholderTextColor={Colors.textHint}
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
              />
            </View>
          </View>
        </Card>

        <View style={{ height: 20 }} />

        {/* Conditions */}
        <Card title="Medical Conditions">
          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Diabetes, Hypertension..."
                placeholderTextColor={Colors.textHint}
                value={conditionInput}
                onChangeText={setConditionInput}
                onSubmitEditing={addCondition}
              />
            </View>
            <View style={{ width: 10 }} />
            <TouchableOpacity style={styles.addBtn} onPress={addCondition}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {conditions.length > 0 && (
            <>
              <View style={{ height: 14 }} />
              <View style={styles.chipsWrap}>
                {conditions.map((c) => (
                  <View key={c} style={styles.chip}>
                    <Text style={styles.chipText}>{c}</Text>
                    <TouchableOpacity onPress={() => removeCondition(c)}>
                      <Ionicons name="close" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        <View style={{ height: 20 }} />

        {/* Allergies */}
        <Card title="Drug Allergies">
          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Ionicons
                name="warning-outline"
                size={18}
                color={Colors.error}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Penicillin, Aspirin..."
                placeholderTextColor={Colors.textHint}
                value={allergyInput}
                onChangeText={setAllergyInput}
                onSubmitEditing={addAllergy}
              />
            </View>
            <View style={{ width: 10 }} />
            <TouchableOpacity style={styles.addBtnError} onPress={addAllergy}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {allergies.length > 0 && (
            <>
              <View style={{ height: 14 }} />
              <View style={styles.chipsWrap}>
                {allergies.map((a) => (
                  <View key={a} style={styles.chipError}>
                    <Text style={styles.chipText}>{a}</Text>
                    <TouchableOpacity onPress={() => removeAllergy(a)}>
                      <Ionicons name="close" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        <View style={{ height: 20 }} />

        {/* Notes */}
        <Card title="Medical Notes">
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Special notes, surgery history..."
            placeholderTextColor={Colors.textHint}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Blood type picker modal */}
      <Modal
        visible={bloodTypePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBloodTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setBloodTypePickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Blood Type</Text>
            <FlatList
              data={BLOOD_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setBloodType(item);
                    setBloodTypePickerVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                  {bloodType === item && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ height: 16 }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  saveBtn: { minWidth: 44, alignItems: 'flex-end' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  scroll: { padding: 20 },
  avatarWrap: { alignSelf: 'center' },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(46, 125, 154, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputDisabled: { backgroundColor: '#F5F5F5' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, height: '100%' },
  row: { flexDirection: 'row', alignItems: 'center' },
  bloodTypeRow: { flexDirection: 'row', alignItems: 'center' },
  bloodTypeLabel: { marginLeft: 8, fontWeight: '500', color: Colors.textPrimary, fontSize: 14 },
  bloodTypeSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.3)',
    borderRadius: 10,
  },
  bloodTypeValue: { fontSize: 13, color: Colors.textPrimary },
  bloodTypePlaceholder: { fontSize: 13, color: Colors.textHint },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addBtnError: {
    backgroundColor: Colors.error,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
  },
  chipError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
  },
  chipText: { fontSize: 13, color: Colors.textPrimary },
  notesInput: {
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    maxHeight: 400,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: { fontSize: 15, color: Colors.textPrimary },
});
