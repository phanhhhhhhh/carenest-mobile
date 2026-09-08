# CareNest Admin Web

Operator/admin console for CareNest. A normal web app (Vite + React 19 + TypeScript,
no UI framework) — **not** part of the mobile app.

Pages:

| Page | Backend | What it shows |
|---|---|---|
| **Tổng quan** | `GET /api/admin/overview` | user / elderly / link / subscription counts, revenue, check-ins today, open SOS |
| **Người dùng** | `GET /api/admin/users?role=&query=&page=` | every user, filter by role + text search, paginated |
| **Gói đăng ký** | `GET /api/admin/subscriptions?status=&page=` | every subscription, filter by status, paginated |
| **Duyệt thanh toán** | `GET /api/payment/pending` + `POST /api/payment/vietqr/{confirm,reject}` | PENDING VietQR transfers, confirm → activate / reject → cancel |

All admin endpoints are `@PreAuthorize("hasRole('ADMIN')")`. Auth is a JWT from
`POST /api/auth/login`, kept in `localStorage`; a 401/403 on any call drops the
session back to the login screen.

## Run locally

```bash
cd admin-web
npm install
npm run dev            # http://localhost:5174
```

The dev server proxies `/api` → `http://localhost:8082` **without** `changeOrigin`, so
the browser stays same-origin and Spring's CORS filter is never involved. Point the
proxy elsewhere with `VITE_API_TARGET`:

```bash
VITE_API_TARGET=http://192.168.1.20:8082 npm run dev
```

Log in with an ADMIN account. Seeded one (dev/local profile):
`+84900000001` / `Demo@1234`. `DataSeeder` also creates two PENDING VietQR
subscriptions so the payments page isn't empty.

## Build for deploy

```bash
npm run build         # -> dist/  (static files)
npm run preview        # serve dist/ locally to check
```

Serve `dist/` from any static host. If it is **not** served from the same origin as
the API, add that origin to the backend `cors.allowed-origins` (`SecurityConfig`) and
have the page call the API by absolute URL (currently it uses the relative `/api`).

## Layout

```
src/
├── api.ts            fetch wrapper + endpoint functions; token in localStorage
├── App.tsx           auth gate + LoginView
├── Layout.tsx        sidebar + nav
├── useHashRoute.ts   #/overview | #/users | #/subscriptions | #/payments
├── components.tsx    PageHeader / StatCard / StateBlock / Pagination / Badge
├── format.ts         plan / role / status labels, VND, dates
├── types.ts          API shapes (incl. the Spring Data Page envelope)
└── pages/            one file per route
```
