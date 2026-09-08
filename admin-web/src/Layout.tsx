import type { ReactNode } from 'react';
import type { AuthUser } from './types';
import type { Route } from './useHashRoute';

const NAV: { key: Route; label: string; badge?: 'pendingLinks' | 'activeSos' }[] = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'users', label: 'Người dùng' },
  { key: 'elderly', label: 'Người cao tuổi' },
  { key: 'family-links', label: 'Liên kết gia đình', badge: 'pendingLinks' },
  { key: 'emergencies', label: 'Sự cố SOS', badge: 'activeSos' },
  { key: 'check-ins', label: 'Check-in' },
  { key: 'medications', label: 'Thuốc' },
  { key: 'health-metrics', label: 'Chỉ số sức khỏe' },
  { key: 'cameras', label: 'Camera' },
  { key: 'appointments', label: 'Lịch hẹn' },
  { key: 'notifications', label: 'Thông báo' },
  { key: 'subscriptions', label: 'Gói đăng ký' },
  { key: 'payments', label: 'Duyệt thanh toán' },
];

export function Layout({
  user,
  route,
  onNavigate,
  onLogout,
  badges,
  children,
}: {
  user: AuthUser;
  route: Route;
  onNavigate: (r: Route) => void;
  onLogout: () => void;
  badges: { pendingLinks: number; activeSos: number };
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          CareNest<span className="brand-sub">Admin</span>
        </div>
        <nav>
          {NAV.map((item) => {
            const count =
              item.badge === 'pendingLinks'
                ? badges.pendingLinks
                : item.badge === 'activeSos'
                  ? badges.activeSos
                  : 0;
            return (
              <button
                key={item.key}
                className={`nav-item ${route === item.key ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                <span>{item.label}</span>
                {count > 0 && (
                  <span className={`nav-badge ${item.badge === 'activeSos' ? 'urgent' : ''}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
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
