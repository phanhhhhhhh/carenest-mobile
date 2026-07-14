import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAppointmentStore } from '../../family/store/appointmentStore';
import type { AppointmentItem } from '../../../shared/types';

/**
 * Port of Flutter's elderly_appointments_screen.dart.
 *
 * Flutter used a TabController + TabBar with two tabs (Upcoming / Past).
 * There is no top-tab-navigator dependency available here, so the tab bar
 * is rebuilt manually with TouchableOpacity + a simple index toggle.
 */

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Upcoming',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#2E7D9A',
  COMPLETED: '#4CAF50',
  CANCELLED: '#E53935',
  RESCHEDULED: '#F9A825',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDate(iso: string): string {
  const dt = new Date(iso);
  const weekdayIdx = (dt.getDay() + 6) % 7; // JS: Sun=0..Sat=6 -> Mon=0..Sun=6
  return `${WEEK_DAYS[weekdayIdx]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function formatTime(iso: string): string {
  const dt = new Date(iso);
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} color={Colors.textHint} size={15} />
      <Text style={styles.infoRowText}>{text}</Text>
    </View>
  );
}

function AppointmentCard({ item }: { item: AppointmentItem }) {
  const color = STATUS_COLORS[item.status] ?? Colors.textHint;
  const label = STATUS_LABELS[item.status] ?? item.status;

  return (
    <View
      style={[
        styles.card,
        { borderColor: withAlpha(color, 0.2) },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.1) }]}>
          <Ionicons name="calendar-outline" color={color} size={22} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.doctorName}>{item.doctor}</Text>
          {!!item.specialty && <Text style={styles.specialty}>{item.specialty}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: withAlpha(color, 0.1) }]}>
          <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={{ height: 14 }} />
      <InfoRow icon="calendar-outline" text={formatDate(item.appointmentDate)} />
      <View style={{ height: 6 }} />
      <InfoRow icon="time-outline" text={formatTime(item.appointmentDate)} />
      {!!item.location && (
        <>
          <View style={{ height: 6 }} />
          <InfoRow icon="location-outline" text={item.location} />
        </>
      )}
      {!!item.notes && (
        <>
          <View style={{ height: 10 }} />
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        </>
      )}
    </View>
  );
}

export default function ElderlyAppointmentsScreen() {
  const isLoading = useAppointmentStore((s) => s.isLoading);
  const error = useAppointmentStore((s) => s.error);
  const appointments = useAppointmentStore((s) => s.appointments);
  const load = useAppointmentStore((s) => s.load);
  const upcoming = useAppointmentStore((s) => s.upcoming);
  const past = useAppointmentStore((s) => s.past);

  const [tab, setTab] = useState<0 | 1>(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcomingList = upcoming();
  const pastList = past();

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderList = (items: AppointmentItem[]) => {
    if (items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" color={Colors.textHint} size={56} />
          <Text style={styles.emptyText}>No appointments yet</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <AppointmentCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab(0)}>
          <Text style={[styles.tabText, tab === 0 && styles.tabTextActive]}>
            Upcoming ({upcomingList.length})
          </Text>
          {tab === 0 && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab(1)}>
          <Text style={[styles.tabText, tab === 1 && styles.tabTextActive]}>
            Past ({pastList.length})
          </Text>
          {tab === 1 && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {isLoading && appointments.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error && appointments.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" color={Colors.textHint} size={48} />
          <View style={{ height: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        renderList(tab === 0 ? upcomingList : pastList)
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textHint },
  tabTextActive: { color: Colors.primary },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '60%',
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  listContent: { padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, marginTop: 12 },
  card: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardHeaderText: { flex: 1, marginLeft: 12 },
  doctorName: { fontWeight: '700', fontSize: 16, color: Colors.textPrimary },
  specialty: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoRowText: { color: Colors.textSecondary, fontSize: 13, marginLeft: 8 },
  notesBox: { width: '100%', padding: 10, backgroundColor: Colors.background, borderRadius: 10 },
  notesText: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
});
