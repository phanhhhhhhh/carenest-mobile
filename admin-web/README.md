# CareNest Admin Web

Operator/admin console for CareNest. A normal web app (Vite + React 19 + TypeScript,
no UI framework) — **not** part of the mobile app.

Pages (all backed by `GET /api/admin/*`, `hasRole('ADMIN')`, paginated Spring `Page`):

| Page | Endpoint | Notes |
|---|---|---|
| **Tổng quan** | `/overview` | ~18 counts: users by role, elderly, links, subs by plan, revenue, check-ins today, open SOS, meds, appts, cameras online, health metrics 7d, chat msgs today, notifications 7d |
| **Người dùng** | `/users?role=&query=&page=` + `/users/{id}` | role filter + text search; row → detail drawer (profile, active sub, group-premium, links) |
| **Người cao tuổi** | `/elderly` | health conditions, blood type, camera consent |
| **Liên kết gia đình** | `/family-links?status=` | PENDING = E4 approval queue (sidebar badge) |
| **Sự cố SOS** | `/emergencies?status=` | escalation level, ack/call/resolve times (sidebar badge for ACTIVE) |
| **Check-in** | `/check-ins` | mood, source, note |
| **Thuốc** | `/medications` | dosage, voice-reminder flag, next dose |
| **Chỉ số sức khỏe** | `/health-metrics?type=` | value(s) + unit, recorded time |
| **Camera** | `/cameras` | status, privacy mode, motion detection, last seen |
| **Lịch hẹn** | `/appointments?status=` | doctor, specialty, location, datetime |
| **Thông báo** | `/notifications?type=` | recipient, type, read flag |
| **Gói đăng ký** | `/subscriptions?status=` | every subscription |
| **Duyệt thanh toán** | `/payment/pending` + `/payment/vietqr/{confirm,reject}` | PENDING VietQR queue |

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
