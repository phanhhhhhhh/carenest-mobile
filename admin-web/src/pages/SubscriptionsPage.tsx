import { useCallback, useEffect, useState } from 'react';
import { ApiError, getSubscriptions } from '../api';
import { Badge, PageHeader, Pagination, StateBlock } from '../components';
import { formatDate, formatDateTime, formatVnd, planLabel, statusLabel } from '../format';
import type { AdminSubscriptionRow, Page } from '../types';

const STATUS_FILTERS = ['', 'ACTIVE', 'PENDING', 'CANCELLED', 'EXPIRED'] as const;

export function SubscriptionsPage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<Page<AdminSubscriptionRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getSubscriptions({ status: status || undefined, page }));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return onSessionExpired();
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách.');
    } finally {
      setLoading(false);
    }
  }, [status, page, onSessionExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title="Gói đăng ký" />

      <div className="toolbar">
        <div className="segmented">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              className={status === s ? 'active' : ''}
              onClick={() => {
                setPage(0);
                setStatus(s);
              }}
            >
              {s ? statusLabel(s) : 'Tất cả'}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
          Làm mới
        </button>
      </div>

      <StateBlock
        loading={loading && !data}
        error={data ? null : error}
        empty={!!data && data.content.length === 0}
        emptyText="Không có gói đăng ký nào."
        onRetry={() => void load()}
      >
        {data && data.content.length > 0 && (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Gói</th>
                  <th>Trạng thái</th>
                  <th className="num">Số tiền</th>
                  <th>Kênh</th>
                  <th>Bắt đầu</th>
                  <th>Hết hạn</th>
                  <th>Mã giao dịch</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div>{s.userName ?? `#${s.userId ?? '?'}`}</div>
                      <div className="muted small">{s.userPhone ?? ''}</div>
                    </td>
                    <td>{planLabel(s.planType)}</td>
                    <td>
                      <Badge kind={s.status}>{statusLabel(s.status)}</Badge>
                    </td>
                    <td className="num">{formatVnd(s.amount)}</td>
                    <td>{s.paymentProvider ?? '—'}</td>
                    <td className="muted">{formatDateTime(s.startDate)}</td>
                    <td className="muted">{formatDate(s.endDate)}</td>
                    <td className="txn">{s.transactionId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data} onPage={setPage} />}
      </StateBlock>
    </>
  );
}
