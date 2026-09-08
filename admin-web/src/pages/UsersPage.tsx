import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, getUserDetail, getUsers } from '../api';
import { Badge, PageHeader, Pagination, StateBlock } from '../components';
import { formatDate, formatDateTime, formatVnd, planLabel, roleLabel, statusLabel } from '../format';
import type { AdminUserDetail, AdminUserRow, Page } from '../types';

const ROLE_FILTERS = ['', 'ELDERLY', 'FAMILY', 'ADMIN'] as const;

export function UsersPage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [role, setRole] = useState<string>('');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const [data, setData] = useState<Page<AdminUserRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getUsers({ role: role || undefined, query: query || undefined, page }));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return onSessionExpired();
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách.');
    } finally {
      setLoading(false);
    }
  }, [role, query, page, onSessionExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    setQuery(queryInput.trim());
  };

  return (
    <>
      <PageHeader title="Người dùng" />

      <form className="toolbar" onSubmit={onSearch}>
        <div className="segmented">
          {ROLE_FILTERS.map((r) => (
            <button
              type="button"
              key={r || 'all'}
              className={role === r ? 'active' : ''}
              onClick={() => {
                setPage(0);
                setRole(r);
              }}
            >
              {r ? roleLabel(r) : 'Tất cả'}
            </button>
          ))}
        </div>
        <input
          className="search"
          placeholder="Tìm theo tên, SĐT, email…"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" type="submit">
          Tìm
        </button>
      </form>

      <StateBlock
        loading={loading && !data}
        error={data ? null : error}
        empty={!!data && data.content.length === 0}
        emptyText="Không tìm thấy người dùng nào."
        onRetry={() => void load()}
      >
        {data && data.content.length > 0 && (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Số điện thoại</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Xác thực</th>
                  <th>Tạo lúc</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((u) => (
                  <tr
                    key={u.id}
                    className="clickable"
                    onClick={() => setSelected(u.id)}
                    title="Xem chi tiết"
                  >
                    <td className="muted">{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.phone ?? '—'}</td>
                    <td className="muted">{u.email ?? '—'}</td>
                    <td>
                      <Badge kind={u.role}>{roleLabel(u.role)}</Badge>
                    </td>
                    <td>{u.emailVerified ? '✓' : '—'}</td>
                    <td className="muted">{formatDateTime(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data} onPage={setPage} />}
      </StateBlock>

      {selected != null && (
        <UserDetailDrawer
          userId={selected}
          onClose={() => setSelected(null)}
          onSessionExpired={onSessionExpired}
        />
      )}
    </>
  );
}

function UserDetailDrawer({
  userId,
  onClose,
  onSessionExpired,
}: {
  userId: number;
  onClose: () => void;
  onSessionExpired: () => void;
}) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUserDetail(userId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return onSessionExpired();
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Không tải được chi tiết.');
      });
    return () => {
      cancelled = true;
    };
  }, [userId, onSessionExpired]);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Chi tiết người dùng</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>

        {error ? (
          <p className="error">{error}</p>
        ) : !detail ? (
          <p className="muted">Đang tải…</p>
        ) : (
          <div className="drawer-body">
            <section>
              <h3>{detail.user.name}</h3>
              <dl className="kv">
                <dt>ID</dt>
                <dd>{detail.user.id}</dd>
                <dt>Vai trò</dt>
                <dd>
                  <Badge kind={detail.user.role}>{roleLabel(detail.user.role)}</Badge>
                </dd>
                <dt>SĐT</dt>
                <dd>{detail.user.phone ?? '—'}</dd>
                <dt>Email</dt>
                <dd>{detail.user.email ?? '—'}</dd>
                <dt>Xác thực</dt>
                <dd>{detail.user.emailVerified ? 'Đã xác thực' : 'Chưa'}</dd>
                <dt>Premium (nhóm)</dt>
                <dd>{detail.groupPremium ? 'Có' : 'Không'}</dd>
                <dt>Tạo lúc</dt>
                <dd>{formatDateTime(detail.user.createdAt)}</dd>
              </dl>
            </section>

            {detail.activeSubscription && (
              <section>
                <h3>Gói đang hoạt động</h3>
                <dl className="kv">
                  <dt>Gói</dt>
                  <dd>{planLabel(detail.activeSubscription.planType)}</dd>
                  <dt>Số tiền</dt>
                  <dd>{formatVnd(detail.activeSubscription.amount)}</dd>
                  <dt>Hết hạn</dt>
                  <dd>{formatDate(detail.activeSubscription.endDate)}</dd>
                </dl>
              </section>
            )}

            {detail.elderlyProfile && (
              <section>
                <h3>Hồ sơ sức khỏe</h3>
                <dl className="kv">
                  <dt>Bệnh nền</dt>
                  <dd>{detail.elderlyProfile.healthConditions?.join(', ') || '—'}</dd>
                  <dt>Dị ứng</dt>
                  <dd>{detail.elderlyProfile.allergies || '—'}</dd>
                  <dt>Nhóm máu</dt>
                  <dd>{detail.elderlyProfile.bloodType || '—'}</dd>
                  <dt>Đồng ý camera</dt>
                  <dd>{detail.elderlyProfile.cameraConsentStatus ?? '—'}</dd>
                </dl>
              </section>
            )}

            <section>
              <h3>Liên kết ({detail.familyLinks.length})</h3>
              {detail.familyLinks.length === 0 ? (
                <p className="muted">Chưa có liên kết.</p>
              ) : (
                <ul className="link-list">
                  {detail.familyLinks.map((l) => (
                    <li key={l.id}>
                      {detail.user.role === 'ELDERLY' ? l.familyName : l.elderlyName}
                      {' · '}
                      {l.relationship ?? '—'}
                      {' · '}
                      <Badge kind={l.status === 'ACTIVE' ? 'active' : 'pending'}>
                        {statusLabel(l.status ?? '')}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
