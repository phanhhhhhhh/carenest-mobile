import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { showErrorToast } from '../../../../shared/components/toastStore';
import {
  useHealthThresholdStore,
  getDisplayType,
  getUnit,
  type ThresholdItem,
} from '../../store/healthThresholdStore';
import { colorFor, iconFor, parseNum } from './utils';

function NumberField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.numberFieldWrap}>
      <Text style={styles.numberFieldLabel}>{label}</Text>
      <TextInput
        style={styles.numberFieldInput}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={Colors.textHint}
      />
    </View>
  );
}

interface Props {
  visible: boolean;
  metricType: string;
  existing: ThresholdItem | null;
  elderlyId: string | null;
  onClose: () => void;
}

/** Edit/create sheet for one metric's alert threshold. Remounted (via a
 *  changing key) on every open so state initializes from `existing`. */
export function ThresholdEditSheet({ visible, metricType, existing, elderlyId, onClose }: Props) {
  const create = useHealthThresholdStore((s) => s.create);
  const update = useHealthThresholdStore((s) => s.update);
  const remove = useHealthThresholdStore((s) => s.delete);

  const [minValue, setMinValue] = useState(
    existing?.minValue != null ? String(existing.minValue) : '',
  );
  const [maxValue, setMaxValue] = useState(
    existing?.maxValue != null ? String(existing.maxValue) : '',
  );
  const [minValueSecondary, setMinValueSecondary] = useState(
    existing?.minValueSecondary != null ? String(existing.minValueSecondary) : '',
  );
  const [maxValueSecondary, setMaxValueSecondary] = useState(
    existing?.maxValueSecondary != null ? String(existing.maxValueSecondary) : '',
  );
  const [alertFamily, setAlertFamily] = useState(existing?.alertFamily ?? true);

  const isBP = metricType === 'BLOOD_PRESSURE';

  const handleSave = async () => {
    if (!elderlyId) return;
    const params = {
      minValue: parseNum(minValue),
      maxValue: parseNum(maxValue),
      minValueSecondary: parseNum(minValueSecondary),
      maxValueSecondary: parseNum(maxValueSecondary),
      alertFamily,
    };
    const ok = existing
      ? await update(elderlyId, existing.id, params)
      : await create(elderlyId, { metricType, ...params });
    if (ok) {
      onClose();
    } else {
      showErrorToast(useHealthThresholdStore.getState().error ?? 'Không thể lưu ngưỡng cảnh báo');
    }
  };

  const handleDelete = async () => {
    if (!elderlyId || !existing) return;
    const ok = await remove(elderlyId, existing.id);
    if (ok) {
      onClose();
    } else {
      showErrorToast(useHealthThresholdStore.getState().error ?? 'Không thể xóa ngưỡng cảnh báo');
    }
  };

  const label = getDisplayType({ metricType } as ThresholdItem);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHandle} />
            <View style={{ height: 16 }} />
            <View style={styles.sheetTitleRow}>
              <Ionicons name={iconFor(metricType)} size={24} color={colorFor(metricType)} />
              <View style={{ width: 10 }} />
              <Text style={styles.sheetTitle}>
                {existing ? `Chỉnh sửa ngưỡng ${label}` : `Đặt ngưỡng ${label}`}
              </Text>
            </View>
            <View style={{ height: 6 }} />
            <Text style={styles.sheetUnit}>Đơn vị: {getUnit({ metricType } as ThresholdItem)}</Text>
            <View style={{ height: 20 }} />

            {isBP ? (
              <>
                <View style={styles.fieldRow}>
                  <NumberField
                    label="Tâm thu Tối thiểu"
                    value={minValue}
                    onChangeText={setMinValue}
                  />
                  <View style={{ width: 12 }} />
                  <NumberField
                    label="Tâm trương Tối thiểu"
                    value={minValueSecondary}
                    onChangeText={setMinValueSecondary}
                  />
                </View>
                <View style={{ height: 12 }} />
                <View style={styles.fieldRow}>
                  <NumberField label="Tâm thu Tối đa" value={maxValue} onChangeText={setMaxValue} />
                  <View style={{ width: 12 }} />
                  <NumberField
                    label="Tâm trương Tối đa"
                    value={maxValueSecondary}
                    onChangeText={setMaxValueSecondary}
                  />
                </View>
              </>
            ) : (
              <View style={styles.fieldRow}>
                <NumberField
                  label="Giá trị Tối thiểu"
                  value={minValue}
                  onChangeText={setMinValue}
                />
                <View style={{ width: 12 }} />
                <NumberField label="Giá trị Tối đa" value={maxValue} onChangeText={setMaxValue} />
              </View>
            )}

            <View style={{ height: 14 }} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Cảnh báo gia đình khi vượt ngưỡng</Text>
              <Switch
                value={alertFamily}
                onValueChange={setAlertFamily}
                trackColor={{ true: Colors.primary }}
              />
            </View>

            <View style={{ height: 20 }} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{existing ? 'Cập nhật' : 'Lưu ngưỡng'}</Text>
            </TouchableOpacity>

            {existing && (
              <>
                <View style={{ height: 10 }} />
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>Xóa ngưỡng</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textHint,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flexShrink: 1 },
  sheetUnit: { color: Colors.textSecondary, fontSize: 13 },
  fieldRow: { flexDirection: 'row' },
  numberFieldWrap: { flex: 1 },
  numberFieldLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  numberFieldInput: {
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14, color: Colors.textPrimary, flex: 1, marginRight: 12 },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { color: Colors.error, fontSize: 15, fontWeight: '600' },
});
