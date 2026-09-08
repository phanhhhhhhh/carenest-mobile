import type { ReactNode } from 'react';
import type { Page } from './types';

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint muted">{hint}</div>}
    </div>
  );
}

export function StateBlock({
  loading,
  error,
  empty,
  emptyText,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (loading) return <div className="card block muted">Đang tải…</div>;
  if (error) {
    return (
      <div className="card block">
        <p className="error">{error}</p>
        <button className="btn btn-primary btn-sm" onClick={onRetry}>
          Thử lại
        </button>
      </div>
    );
  }
  if (empty) return <div className="card block muted">{emptyText}</div>;
  return <>{children}</>;
}

export function Pagination<T>({
  page,
  onPage,
}: {
  page: Page<T>;
  onPage: (p: number) => void;
}) {
  if (page.totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button
        className="btn btn-ghost btn-sm"
        disabled={page.first}
        onClick={() => onPage(page.number - 1)}
      >
        ← Trước
      </button>
      <span className="muted">
        Trang {page.number + 1}/{page.totalPages} · {page.totalElements.toLocaleString('vi-VN')} bản ghi
      </span>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page.last}
        onClick={() => onPage(page.number + 1)}
      >
        Sau →
      </button>
    </div>
  );
}

export function Badge({ kind, children }: { kind: string; children: ReactNode }) {
  return <span className={`badge badge-${kind.toLowerCase()}`}>{children}</span>;
}
