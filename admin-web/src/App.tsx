import { type FormEvent, useCallback, useState } from 'react';
import { ApiError, clearSession, getStoredUser, getToken, login } from './api';
import { Layout } from './Layout';
import { useHashRoute } from './useHashRoute';
import { OverviewPage } from './pages/OverviewPage';
import { UsersPage } from './pages/UsersPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { PaymentsPage } from './pages/PaymentsPage';

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

  const handleLogout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  if (!user) {
    return <LoginView onSignedIn={() => setUser(getStoredUser())} />;
  }

  return (
    <Layout user={user} route={route} onNavigate={navigate} onLogout={handleLogout}>
      {route === 'overview' && <OverviewPage onSessionExpired={handleLogout} />}
      {route === 'users' && <UsersPage onSessionExpired={handleLogout} />}
      {route === 'subscriptions' && <SubscriptionsPage onSessionExpired={handleLogout} />}
      {route === 'payments' && <PaymentsPage onSessionExpired={handleLogout} />}
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
            placeholder="+84900000001"
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
