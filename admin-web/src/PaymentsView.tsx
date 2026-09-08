import { useCallback, useEffect, useState } from 'react';
import { ApiError, confirmPayment, getPendingPayments, rejectPayment } from './api';
import { formatDateTime, formatVnd, planLabel } from './format';
import type { PendingPayment } from './types';

type Toast = { kind: 'ok' | 'err'; text: string };

const HANDLED = new Set(['ACTIVATED', 'ALREADY_ACTIVE', 'REJECTED', 'NOT_PENDING']);

export function PaymentsView({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [rows, setRows] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const flash = useCallback((t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getPendingPayments());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách.');
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    row: PendingPayment,
    fn: (txn: string) => Promise<{ status: string; message: string }>,
    okText: string,
  ) => {
    setActingId(row.transactionId);
    try {
      const result = await fn(row.transactionId);
      if (HANDLED.has(result.status)) {
        setRows((prev) => prev.filter((r) => r.transactionId !== row.transactionId));
        flash({ kind: 'ok', text: okText });
      } else {
        flash({ kind: 'err', text: result.message || 'Giao dịch không còn ở trạng thái chờ.' });
        await load();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired();
        return;
      }
      flash({ kind: 'err', text: err instanceof ApiError ? err.message : 'Thao tác thất bại.' });
    } finally {
      setActingId(null);
    }
  };

  return (
    <section>
      <div className="section-head">
        <h2>
          Đang chờ duyệt
          {!loading && <span className="count">{rows.length}</span>}
        </h2>
        <button className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
          {loading ? 'Đang tải…' : 'Làm mới'}
        </button>
      </div>

      {toast && <div className={`toast toast-${toast.kind}`}>{toast.text}</div>}

      {error ? (
        <div className="card empty">
          <p className="error">{error}</p>
          <button className="btn btn-primary" onClick={() => void load()}>
            Thử lại
          </button>
        </div>
      ) : loading ? (
        <div className="card empty muted">Đang tải…</div>
      ) : rows.length === 0 ? (
        <div className="card empty muted">Không có giao dịch nào đang chờ.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Gói</th>
                <th className="num">Số tiền</th>
                <th>Kênh</th>
                <th>Thời điểm</th>
                <th>Mã giao dịch</th>
                <th className="actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const busy = actingId === r.transactionId;
                return (
                  <tr key={r.transactionId} className={busy ? 'busy' : undefined}>
                    <td>{r.userName ?? `#${r.userId ?? '?'}`}</td>
                    <td>{planLabel(r.planType)}</td>
                    <td className="num">{formatVnd(r.amount)}</td>
                    <td>{r.provider ?? '—'}</td>
                    <td>{formatDateTime(r.createdAt)}</td>
                    <td className="txn">{r.transactionId}</td>
                    <td className="actions-col">
                      <button
                        className="btn btn-danger"
                        disabled={busy}
                        onClick={() => void act(r, rejectPayment, 'Đã từ chối giao dịch.')}
                      >
                        Từ chối
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={() => void act(r, confirmPayment, 'Đã kích hoạt Premium.')}
                      >
                        {busy ? '…' : 'Xác nhận'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
