import {
  getAppointments,
  getCameras,
  getCheckIns,
  getElderly,
  getEmergencies,
  getFamilyLinks,
  getHealthMetrics,
  getMedications,
  getNotifications,
} from '../api';
import { Badge } from '../components';
import {
  apptLabel,
  consentLabel,
  emergencyLabel,
  formatDate,
  formatDateTime,
  metricLabel,
  moodLabel,
  notifLabel,
  statusLabel,
} from '../format';
import { ResourceListPage } from '../ResourceListPage';

type PageProps = { onSessionExpired: () => void };

const opt = (value: string, label: string) => ({ value, label });

export function ElderlyPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Người cao tuổi"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getElderly({ page: p.page })}
      rowKey={(r) => r.profileId}
      emptyText="Chưa có hồ sơ người cao tuổi."
      columns={[
        { header: 'Tên', cell: (r) => r.name ?? `#${r.userId}` },
        { header: 'SĐT', cell: (r) => r.phone ?? '—' },
        { header: 'Ngày sinh', cell: (r) => formatDate(r.dob) },
        {
          header: 'Bệnh nền',
          cell: (r) => (r.healthConditions?.length ? r.healthConditions.join(', ') : '—'),
        },
        { header: 'Nhóm máu', cell: (r) => r.bloodType ?? '—' },
        {
          header: 'Đồng ý camera',
          cell: (r) => (
            <Badge kind={r.cameraConsentStatus === 'ACCEPTED' ? 'active' : 'pending'}>
              {consentLabel(r.cameraConsentStatus)}
            </Badge>
          ),
        },
      ]}
    />
  );
}

export function FamilyLinksPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Liên kết gia đình"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getFamilyLinks({ status: p.filters.status, page: p.page })}
      rowKey={(r) => r.id}
      emptyText="Chưa có liên kết nào."
      filters={[
        {
          key: 'status',
          options: [
            opt('', 'Tất cả'),
            opt('PENDING', 'Chờ duyệt'),
            opt('ACTIVE', 'Đang hoạt động'),
            opt('REVOKED', 'Đã huỷ'),
          ],
        },
      ]}
      columns={[
        { header: 'Người cao tuổi', cell: (r) => r.elderlyName ?? `#${r.elderlyId}` },
        {
          header: 'Người thân',
          cell: (r) => (
            <>
              {r.familyName ?? `#${r.familyId}`}
              <div className="muted small">{r.familyPhone ?? ''}</div>
            </>
          ),
        },
        { header: 'Quan hệ', cell: (r) => r.relationship ?? '—' },
        {
          header: 'Trạng thái',
          cell: (r) => (
            <Badge kind={r.status === 'ACTIVE' ? 'active' : 'pending'}>
              {statusLabel(r.status ?? '')}
            </Badge>
          ),
        },
        { header: 'Sẵn sàng', cell: (r) => (r.availabilityStatus === 'FREE' ? 'Rảnh' : 'Bận') },
        { header: 'Tạo lúc', cell: (r) => formatDateTime(r.createdAt) },
      ]}
    />
  );
}

export function EmergenciesPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Sự cố SOS"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getEmergencies({ status: p.filters.status, page: p.page })}
      rowKey={(r) => r.id}
      emptyText="Chưa ghi nhận sự cố SOS nào."
      filters={[
        {
          key: 'status',
          options: [
            opt('', 'Tất cả'),
            opt('ACTIVE', 'Đang mở'),
            opt('RESOLVED', 'Đã xử lý'),
            opt('FALSE_ALARM', 'Báo nhầm'),
            opt('CANCELLED', 'Đã huỷ'),
          ],
        },
      ]}
      columns={[
        { header: 'Người cao tuổi', cell: (r) => r.elderlyName ?? `#${r.elderlyId}` },
        {
          header: 'Trạng thái',
          cell: (r) => (
            <Badge kind={r.status === 'ACTIVE' ? 'cancelled' : 'active'}>
              {emergencyLabel(r.status)}
            </Badge>
          ),
        },
        { header: 'Cấp độ', cell: (r) => `CĐ ${r.escalationLevel}` },
        { header: 'Kích hoạt', cell: (r) => formatDateTime(r.triggeredAt) },
        { header: 'Xác nhận', cell: (r) => formatDateTime(r.acknowledgedAt) },
        { header: 'Gọi 115', cell: (r) => (r.emergencyCallLoggedAt ? '✓' : '—') },
        { header: 'Xử lý xong', cell: (r) => formatDateTime(r.resolvedAt) },
      ]}
    />
  );
}

export function CheckInsPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Check-in hằng ngày"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getCheckIns({ page: p.page })}
      rowKey={(r) => r.id}
      emptyText="Chưa có check-in nào."
      columns={[
        { header: 'Người cao tuổi', cell: (r) => r.elderlyName ?? `#${r.elderlyId}` },
        { header: 'Tâm trạng', cell: (r) => moodLabel(r.mood) },
        { header: 'Nguồn', cell: (r) => r.source ?? '—' },
        { header: 'Ghi chú', cell: (r) => r.note ?? '—' },
        { header: 'Thời điểm', cell: (r) => formatDateTime(r.createdAt) },
      ]}
    />
  );
}

