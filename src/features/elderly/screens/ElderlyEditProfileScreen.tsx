import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { getName, saveName } from '../../../core/storage/secureStorage';
import { styles } from './elderlyEditProfile/styles';
import { Card } from './elderlyEditProfile/Card';
import { BloodTypePicker } from './elderlyEditProfile/BloodTypePicker';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
    const controller = new AbortController();
    (async () => {
      const storedName = await getName();
      setName(storedName ?? '');
    })();
    if (!profile) {
      load(controller.signal);
    }
    return () => controller.abort();
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
        Alert.alert('Lỗi', storeError);
        return;
      }

      if (name.trim()) {
        await saveName(name.trim());
      }

      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Đã xảy ra lỗi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Image
              source={require('../../../../assets/mascot/mascot_nurse.jpg')}
              style={styles.avatarMascot}
              resizeMode="cover"
            />
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          </View>
        </View>

        <View style={{ height: 28 }} />

        <Card title="Thông tin cá nhân">
          <View style={styles.inputWrap}>
            <Ionicons name="person" size={18} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
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
              placeholder="Liên kết qua Firebase"
              placeholderTextColor={Colors.textHint}
              editable={false}
            />
          </View>
        </Card>

        <View style={{ height: 20 }} />

        <Card title="Chỉ số cơ thể">
          <View style={styles.bloodTypeRow}>
            <Ionicons name="water" size={20} color={Colors.error} />
            <Text style={styles.bloodTypeLabel}>Nhóm máu</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.bloodTypeSelect}
              onPress={() => setBloodTypePickerVisible(true)}
            >
              <Text style={bloodType ? styles.bloodTypeValue : styles.bloodTypePlaceholder}>
                {bloodType ?? 'Chọn'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textHint} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 14 }} />

          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Ionicons name="fitness" size={18} color={Colors.warning} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Cân nặng (kg)"
                placeholderTextColor={Colors.textHint}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Ionicons name="resize" size={18} color={Colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Chiều cao (cm)"
                placeholderTextColor={Colors.textHint}
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
              />
            </View>
          </View>
        </Card>

        <View style={{ height: 20 }} />

        <Card title="Bệnh nền">
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
                placeholder="VD: Tiểu đường, Cao huyết áp..."
                placeholderTextColor={Colors.textHint}
                value={conditionInput}
                onChangeText={setConditionInput}
                onSubmitEditing={addCondition}
              />
            </View>
            <View style={{ width: 10 }} />
            <TouchableOpacity style={styles.addBtn} onPress={addCondition}>
              <Text style={styles.addBtnText}>Thêm</Text>
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

        <Card title="Dị ứng thuốc">
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
                placeholder="VD: Penicillin, Aspirin..."
                placeholderTextColor={Colors.textHint}
                value={allergyInput}
                onChangeText={setAllergyInput}
                onSubmitEditing={addAllergy}
              />
            </View>
            <View style={{ width: 10 }} />
            <TouchableOpacity style={styles.addBtnError} onPress={addAllergy}>
              <Text style={styles.addBtnText}>Thêm</Text>
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

        <Card title="Ghi chú y tế">
          <TextInput
            style={styles.notesInput}
            placeholder="VD: Ghi chú đặc biệt, tiền sử phẫu thuật..."
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

      <BloodTypePicker
        visible={bloodTypePickerVisible}
        selected={bloodType}
        onSelect={(t) => {
          setBloodType(t);
          setBloodTypePickerVisible(false);
        }}
        onClose={() => setBloodTypePickerVisible(false)}
      />
    </SafeAreaView>
  );
}
