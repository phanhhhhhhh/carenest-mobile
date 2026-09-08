import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, getUsers } from '../api';
import { Badge, PageHeader, Pagination, StateBlock } from '../components';
import { formatDateTime, roleLabel } from '../format';
import type { AdminUserRow, Page } from '../types';

const ROLE_FILTERS = ['', 'ELDERLY', 'FAMILY', 'ADMIN'] as const;

export function UsersPage({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [role, setRole] = useState<string>('');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

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
                  <tr key={u.id}>
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
    </>
  );
}
