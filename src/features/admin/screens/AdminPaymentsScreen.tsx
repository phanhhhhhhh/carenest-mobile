import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';
import { useAdminPaymentStore, type PendingPayment } from '../store/adminPaymentStore';
import { formatVnd, planLabel, timeAgo } from './adminPayments/format';

export default function AdminPaymentsScreen() {
  const pending = useAdminPaymentStore((s) => s.pending);
  const isLoading = useAdminPaymentStore((s) => s.isLoading);
  const error = useAdminPaymentStore((s) => s.error);
  const actingId = useAdminPaymentStore((s) => s.actingId);
  const load = useAdminPaymentStore((s) => s.load);
  const confirm = useAdminPaymentStore((s) => s.confirm);
  const reject = useAdminPaymentStore((s) => s.reject);
  const logout = useAuthStore((s) => s.logout);

  const [refreshing, setRefreshing] = useState(false);

  useMountEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: PendingPayment }) => {
    const busy = actingId === item.transactionId;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.userName}
          </Text>
          <Text style={styles.amount}>{formatVnd(item.amount)}</Text>
        </View>
        <Text style={styles.meta}>
          {planLabel(item.planType)}
          {item.provider ? ` · ${item.provider}` : ''}
          {item.createdAt ? ` · ${timeAgo(item.createdAt)}` : ''}
        </Text>
        <Text style={styles.txn} numberOfLines={1}>
          {item.transactionId}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            disabled={busy}
            onPress={() => reject(item.transactionId)}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, styles.rejectText]}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.confirmBtn]}
            disabled={busy}
            onPress={() => confirm(item.transactionId)}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.btnText, styles.confirmText]}>Xác nhận đã nhận tiền</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appBarTitle}>Duyệt thanh toán</Text>
          <Text style={styles.appBarSubtitle}>
            {pending.length > 0 ? `${pending.length} giao dịch đang chờ` : 'Không có giao dịch chờ'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && pending.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error && pending.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(p) => p.transactionId}
          renderItem={renderItem}
          contentContainerStyle={pending.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={Colors.textHint} />
              <Text style={styles.emptyText}>Tất cả thanh toán đã được xử lý</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  appBarSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 1, fontWeight: '500' },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, gap: 12 },
  emptyList: { flexGrow: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userName: { fontSize: 15.5, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
  amount: { fontSize: 15.5, fontWeight: '800', color: '#15803D' },
  meta: { fontSize: 12.5, color: '#64748B', fontWeight: '500' },
  txn: { fontSize: 11.5, color: '#94A3B8', fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { backgroundColor: Colors.primary, flex: 1.6 },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  btnText: { fontSize: 13.5, fontWeight: '700' },
  confirmText: { color: '#FFFFFF' },
  rejectText: { color: '#DC2626' },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  retryBtn: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  emptyText: { color: '#64748B', fontSize: 14.5, fontWeight: '600', textAlign: 'center' },
});
