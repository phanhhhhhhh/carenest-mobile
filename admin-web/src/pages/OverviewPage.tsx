import { useCallback, useEffect, useState } from 'react';
import { ApiError, getOverview } from '../api';
import { PageHeader, StatCard, StateBlock } from '../components';
import { formatNumber, formatVnd, planLabel, roleLabel } from '../format';
import type { Overview } from '../types';

export function OverviewPage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getOverview());
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return onSessionExpired();
      setError(e instanceof ApiError ? e.message : 'Không tải được số liệu.');
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Tổng quan"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
            Làm mới
          </button>
        }
      />
      <StateBlock
        loading={loading && !data}
        error={data ? null : error}
        empty={false}
        emptyText=""
        onRetry={() => void load()}
      >
        {data && (
          <>
            <div className="stat-grid">
              <StatCard label="Tổng người dùng" value={formatNumber(data.totalUsers)} />
              <StatCard
                label="Hồ sơ người cao tuổi"
                value={formatNumber(data.elderlyProfiles)}
              />
              <StatCard
                label="Liên kết gia đình"
                value={formatNumber(data.activeFamilyLinks)}
                hint={`${formatNumber(data.pendingFamilyLinks)} đang chờ duyệt`}
              />
              <StatCard
                label="Gói đang hoạt động"
                value={formatNumber(data.activeSubscriptions)}
                hint={`${formatNumber(data.cancelledSubscriptions)} đã huỷ`}
              />
              <StatCard
                label="Doanh thu (gói đang chạy)"
                value={formatVnd(data.activeSubscriptionRevenue)}
              />
              <StatCard
                label="Thanh toán chờ duyệt"
                value={formatNumber(data.pendingPayments)}
                hint={data.pendingPayments > 0 ? 'Cần xử lý' : undefined}
              />
              <StatCard label="Check-in hôm nay" value={formatNumber(data.checkInsToday)} />
              <StatCard
                label="SOS đang mở"
                value={formatNumber(data.activeEmergencies)}
                hint={data.activeEmergencies > 0 ? '⚠ Đang có sự cố' : undefined}
              />
            </div>

            <div className="two-col">
              <div className="card">
                <h2>Người dùng theo vai trò</h2>
                <table className="mini-table">
                  <tbody>
                    {Object.entries(data.usersByRole).map(([role, count]) => (
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
                    {Object.entries(data.subscriptionsByPlan)
                      .filter(([, count]) => count > 0)
                      .map(([plan, count]) => (
                        <tr key={plan}>
                          <td>{planLabel(plan)}</td>
                          <td className="num">{formatNumber(count)}</td>
                        </tr>
                      ))}
                    {Object.values(data.subscriptionsByPlan).every((c) => c === 0) && (
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
      </StateBlock>
    </>
  );
}