export function MedicationsPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Thuốc"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getMedications({ page: p.page })}
      rowKey={(r) => r.id}
      emptyText="Chưa có thuốc nào."
      columns={[
        { header: 'Người cao tuổi', cell: (r) => r.elderlyName ?? `#${r.elderlyId}` },
        { header: 'Tên thuốc', cell: (r) => r.name },
        { header: 'Liều', cell: (r) => r.dosage ?? '—' },
        { header: 'Hướng dẫn', cell: (r) => r.instructions ?? '—' },
        { header: 'Nhắc bằng giọng nói', cell: (r) => (r.hasVoiceReminder ? '🔊' : '—') },
        { header: 'Liều kế tiếp', cell: (r) => formatDateTime(r.nextDoseTime) },
      ]}
    />
  );
}

export function HealthMetricsPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Chỉ số sức khỏe"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getHealthMetrics({ type: p.filters.type, page: p.page })}
      rowKey={(r) => r.id}
      emptyText="Chưa có chỉ số nào."
      filters={[
        {
          key: 'type',
          options: [
            opt('', 'Tất cả'),
            opt('BLOOD_PRESSURE', 'Huyết áp'),
            opt('HEART_RATE', 'Nhịp tim'),
            opt('BLOOD_GLUCOSE', 'Đường huyết'),
            opt('WEIGHT', 'Cân nặng'),
            opt('TEMPERATURE', 'Nhiệt độ'),
            opt('SPO2', 'SpO₂'),
          ],
        },
      ]}
      columns={[
        { header: 'Người cao tuổi', cell: (r) => r.elderlyName ?? `#${r.elderlyId}` },
        { header: 'Loại', cell: (r) => metricLabel(r.type) },
        {
          header: 'Giá trị',
          align: 'right',
          cell: (r) =>
            r.valueSecondary != null ? `${r.value}/${r.valueSecondary} ${r.unit ?? ''}` : `${r.value ?? '—'} ${r.unit ?? ''}`,
        },
        { header: 'Ghi lúc', cell: (r) => formatDateTime(r.recordedAt) },
      ]}
    />
  );
}

export function CamerasPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Camera"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getCameras({ page: p.page })}
      rowKey={(r) => r.id}
      emptyText="Chưa có thiết bị camera nào."
      columns={[
        { header: 'Người cao tuổi', cell: (r) => r.elderlyName ?? `#${r.elderlyId}` },
        { header: 'Nhãn', cell: (r) => r.label ?? '—' },
        { header: 'Serial', cell: (r) => r.deviceSn ?? '—' },
        {
          header: 'Trạng thái',
          cell: (r) => (
            <Badge kind={r.status === 'ONLINE' ? 'active' : 'cancelled'}>{r.status ?? '—'}</Badge>
          ),
        },
        {
          header: 'Chế độ riêng tư',
          cell: (r) => (r.privacyMode ? `Bật${r.privacyModeExpiresAt ? ' (hẹn giờ)' : ''}` : 'Tắt'),
        },
        { header: 'Phát hiện c.động', cell: (r) => (r.motionDetectionEnabled ? '✓' : '—') },
        { header: 'Thấy lần cuối', cell: (r) => formatDateTime(r.lastSeenAt) },
      ]}
    />
  );
}

export function NotificationsPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Thông báo"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getNotifications({ type: p.filters.type, page: p.page })}
      rowKey={(r) => r.id}
      emptyText="Chưa có thông báo nào."
      filters={[
        {
          key: 'type',
          options: [
            opt('', 'Tất cả'),
            opt('EMERGENCY', 'Khẩn cấp'),
            opt('MEDICATION_REMINDER', 'Nhắc thuốc'),
            opt('HEALTH_ALERT', 'Cảnh báo SK'),
            opt('APPOINTMENT_REMINDER', 'Lịch hẹn'),
            opt('FAMILY_UPDATE', 'Gia đình'),
          ],
        },
      ]}
      columns={[
        { header: 'Người nhận', cell: (r) => r.userName ?? `#${r.userId}` },
        { header: 'Loại', cell: (r) => notifLabel(r.type) },
        { header: 'Tiêu đề', cell: (r) => r.title ?? '—' },
        { header: 'Đã đọc', cell: (r) => (r.read ? '✓' : '—') },
        { header: 'Thời điểm', cell: (r) => formatDateTime(r.createdAt) },
      ]}
    />
  );
}

export function AppointmentsPage({ onSessionExpired }: PageProps) {
  return (
    <ResourceListPage
      title="Lịch hẹn khám"
      onSessionExpired={onSessionExpired}
      fetcher={(p) => getAppointments({ status: p.filters.status, page: p.page })}
      rowKey={(r) => r.id}
      emptyText="Chưa có lịch hẹn nào."
      filters={[
        {
          key: 'status',
          options: [
            opt('', 'Tất cả'),
            opt('SCHEDULED', 'Đã lên lịch'),
            opt('COMPLETED', 'Hoàn thành'),
            opt('MISSED', 'Bỏ lỡ'),
            opt('CANCELLED', 'Đã huỷ'),
          ],
        },
      ]}
      columns={[
        { header: 'Người cao tuổi', cell: (r) => r.elderlyName ?? `#${r.elderlyId}` },
        { header: 'Bác sĩ', cell: (r) => r.doctor ?? '—' },
        { header: 'Chuyên khoa', cell: (r) => r.specialty ?? '—' },
        { header: 'Địa điểm', cell: (r) => r.location ?? '—' },
        { header: 'Trạng thái', cell: (r) => <Badge kind={r.status ?? ''}>{apptLabel(r.status)}</Badge> },
        { header: 'Thời gian', cell: (r) => formatDateTime(r.datetime) },
      ]}
    />
  );
}
