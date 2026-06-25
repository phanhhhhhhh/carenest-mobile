# CareNest — Architecture Overview

**Last updated:** 2026-06-25

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Mobile** | Flutter 3.x + Dart | Cross-platform app (Android, iOS, Web) |
| **State** | Riverpod (`flutter_riverpod`) | Reactive state management |
| **Navigation** | GoRouter (`go_router`) | Declarative routing + auth guard |
| **HTTP Client** | Dio | REST calls to backend; JWT injected via interceptor |
| **Secure Storage** | `flutter_secure_storage` | Stores JWT, role, userId — hardware-backed on Android/iOS |
| **Backend** | Spring Boot 3 + Java 21 | REST API, business logic |
| **ORM** | Spring Data JPA + Hibernate | Entity mapping |
| **DB Migrations** | Flyway | Versioned SQL migrations (V1–V15) |
| **Database** | PostgreSQL 15 | Primary data store |
| **Auth Provider** | Firebase Authentication | Phone OTP verification (SMS) |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Planned — not yet wired |
| **AI Chat** | Google Gemini API (`gemini-1.5-flash`) | Elderly health assistant chat |
| **Hosting** | Render (backend) | Free tier; ~30s cold start |

---

## Auth Flow (UC-01)

### Full Flow: Phone OTP → Backend JWT

```
Flutter App                    Firebase                   Backend (Spring Boot)
     |                            |                              |
     | User enters phone           |                              |
     |─── verifyPhoneNumber() ────▶|                              |
     |                            | Sends SMS OTP to user        |
     |◀── codeSent(verificationId)|                              |
     |                            |                              |
     | User enters 6-digit OTP    |                              |
     |─── signInWithCredential() ─▶|                              |
     |◀── Firebase ID Token ───── |                              |
     |                            |                              |
     |──────── POST /api/auth/login ───────────────────────────▶|
     |         { firebaseToken: "eyJ..." }                       |
     |                            |    FirebaseService.verifyAndGetPhone()
     |                            |◀───────── verifyIdToken() ───|
     |                            |────── phone_number claim ───▶|
     |                            |                              | User lookup in DB
     |                            |                              | JwtService.generateAccessToken()
     |◀─────── 200 OK ─────────────────────────────────────────|
     |  { accessToken, refreshToken, expiresIn, user }          |
     |                            |                              |
     | SecureStorage.saveToken()  |                              |
     | SecureStorage.saveRole()   |                              |
     | SecureStorage.saveUserId() |                              |
     |                            |                              |
     | GoRouter redirect          |                              |
     | → /elderly/home OR /family/dashboard                     |
```

### Dev Mode Flow (Web / Chrome only)

```
Flutter (kIsWeb)               Backend (profile=local or dev)
     |                              |
     | loginDev(phone)              |
     |──── POST /api/auth/login ───▶|
     |     { firebaseToken:         |
     |       "DEV_PHONE:+84xxx" }   |
     |                              | FirebaseService checks profile
     |                              | Skips Firebase, extracts phone directly
     |◀────── 200 OK ──────────────|
```

### JWT Lifecycle

```
Access Token:  15 minutes (configurable via JWT_ACCESS_EXPIRATION_MS)
Refresh Token: 7 days (configurable via JWT_REFRESH_EXPIRATION_MS)
Storage:       refresh_tokens table (hashed with SHA-256)
Rotation:      Each refresh call revokes old token, issues new pair
Revocation:    POST /api/auth/logout revokes all user's refresh tokens

⚠️ Known gap: Flutter does not yet call POST /api/auth/refresh
   when access token expires. Implement in DioClient error interceptor.
```

---

## Role-Based Routing

```
After login, GoRouter reads SecureStorage.getRole():

                    ┌─────────────┐
                    │  /home      │
                    │ (redirect)  │
                    └──────┬──────┘
                           │
              ┌────────────┴──────────────┐
              │ role == 'ELDERLY'         │ role == 'FAMILY'
              ▼                           ▼
     ┌─────────────────┐        ┌─────────────────────┐
     │  ElderlyShell   │        │    FamilyShell      │
     │  (bottom nav)   │        │    (bottom nav)     │
     ├─────────────────┤        ├─────────────────────┤
     │ /elderly/home   │        │ /family/dashboard   │
     │ /elderly/meds   │        │ /family/medication  │
     │ /elderly/health │        │ /family/health      │
     │ /elderly/chat   │        │ /family/alerts      │
     │ /elderly/profile│        │ /family/profile     │
     └─────────────────┘        └─────────────────────┘
```

---

## Database Schema Overview

```
users (V1)
  ├── elderly_profiles (V2)          ←→ ElderlyProfile entity
  ├── family_links (V3)              ←→ FamilyLink entity (links users)
  ├── medications (V4)               ←→ Medication entity
  │     └── medication_logs (V5)     ←→ MedicationLog entity [NO API YET]
  │     └── medication_schedules     ←→ Embedded JSONB in medications
  ├── health_metrics (V6)            ←→ HealthMetric entity [NO API YET]
  ├── appointments (V7)              ←→ Appointment entity [NO API YET]
  ├── otp_verifications (V11)        ←→ OtpVerification entity [UNUSED]
  ├── refresh_tokens (V12)           ←→ RefreshToken entity
  ├── notifications (V13)            ←→ Notification entity [NO API YET]
  ├── health_metric_thresholds (V14) ←→ HealthMetricThreshold entity [NO API YET]
  └── reminders (V15)                ←→ Reminder entity [NO API YET]
        └── emergency_events (V10)   ←→ EmergencyEvent entity [NO API YET]
```

---

## Request Flow (Authenticated)

```
Flutter screen
     │
     │ ref.watch(someProvider)
     ▼
  Riverpod Notifier
     │
     │ dio.get('/api/some-endpoint')
     ▼
  DioClient (Interceptor)
     │ reads SecureStorage.getToken()
     │ adds: Authorization: Bearer <jwt>
     ▼
  HTTP → Spring Boot
     │
  JwtAuthenticationFilter
     │ validates JWT, sets SecurityContext (userId, role)
     ▼
  Controller → Service → Repository → PostgreSQL
     │
     │ JSON response
     ▼
  Flutter Provider updates state → UI rebuilds
```

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Firebase for OTP (not backend OTP) | Avoids maintaining SMS gateway, OTP brute-force protection, rate limiting — Firebase handles all of this |
| Backend issues its own JWT (not Firebase JWT) | Backend has full control over claims (userId, role), token expiry, and revocation via refresh tokens |
| RefreshToken stored as SHA-256 hash | If DB is breached, raw tokens cannot be used |
| Flyway for migrations | Schema history tracked in DB, reproducible across environments |
| Riverpod over Provider/Bloc | Type-safe, compile-time dependency graph, easy `autoDispose` for screen-scoped state |
| GoRouter for navigation | Supports deep linking, shell routes (bottom nav), async auth guard |
| flutter_secure_storage | Hardware-backed keystore on Android (AES encryption), Keychain on iOS |
