import type { ReactNode } from 'react';
import type { AuthUser } from './types';
import type { Route } from './useHashRoute';

const NAV: { key: Route; label: string; icon: string }[] = [
  { key: 'overview', label: 'Tổng quan', icon: '▨' },
  { key: 'users', label: 'Người dùng', icon: '☺' },
  { key: 'subscriptions', label: 'Gói đăng ký', icon: '★' },
  { key: 'payments', label: 'Duyệt thanh toán', icon: '₫' },
];

export function Layout({
  user,
  route,
  onNavigate,
  onLogout,
  children,
}: {
  user: AuthUser;
  route: Route;
  onNavigate: (r: Route) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          CareNest
          <span className="brand-sub">Admin</span>
        </div>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${route === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span className="nav-icon" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <div className="who-name">{user.name}</div>
            <div className="who-role muted">Quản trị viên</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
