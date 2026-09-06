import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useFamilyDigestStore } from '../store/familyDigestStore';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function FamilyDigestScreen() {
  const navigation = useNavigation();
  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);

  const elderlyId =
    dashboardData && dashboardData.linkedElderly.length > 0
      ? (dashboardData.linkedElderly[dashboardData.selectedIndex]?.elderlyId ?? null)
      : null;

  const latest = useFamilyDigestStore((s) => s.latest);
  const isLoading = useFamilyDigestStore((s) => s.isLoading);
  const isGenerating = useFamilyDigestStore((s) => s.isGenerating);
  const error = useFamilyDigestStore((s) => s.error);
  const loadLatest = useFamilyDigestStore((s) => s.loadLatest);
  const generateNow = useFamilyDigestStore((s) => s.generateNow);

  const [refreshing, setRefreshing] = useState(false);

  useMountEffect(() => {
    loadDashboard();
    loadLatest();
  });

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLatest();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bản tin gia đình</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {error && <Text style={styles.error}>{error}</Text>}

        {isLoading && !latest ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : latest ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{latest.title}</Text>
            <Text style={styles.cardBody}>{latest.body}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardBody}>
              Chưa có bản tin nào. Bản tin được gửi tự động lúc 20:00 mỗi tối.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.genBtn, (isGenerating || !elderlyId) && styles.btnDisabled]}
          onPress={() => elderlyId && generateNow(elderlyId)}
          disabled={isGenerating || !elderlyId}
        >
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
          <Text style={styles.genBtnText}>
            {isGenerating ? 'Đang tạo...' : 'Tạo bản tin hôm nay ngay'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { paddingVertical: 40, alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16, gap: 14 },
  error: { color: '#DC2626', fontSize: 13 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  cardBody: { fontSize: 14.5, color: Colors.textPrimary, lineHeight: 22 },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 14,
  },
  genBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
