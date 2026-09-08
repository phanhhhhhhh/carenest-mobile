import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, clearSession, getOverview, getStoredUser, getToken, login } from './api';
import { Layout } from './Layout';
import { useHashRoute } from './useHashRoute';
import { OverviewPage } from './pages/OverviewPage';
import { UsersPage } from './pages/UsersPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import {
  AppointmentsPage,
  CamerasPage,
  CheckInsPage,
  ElderlyPage,
  EmergenciesPage,
  FamilyLinksPage,
  HealthMetricsPage,
  MedicationsPage,
  NotificationsPage,
} from './pages/resources';
import type { Overview } from './types';

function restoreSession() {
  const token = getToken();
  const user = getStoredUser();
  if (token && user) return user;
  clearSession();
  return null;
}

export default function App() {
  const [user, setUser] = useState(restoreSession);
  const [route, navigate] = useHashRoute();
  const [overview, setOverview] = useState<Overview | null>(null);

  const handleLogout = useCallback(() => {
    clearSession();
    setUser(null);
    setOverview(null);
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await getOverview());
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    if (user) void loadOverview();
  }, [user, loadOverview]);

  if (!user) {
    return <LoginView onSignedIn={() => setUser(getStoredUser())} />;
  }

  const sessionProps = { onSessionExpired: handleLogout };

  return (
    <Layout
      user={user}
      route={route}
      onNavigate={navigate}
      onLogout={handleLogout}
      badges={{
        pendingLinks: overview?.pendingFamilyLinks ?? 0,
        activeSos: overview?.activeEmergencies ?? 0,
      }}
    >
      {route === 'overview' && <OverviewPage overview={overview} onReload={loadOverview} />}
      {route === 'users' && <UsersPage {...sessionProps} />}
      {route === 'elderly' && <ElderlyPage {...sessionProps} />}
      {route === 'family-links' && <FamilyLinksPage {...sessionProps} />}
      {route === 'emergencies' && <EmergenciesPage {...sessionProps} />}
      {route === 'check-ins' && <CheckInsPage {...sessionProps} />}
      {route === 'medications' && <MedicationsPage {...sessionProps} />}
      {route === 'health-metrics' && <HealthMetricsPage {...sessionProps} />}
      {route === 'cameras' && <CamerasPage {...sessionProps} />}
      {route === 'appointments' && <AppointmentsPage {...sessionProps} />}
      {route === 'notifications' && <NotificationsPage {...sessionProps} />}
      {route === 'subscriptions' && <SubscriptionsPage {...sessionProps} />}
      {route === 'payments' && <PaymentsPage {...sessionProps} />}
    </Layout>
  );
}

function LoginView({ onSignedIn }: { onSignedIn: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(phone, password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="brand brand-lg">
          CareNest<span className="brand-sub">Admin</span>
        </div>
        <p className="muted">Đăng nhập bằng tài khoản quản trị.</p>

        <label>
          Số điện thoại
          <input
            type="tel"
            autoComplete="username"
            placeholder="+84…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
