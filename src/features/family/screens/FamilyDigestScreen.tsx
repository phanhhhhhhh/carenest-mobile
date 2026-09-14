import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { Shadows } from '../../../core/theme/spacing';
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
  const elderlyName =
    dashboardData && dashboardData.linkedElderly.length > 0
      ? (dashboardData.linkedElderly[dashboardData.selectedIndex]?.elderlyName ?? 'người thân')
      : 'người thân';

  const latest = useFamilyDigestStore((s) => s.latest);
  const isLoading = useFamilyDigestStore((s) => s.isLoading);
  const isGenerating = useFamilyDigestStore((s) => s.isGenerating);
  const error = useFamilyDigestStore((s) => s.error);
  const loadLatest = useFamilyDigestStore((s) => s.loadLatest);
  const generateNow = useFamilyDigestStore((s) => s.generateNow);

  const [refreshing, setRefreshing] = useState(false);

  useMountEffect(() => {
    loadDashboard();
  });

  useEffect(() => {
    loadLatest(elderlyId);
  }, [elderlyId, loadLatest]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLatest(elderlyId);
    setRefreshing(false);
  };

  const handleGenerate = async () => {
    if (!elderlyId) return;
    await generateNow(elderlyId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bản tin gia đình</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Banner Card */}
        <View style={styles.heroCard}>
          <Image
            source={require('../../../../assets/mascot/mascot_cap_thumbsup.jpg')}
            style={styles.heroMascot}
            resizeMode="contain"
          />
          <View style={styles.heroTextWrap}>
            <View style={styles.heroTag}>
              <Ionicons name="sparkles" size={12} color="#4338CA" />
              <Text style={styles.heroTagText}>TỰ ĐỘNG LÚC 20:00</Text>
            </View>
            <Text style={styles.heroTitle}>Bản Tin Cuối Ngày</Text>
            <Text style={styles.heroSubtitle}>
              Tổng hợp một ngày của {elderlyName} bằng lời nhắn ấm áp, thân tình.
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading && !latest ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Đang tải bản tin gia đình...</Text>
          </View>
        ) : latest ? (
          <View style={styles.letterCard}>
            <View style={styles.letterHeader}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#6366F1" />
                <Text style={styles.dateText}>{latest.title}</Text>
              </View>
              {latest.quietDay ? (
                <View style={styles.peaceBadge}>
                  <Text style={styles.peaceBadgeText}>🌿 Một ngày bình yên</Text>
                </View>
              ) : (
                <View style={styles.storyBadge}>
                  <Text style={styles.storyBadgeText}>✨ Đã cập nhật</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <Text style={styles.letterBody}>{latest.body}</Text>

            <View style={styles.letterFooter}>
              <Text style={styles.footerNote}>
                {latest.createdAt
                  ? `Biên soạn tự động ${latest.date ? new Date(latest.date).toLocaleDateString('vi-VN') : ''} lúc ${new Date(latest.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Biên soạn tự động bởi AI CareNest'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="moon-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Chưa có bản tin nào</Text>
            <Text style={styles.emptyDesc}>
              Bản tin gia đình sẽ được hệ thống tự động tổng hợp và gửi đến tất cả người thân vào
              lúc 20:00 tối mỗi ngày.
            </Text>
          </View>
        )}

        <View style={{ height: 8 }} />

        {/* Manual Trigger Button */}
        <TouchableOpacity
          style={[styles.generateButton, (isGenerating || !elderlyId) && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating || !elderlyId}
          activeOpacity={0.85}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.generateButtonText}>
            {isGenerating ? 'Đang tổng hợp bản tin...' : 'Tạo bản tin hôm nay ngay'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.tipText}>
          💡 Bạn có thể bấm nút trên để tạo bản tin tóm tắt sớm mà không cần đợi đến 20:00 tối.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    ...Shadows.sm,
  },
  heroMascot: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  heroTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#4338CA',
    marginTop: 2,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  letterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  letterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dateText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  peaceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  peaceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  storyBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  storyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  letterBody: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  letterFooter: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    alignItems: 'flex-end',
  },
  footerNote: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    ...Shadows.sm,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  tipText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
});
