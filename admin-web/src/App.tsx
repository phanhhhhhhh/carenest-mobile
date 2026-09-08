import { type FormEvent, useCallback, useState } from 'react';
import { ApiError, clearSession, getStoredUser, getToken, login } from './api';
import { PaymentsView } from './PaymentsView';

export default function App() {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));

  const handleLogout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  if (!user) {
    return <LoginView onSignedIn={() => setUser(getStoredUser())} />;
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>CareNest · Duyệt thanh toán</h1>
          <p className="muted">VietQR reconciliation · UC G3</p>
        </div>
        <div className="topbar-right">
          <span className="muted">{user.name}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <main className="content">
        <PaymentsView onSessionExpired={handleLogout} />
      </main>
    </div>
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
        <h1>CareNest Admin</h1>
        <p className="muted">Đăng nhập bằng tài khoản ADMIN để duyệt thanh toán.</p>

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
