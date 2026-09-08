import { PageHeader, StatCard } from '../components';
import { formatNumber, formatVnd, planLabel, roleLabel } from '../format';
import type { Overview } from '../types';

export function OverviewPage({
  overview,
  onReload,
}: {
  overview: Overview | null;
  onReload: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Tổng quan"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={onReload}>
            Làm mới
          </button>
        }
      />

      {!overview ? (
        <div className="card block muted">Đang tải…</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Tổng người dùng" value={formatNumber(overview.totalUsers)} />
            <StatCard label="Hồ sơ người cao tuổi" value={formatNumber(overview.elderlyProfiles)} />
            <StatCard
              label="Liên kết gia đình"
              value={formatNumber(overview.activeFamilyLinks)}
              hint={`${formatNumber(overview.pendingFamilyLinks)} chờ duyệt`}
            />
            <StatCard
              label="Gói đang hoạt động"
              value={formatNumber(overview.activeSubscriptions)}
              hint={`${formatNumber(overview.cancelledSubscriptions)} đã huỷ`}
            />
            <StatCard
              label="Doanh thu (gói đang chạy)"
              value={formatVnd(overview.activeSubscriptionRevenue)}
            />
            <StatCard
              label="Thanh toán chờ duyệt"
              value={formatNumber(overview.pendingPayments)}
              hint={overview.pendingPayments > 0 ? 'Cần xử lý' : undefined}
            />
            <StatCard
              label="SOS đang mở"
              value={formatNumber(overview.activeEmergencies)}
              hint={overview.activeEmergencies > 0 ? '⚠ Đang có sự cố' : undefined}
            />
            <StatCard label="Check-in hôm nay" value={formatNumber(overview.checkInsToday)} />
            <StatCard label="Thuốc đang quản lý" value={formatNumber(overview.medications)} />
            <StatCard label="Lịch hẹn" value={formatNumber(overview.appointments)} />
            <StatCard
              label="Camera"
              value={formatNumber(overview.camerasTotal)}
              hint={`${formatNumber(overview.camerasOnline)} đang online`}
            />
            <StatCard
              label="Chỉ số SK (7 ngày)"
              value={formatNumber(overview.healthMetrics7d)}
            />
            <StatCard label="Tin nhắn AI hôm nay" value={formatNumber(overview.chatMessagesToday)} />
            <StatCard label="Thông báo (7 ngày)" value={formatNumber(overview.notifications7d)} />
          </div>

          <div className="two-col">
            <div className="card">
              <h2>Người dùng theo vai trò</h2>
              <table className="mini-table">
                <tbody>
                  {Object.entries(overview.usersByRole).map(([role, count]) => (
                    <tr key={role}>
                      <td>{roleLabel(role)}</td>
                      <td className="num">{formatNumber(count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h2>Gói đang hoạt động theo loại</h2>
              <table className="mini-table">
                <tbody>
                  {Object.entries(overview.subscriptionsByPlan)
                    .filter(([, count]) => count > 0)
                    .map(([plan, count]) => (
                      <tr key={plan}>
                        <td>{planLabel(plan)}</td>
                        <td className="num">{formatNumber(count)}</td>
                      </tr>
                    ))}
                  {Object.values(overview.subscriptionsByPlan).every((c) => c === 0) && (
                    <tr>
                      <td className="muted" colSpan={2}>
                        Chưa có gói nào đang hoạt động
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
