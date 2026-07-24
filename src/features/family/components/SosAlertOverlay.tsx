import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../core/api/client';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useEmergencyEventStore } from '../store/emergencyEventStore';

// Polls each linked elderly's active-emergency endpoint while a family
// member has the app open, so an SOS surfaces as an immediate full-screen
// popup instead of waiting for the next manual dashboard refresh — there's
// no FCM push configured in this build (see DEMO_CHECKLIST "Known gaps").
const POLL_INTERVAL_MS = 5000;

interface ActiveAlert {
  id: string;
  elderlyId: string;
  elderlyName: string;
}

export default function SosAlertOverlay() {
  const dashData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const acknowledge = useEmergencyEventStore((s) => s.acknowledge);

  const [alert, setAlert] = useState<ActiveAlert | null>(null);
  const [acking, setAcking] = useState(false);
  const shownAlertId = useRef<string | null>(null);
  const linkedElderly = dashData?.linkedElderly ?? [];

  // FamilyDashboardScreen normally populates this store, but this overlay
  // can mount before that screen does (or alongside a different first tab).
  useEffect(() => {
    if (!dashData) loadDashboard();
  }, [dashData, loadDashboard]);

  const poll = useCallback(async () => {
    for (const e of linkedElderly) {
      try {
        const resp = await api.get(`/elderly/${e.elderlyId}/emergency-events/active`);
        const active = resp.status === 200 ? resp.data : null;
        if (active && active.status === 'ACTIVE' && String(active.id) !== shownAlertId.current) {
          shownAlertId.current = String(active.id);
          setAlert({
            id: String(active.id),
            elderlyId: e.elderlyId,
            elderlyName: e.elderlyName || active.elderlyName || '',
          });
          return; // one popup at a time
        }
      } catch {
        // Transient poll failure — try again on the next tick.
      }
    }
  }, [linkedElderly]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  const handleAcknowledge = async () => {
    if (!alert) return;
    setAcking(true);
    const ok = await acknowledge(alert.elderlyId, alert.id);
    setAcking(false);
    if (ok) setAlert(null);
  };

  if (!alert) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Cảnh báo khẩn cấp!</Text>
          <Text style={styles.subtitle}>
            {(alert.elderlyName || 'Người thân') + ' vừa nhấn nút SOS.\nHãy liên hệ hoặc kiểm tra ngay!'}
          </Text>
          <TouchableOpacity style={styles.ackBtn} onPress={handleAcknowledge} disabled={acking} activeOpacity={0.85}>
            {acking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.ackBtnText}>Đã biết, xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#E53935', marginBottom: 8 },
  subtitle: { fontSize: 14.5, color: '#37404A', textAlign: 'center', lineHeight: 21, marginBottom: 22 },
  ackBtn: {
    backgroundColor: '#12A79C',
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 36,
    minWidth: 200,
    alignItems: 'center',
  },
  ackBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
