import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, confirmPayment, getPendingPayments, rejectPayment } from '../api';
import { PageHeader, StateBlock } from '../components';
import { formatDateTime, formatVnd, planLabel } from '../format';
import type { PendingPayment } from '../types';

type Toast = { kind: 'ok' | 'err'; text: string };
// Only these actually changed the row. ALREADY_ACTIVE / NOT_PENDING are the server's
// *refusal* codes — fall through to the error branch so the console doesn't claim
// success and desync from the database.
const HANDLED = new Set(['ACTIVATED', 'REJECTED']);

export function PaymentsPage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [rows, setRows] = useState<PendingPayment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const flash = useCallback((t: Toast) => {
    setToast(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await getPendingPayments());
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return onSessionExpired();
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách.');
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
        setRows((prev) => (prev ?? []).filter((r) => r.transactionId !== row.transactionId));
        flash({ kind: 'ok', text: okText });
      } else {
        flash({ kind: 'err', text: result.message || 'Giao dịch không còn ở trạng thái chờ.' });
        await load();
      }
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return onSessionExpired();
      flash({ kind: 'err', text: e instanceof ApiError ? e.message : 'Thao tác thất bại.' });
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Duyệt thanh toán"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
            Làm mới
          </button>
        }
      />

      {toast && <div className={`toast toast-${toast.kind}`}>{toast.text}</div>}

      <StateBlock
        loading={loading && !rows}
        error={rows ? null : error}
        empty={!!rows && rows.length === 0}
        emptyText="Không có giao dịch nào đang chờ duyệt."
        onRetry={() => void load()}
      >
        {rows && rows.length > 0 && (
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
                      <td className="muted">{formatDateTime(r.createdAt)}</td>
                      <td className="txn">{r.transactionId}</td>
                      <td className="actions-col">
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={busy}
                          onClick={() => void act(r, rejectPayment, 'Đã từ chối giao dịch.')}
                        >
                          Từ chối
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
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
      </StateBlock>
    </>
  );
}
