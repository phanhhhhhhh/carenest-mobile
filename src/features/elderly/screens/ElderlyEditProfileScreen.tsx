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
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

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

  useMountEffect(() => {
    const controller = new AbortController();
    (async () => {
      const storedName = await getName();
      setName(storedName ?? '');
    })();
    if (!profile) {
      load(controller.signal);
    }
    return () => controller.abort();
  });

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

      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật thành công');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Đã xảy ra lỗi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.appBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Chỉnh sửa thông tin</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveBtn}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Image
              source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
              style={styles.avatarMascot}
              resizeMode="cover"
            />
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </View>

        <View style={{ height: 16 }} />

        {/* Basic Info */}
        <Card title="Thông tin cá nhân">
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Họ và tên của Bác"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </Card>

        {/* Physical Metrics */}
        <Card title="Chỉ số thể chất">
          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1, marginRight: 8 }]}>
              <Ionicons
                name="speedometer-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="Cân nặng (kg)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputWrap, { flex: 1, marginLeft: 8 }]}>
              <Ionicons name="resize-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="Chiều cao (cm)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={{ height: 14 }} />

          <View style={styles.bloodTypeRow}>
            <Text style={styles.bloodTypeLabel}>Nhóm máu của Bác:</Text>
            <TouchableOpacity
              style={styles.bloodTypeSelect}
              onPress={() => setBloodTypePickerVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={bloodType ? styles.bloodTypeValue : styles.bloodTypePlaceholder}>
                {bloodType ? `Nhóm máu ${bloodType}` : 'Chọn nhóm máu'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Health Conditions */}
        <Card title="Tiền sử bệnh lý nền">
          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1, marginRight: 8 }]}>
              <Ionicons name="medical-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={conditionInput}
                onChangeText={setConditionInput}
                placeholder="VD: Cao huyết áp, Tiểu đường..."
                placeholderTextColor="#94A3B8"
                onSubmitEditing={addCondition}
              />
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={addCondition} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Thêm</Text>
            </TouchableOpacity>
          </View>

          {conditions.length > 0 && (
            <View style={styles.chipsWrap}>
              {conditions.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.chip}
                  onPress={() => removeCondition(c)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{c}</Text>
                  <Ionicons name="close-circle" size={16} color="#059669" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Allergies */}
        <Card title="Dị ứng thuốc & thức ăn">
          <View style={styles.row}>
            <View style={[styles.inputWrap, { flex: 1, marginRight: 8 }]}>
              <Ionicons name="warning-outline" size={20} color="#EF4444" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={allergyInput}
                onChangeText={setAllergyInput}
                placeholder="VD: Penicillin, Tôm, Đậu phộng..."
                placeholderTextColor="#94A3B8"
                onSubmitEditing={addAllergy}
              />
            </View>
            <TouchableOpacity style={styles.addBtnError} onPress={addAllergy} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Thêm</Text>
            </TouchableOpacity>
          </View>

          {allergies.length > 0 && (
            <View style={styles.chipsWrap}>
              {allergies.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={styles.chipError}
                  onPress={() => removeAllergy(a)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{a}</Text>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* Notes */}
        <Card title="Ghi chú đặc biệt">
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ghi chú thêm về sức khỏe hoặc lưu ý khi chăm sóc..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
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
