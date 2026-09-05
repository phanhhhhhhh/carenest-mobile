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
import { Shadows } from '../../../core/theme/spacing';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useFeedStore, selectFeed } from '../store/feedStore';
import { FeedRow } from './familyFeed/FeedRow';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function FamilyFeedScreen() {
  const navigation = useNavigation();

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);

  const elderlyId =
    dashboardData && dashboardData.linkedElderly.length > 0
      ? (dashboardData.linkedElderly[dashboardData.selectedIndex]?.elderlyId ?? null)
      : null;
  const elderlyName =
    dashboardData && dashboardData.linkedElderly.length > 0
      ? (dashboardData.linkedElderly[dashboardData.selectedIndex]?.elderlyName ?? '')
      : '';

  const items = useFeedStore((s) => selectFeed(s, elderlyId));
  const loading = useFeedStore((s) => s.loading);
  const error = useFeedStore((s) => s.error);
  const load = useFeedStore((s) => s.load);
  const toggleReaction = useFeedStore((s) => s.toggleReaction);

  const [refreshing, setRefreshing] = useState(false);

  useMountEffect(() => {
    loadDashboard();
  });

  useEffect(() => {
    if (!elderlyId) return;
    const controller = new AbortController();
    load(elderlyId, controller.signal);
    return () => controller.abort();
  }, [elderlyId, load]);

  const handleRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Dòng thời gian gia đình</Text>
          {!!elderlyName && <Text style={styles.headerSub}>{elderlyName}</Text>}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {loading && items.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : error && items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cloud-offline-outline" size={30} color={Colors.textHint} />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="newspaper-outline" size={30} color={Colors.textHint} />
            <Text style={styles.emptyText}>Chưa có hoạt động nào trong 3 tuần qua</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {items.map((item, idx) => (
              <View key={item.id}>
                <FeedRow item={item} onToggleReaction={(it) => toggleReaction(elderlyId!, it)} />
                {idx < items.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 1 },
  scroll: { padding: 16 },
  center: { alignItems: 'center', paddingVertical: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...Shadows.sm,
  },
  divider: { height: 1, backgroundColor: Colors.divider },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    padding: 32,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 13.5, textAlign: 'center' },
});
