import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../core/api/client';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useEmergencyEventStore } from '../store/emergencyEventStore';

const POLL_INTERVAL_MS = 5000;

interface ActiveAlert {
  id: string;
  elderlyId: string;
  elderlyName: string;
  escalationLevel: number;
  emergencyCallLoggedAt?: string | null;
}

export default function SosAlertOverlay() {
  const dashData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const acknowledge = useEmergencyEventStore((s) => s.acknowledge);
  const logEmergencyCall = useEmergencyEventStore((s) => s.logEmergencyCall);

  const [alert, setAlert] = useState<ActiveAlert | null>(null);
  const [acking, setAcking] = useState(false);
  const [calling, setCalling] = useState(false);
  const shownAlertId = useRef<string | null>(null);
  const linkedElderly = useMemo(() => dashData?.linkedElderly ?? [], [dashData]);

  useEffect(() => {
    if (!dashData) loadDashboard();
  }, [dashData, loadDashboard]);

  const poll = useCallback(async () => {
    for (const e of linkedElderly) {
      try {
        const resp = await api.get(`/elderly/${e.elderlyId}/emergency-events/active`);
        const active = resp.status === 200 ? resp.data : null;
        if (active && active.status === 'ACTIVE') {
          shownAlertId.current = String(active.id);
          setAlert({
            id: String(active.id),
            elderlyId: e.elderlyId,
            elderlyName: e.elderlyName || active.elderlyName || '',
            escalationLevel: Number(active.escalationLevel ?? 0),
            emergencyCallLoggedAt: active.emergencyCallLoggedAt ?? null,
          });
          return;
        } else if (shownAlertId.current && (!active || active.status !== 'ACTIVE')) {
          shownAlertId.current = null;
          setAlert(null);
        }
      } catch {
        // Transient poll failure — try again next tick
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
    if (ok) {
      shownAlertId.current = null;
      setAlert(null);
    }
  };

  const handleCallEmergencyServices = async () => {
    if (!alert) return;
    setCalling(true);
    try {
      await logEmergencyCall(alert.elderlyId, alert.id);
      setAlert((prev) => (prev ? { ...prev, emergencyCallLoggedAt: new Date().toISOString() } : null));
      await Linking.openURL('tel:115');
    } catch (e) {
      console.warn('[SosAlertOverlay.handleCallEmergencyServices]', e);
    } finally {
      setCalling(false);
    }
  };

  if (!alert) return null;

  const isLevel2 = alert.escalationLevel >= 2;
  const isLevel1 = alert.escalationLevel === 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, isLevel2 && styles.cardLevel2, isLevel1 && styles.cardLevel1]}>
          <View style={[styles.iconCircle, isLevel2 ? styles.iconCircleLevel2 : isLevel1 ? styles.iconCircleLevel1 : null]}>
            <Ionicons
              name={isLevel2 ? 'alert-circle' : isLevel1 ? 'warning' : 'notifications'}
              size={40}
              color="#FFFFFF"
            />
          </View>

          {isLevel2 ? (
            <View style={styles.levelBadgeLevel2}>
              <Text style={styles.levelBadgeText}>CẤP ĐỘ 2: KHẨN CẤP (10+ PHÚT CHƯA XỬ LÝ)</Text>
            </View>
          ) : isLevel1 ? (
            <View style={styles.levelBadgeLevel1}>
              <Text style={styles.levelBadgeText}>CẤP ĐỘ 1: CHƯA PHẢN HỒI (3+ PHÚT)</Text>
            </View>
          ) : null}

          <Text style={[styles.title, isLevel2 && styles.titleLevel2]}>
            {isLevel2 ? 'Báo động đỏ chưa xử lý!' : isLevel1 ? 'Nhắc nhở khẩn cấp!' : 'Cảnh báo khẩn cấp!'}
          </Text>

          <Text style={styles.subtitle}>
            {isLevel2
              ? `${alert.elderlyName || 'Người thân'} đã nhấn SOS hơn 10 phút nhưng chưa ai xác nhận!\nVui lòng liên hệ hoặc bấm gọi cấp cứu 115 ngay!`
              : isLevel1
                ? `${alert.elderlyName || 'Người thân'} đã nhấn SOS 3 phút trước và chưa có phản hồi.\nHãy kiểm tra hoặc liên hệ ngay!`
                : `${alert.elderlyName || 'Người thân'} vừa nhấn nút SOS.\nHãy liên hệ hoặc kiểm tra ngay!`}
          </Text>

          {alert.emergencyCallLoggedAt && (
            <View style={styles.callLoggedBox}>
              <Ionicons name="call" size={16} color="#00796B" />
              <Text style={styles.callLoggedText}>Đã ghi nhận gọi cấp cứu 115</Text>
            </View>
          )}

          {isLevel2 && (
            <TouchableOpacity
              style={styles.call115Btn}
              onPress={handleCallEmergencyServices}
              disabled={calling}
              activeOpacity={0.85}
            >
              {calling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="call" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.call115BtnText}>Gọi cấp cứu 115 (Một chạm)</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.ackBtn, isLevel2 && styles.ackBtnSecondary]}
            onPress={handleAcknowledge}
            disabled={acking}
            activeOpacity={0.85}
          >
            {acking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.ackBtnText, isLevel2 && styles.ackBtnTextSecondary]}>
                Đã biết, xác nhận an toàn
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardLevel1: {
    borderWidth: 2,
    borderColor: '#FFA000',
  },
  cardLevel2: {
    borderWidth: 2.5,
    borderColor: '#D32F2F',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconCircleLevel1: {
    backgroundColor: '#F57C00',
  },
  iconCircleLevel2: {
    backgroundColor: '#B71C1C',
  },
  levelBadgeLevel1: {
    backgroundColor: 'rgba(245, 124, 0, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  levelBadgeLevel2: {
    backgroundColor: 'rgba(211, 47, 47, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D32F2F',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#E53935',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleLevel2: {
    color: '#B71C1C',
  },
  subtitle: {
    fontSize: 14.5,
    color: '#37404A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  callLoggedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    gap: 6,
  },
  callLoggedText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#00796B',
  },
  call115Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  call115BtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15.5,
  },
  ackBtn: {
    backgroundColor: '#12A79C',
    borderRadius: 9999,
    paddingVertical: 13,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  ackBtnSecondary: {
    backgroundColor: '#ECEFF1',
  },
  ackBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
  },
  ackBtnTextSecondary: {
    color: '#37474F',
  },
});
