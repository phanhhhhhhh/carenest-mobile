# CareNest Admin Web

Standalone operator console for **VietQR payment reconciliation** (UC G3). Runs in a
normal web browser — it is **not** part of the mobile app.

- Stack: Vite + React 19 + TypeScript, no UI framework.
- Talks to the existing Spring Boot API (`/api/payment/pending`, `/api/payment/vietqr/{confirm,reject}`,
  all `hasRole('ADMIN')`). Auth is a JWT from `POST /api/auth/login`, kept in `localStorage`.

## Run locally

```bash
cd admin-web
npm install
npm run dev            # http://localhost:5174
```

The dev server proxies `/api` → `http://localhost:8082` (the `dev` backend profile).
Point it elsewhere with `VITE_API_TARGET`:

```bash
VITE_API_TARGET=http://192.168.1.20:8082 npm run dev
```

Log in with an ADMIN account. The seeded one (dev/local profile) is
`+84900000001` / `Demo@1234`; `DataSeeder` also creates two PENDING VietQR
subscriptions so the list isn't empty.

## Build for deploy

```bash
npm run build         # -> dist/
npm run preview        # serve dist/ locally to check
```

Serve `dist/` from any static host (or behind the same origin as the API). If it is
served from a different origin than the backend, add that origin to the backend's
`cors.allowed-origins` (see `SecurityConfig`).

## What it does

- **Đăng nhập** — phone + password; rejects non-ADMIN accounts client-side (`403` otherwise).
- **Đang chờ duyệt** — table of PENDING subscriptions: user, plan, amount, channel,
  time, transaction id.
- **Xác nhận** — `POST /payment/vietqr/confirm`; on `ACTIVATED` / `ALREADY_ACTIVE` the
  row drops off the list.
- **Từ chối** — `POST /payment/vietqr/reject`; marks the subscription `CANCELLED`.
- Any `401` clears the session and returns to the login screen.
