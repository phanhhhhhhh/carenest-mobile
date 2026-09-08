import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';
import { PageHeader, Pagination, StateBlock } from './components';
import type { Page } from './types';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

export interface FilterDef {
  key: string;
  options: { value: string; label: string }[];
}

export interface FetchParams {
  page: number;
  query: string;
  filters: Record<string, string>;
}

export function ResourceListPage<T>({
  title,
  onSessionExpired,
  columns,
  filters = [],
  searchable = false,
  searchPlaceholder = 'Tìm…',
  fetcher,
  rowKey,
  emptyText = 'Không có dữ liệu.',
  headerActions,
}: {
  title: string;
  onSessionExpired: () => void;
  columns: Column<T>[];
  filters?: FilterDef[];
  searchable?: boolean;
  searchPlaceholder?: string;
  fetcher: (params: FetchParams) => Promise<Page<T>>;
  rowKey: (row: T) => string | number;
  emptyText?: string;
  headerActions?: ReactNode;
}) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<Page<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher({ page, query, filters: filterValues }));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return onSessionExpired();
      setError(e instanceof ApiError ? e.message : 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, query, filterValues, onSessionExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  const setFilter = (key: string, value: string) => {
    setPage(0);
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    setQuery(queryInput.trim());
  };

  const hasToolbar = filters.length > 0 || searchable;

  return (
    <>
      <PageHeader
        title={title}
        actions={
          <>
            {headerActions}
            <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
              Làm mới
            </button>
          </>
        }
      />

      {hasToolbar && (
        <form className="toolbar" onSubmit={onSearch}>
          {filters.map((f) => (
            <div className="segmented" key={f.key}>
              {f.options.map((opt) => (
                <button
                  type="button"
                  key={opt.value || 'all'}
                  className={(filterValues[f.key] ?? '') === opt.value ? 'active' : ''}
                  onClick={() => setFilter(f.key, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ))}
          {searchable && (
            <>
              <input
                className="search"
                placeholder={searchPlaceholder}
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" type="submit">
                Tìm
              </button>
            </>
          )}
        </form>
      )}

      <StateBlock
        loading={loading && !data}
        error={data ? null : error}
        empty={!!data && data.content.length === 0}
        emptyText={emptyText}
        onRetry={() => void load()}
      >
        {data && data.content.length > 0 && (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((c, i) => (
                    <th key={i} className={c.align === 'right' ? 'num' : undefined}>
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.content.map((row) => (
                  <tr key={rowKey(row)}>
                    {columns.map((c, i) => (
                      <td key={i} className={c.align === 'right' ? 'num' : undefined}>
                        {c.cell(row)}
                      </td>
                    ))}
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
