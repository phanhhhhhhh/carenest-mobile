# 🏠 CareNest — Peace of mind when you're away

> A mobile app for remote elderly health monitoring, helping families stay connected and track the well-being of their loved ones anytime, anywhere.

**CareNest** is a learning project built with Flutter and Spring Boot for EXE101 @ FPT University.

**Status:** 31/33 UCs implemented — demo-ready with seed data.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup & Run](#setup--run)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Demo Data](#demo-data)
- [Known Limitations](#known-limitations)
- [Git Workflow](#git-workflow)

---

## Overview

CareNest is a mobile platform connecting elderly users with their families through two roles in one app:

| Role | Description |
|------|-------------|
| **🧓 Elderly** | A simple, friendly interface: health tracking, medication management, SOS emergency button, AI-powered chat |
| **👨‍👩‍👧 Family** | A monitoring dashboard: view health metrics, medication schedules, and receive emergency alerts for loved ones |

---

## Features

### 🧓 Elderly Side
| # | Feature | Status |
|---|---------|--------|
| 1 | Register with email/phone + password | ✅ |
| 2 | Login with phone+password or email+password | ✅ |
| 3 | Email verification | ✅ |
| 4 | Forgot password (email reset link) | ✅ |
| 5 | PIN setup & quick unlock | ✅ |
| 6 | Profile view & edit (health conditions, blood type, weight, height, allergies) | ✅ |
| 7 | Emergency contacts management | ✅ |
| 8 | **🏠 Home** — Time-of-day greeting, SOS button (3s countdown), today's meds & appointments | ✅ |
| 9 | **💊 Medications** — Add/edit/delete, schedule, mark taken/missed, 30-day history | ✅ |
| 10 | **❤️ Health** — BP/HR/glucose/weight/temp/SpO₂, 7/30-day charts, AI insights (Gemini) | ✅ |
| 11 | **📊 Health Report** — 30-day report, per-metric stats & trends, medication adherence, AI summary | ✅ |
| 12 | **🤖 Chat AI** — Gemini-powered health chat, quick replies, voice input (STT) | ✅ |
| 13 | **🔗 Google Fit** — OAuth connect, sync health data, disconnect | ✅ |
| 14 | **👤 Profile** — Avatar, settings (PIN lock, notification prefs, premium, logout) | ✅ |

### 👨‍👩‍👧 Family Side
| # | Feature | Status |
|---|---------|--------|
| 15 | Multi-elderly dashboard with color-coded status | ✅ |
| 16 | **💊 Medications** — View/manage elderly medications, toggle taken | ✅ |
| 17 | **❤️ Health** — View elderly health metrics, set alert thresholds | ✅ |
| 18 | **📅 Appointments** — Full CRUD for elderly appointments | ✅ |
| 19 | **🚨 Alerts** — Active/resolved emergency events, acknowledge, mark all read | ✅ |
| 20 | **📈 Weekly Summary** — AI-generated health report (Gemini, falls back to template) | ✅ |
| 21 | **🎯 Health Thresholds** — Set per-metric min/max, AI recommend, family alert toggle | ✅ |
| 22 | **🔗 Family Link** — Add elderly by phone number, manage connections | ✅ |
| 23 | **📷 Camera** — Link Imou cameras, live view, snapshots, motion detection, privacy mode, timeline | ✅ |
| 24 | **💳 Premium** — Plan cards, VNPay/MoMo payment (needs sandbox credentials) | ✅ |
| 25 | **🔔 Notifications** — In-app list, unread badge, mark read, type filters | ✅ |
| 26 | **⚙️ Notification Settings** — Per-category toggles, quiet hours, reminder minutes | ✅ |

---

## Tech Stack

### 📱 Mobile (Frontend)

| Technology | Purpose |
|------------|---------|
| **Flutter** (SDK ^3.12.0) | Cross-platform framework |
| **Riverpod** ^2.6.1 | State management (StateNotifier + family providers) |
| **GoRouter** ^15.1.2 | Declarative routing, auth guards, role-based redirect |
| **Dio** ^5.8.0 | HTTP client + JWT interceptor + proactive token refresh |
| **Flutter Secure Storage** ^9.2.4 | Secure JWT token storage |
| **Google Generative AI** ^0.4.0 | Gemini AI for chat, health analysis, STT |
| **Firebase** (core, auth, messaging) | Push notifications (FCM) |
| **speech_to_text** ^7.0.0 | Voice input for AI chat |
| **url_launcher** ^6.3.0 | External browser for OAuth, payment URLs |
| **flutter_dotenv** ^5.1.0 | Environment variable loading |

### 🖥️ Backend

| Technology | Purpose |
|------------|---------|
| **Spring Boot** 3.2.5 | REST API framework |
| **Java** 21 (virtual threads enabled) | Programming language |
| **Spring Data JPA** + Hibernate | ORM & data access |
| **PostgreSQL** 16 (Docker) | Database |
| **Flyway** | Database migrations (V1–V26) |
| **JJWT** 0.12.5 | JWT authentication (HMAC-SHA256) |
| **Firebase Admin SDK** 9.2.0 | FCM push notifications |
| **Spring Security** | Role-based access control |
| **Spring Mail** | Email verification + password reset |
| **Jackson** | JSON serialization (camelCase) |
| **Lombok** | Boilerplate reduction |
| **SpringDoc OpenAPI** | Swagger UI at /swagger-ui.html |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Flutter Mobile App                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Elderly UI  │  │  Family UI   │  │  Auth Flow  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │        │
│  ┌──────┴─────────────────┴──────────────────┴──────┐ │
│  │          Riverpod StateNotifier Providers         │ │
│  │   (15 providers: auth, elderly, health, meds,    │ │
│  │    family, appointments, alerts, camera, etc.)    │ │
│  └──────────────────────┬───────────────────────────┘ │
│                         │                              │
│  ┌──────────────────────┴───────────────────────────┐ │
│  │        Dio HTTP Client + JWT Interceptor          │ │
│  │    (Bearer token attach + 60s proactive refresh   │ │
│  │     + refresh mutex dedup + 401 auto-retry)       │ │
│  └──────────────────────┬───────────────────────────┘ │
└─────────────────────────┼─────────────────────────────┘
                          │ HTTPS (REST JSON)
┌─────────────────────────┼─────────────────────────────┐
│        Spring Boot REST API (localhost:8080)          │
│  ┌──────────────────────┴───────────────────────────┐ │
│  │       JwtAuthenticationFilter (once-per-request)  │ │
│  └──────┬──────────────────────────────────┬────────┘ │
│         │                                  │           │
│  ┌──────┴──────┐  ┌──────────────────┐  ┌──┴────────┐ │
│  │ 11 Controllers│ │  25 Services     │  │ Security  │ │
│  └──────┬──────┘  └────────┬─────────┘  └───────────┘ │
│         │                  │                            │
│  ┌──────┴──────────────────┴──────────┐                │
│  │   16 JPA Repositories + 14 Entities │                │
│  └──────────────────┬─────────────────┘                │
└─────────────────────┼──────────────────────────────────┘
                      │
              ┌───────┴───────┐
              │  PostgreSQL   │
              │  (localhost:5433) │
              └───────────────┘
```

---

## Project Structure

```
carenest_mobile/
├── lib/                                    # Flutter source (61 Dart files)
│   ├── main.dart                           # Entry point: dotenv load, runApp
│   ├── app.dart                            # MaterialApp.router + theme
│   ├── core/                               # Shared infrastructure
│   │   ├── auth/token_notifier.dart        # Session expiry → GoRouter redirect
│   │   ├── config/app_config.dart          # Gemini API config
│   │   ├── constants/                      # AppColors (28), AppStrings
│   │   ├── navigation/                     # ElderlyShell, FamilyShell (bottom nav)
│   │   ├── network/dio_client.dart         # Dio + JWT interceptor + refresh
│   │   ├── router/app_router.dart          # GoRouter: 25 routes, auth guard
│   │   ├── services/                       # GeminiService, FcmService
│   │   ├── storage/secure_storage.dart     # FlutterSecureStorage wrapper
│   │   ├── theme/app_theme.dart            # Material 3, Nunito font
│   │   └── utils/dio_utils.dart            # Safe JSON parsing helpers
│   └── features/                           # Feature modules
│       ├── auth/                           # Login, register, forgot password, PIN, email verify
│       ├── elderly/                        # Home, medications, health, chat, profile, health report
│       ├── family/                         # Dashboard, medications, health, alerts, camera, appointments
│       ├── home/                           # Legacy home (unused)
│       ├── medication/                     # Local notification reminder service
│       └── notifications/                  # Notification list, settings
├── backend/                                # Spring Boot (160 Java files)
│   ├── pom.xml                             # Maven, Java 21, Spring Boot 3.2.5
│   └── src/main/java/com/carenest/backend/
│       ├── config/                         # SecurityConfig, FirebaseConfig
│       ├── controller/                     # 11 REST controllers
│       ├── dto/                            # 38 DTOs (request + response)
│       ├── entity/                         # 14 JPA entities + 3 embedded POJOs
│       ├── exception/                      # GlobalExceptionHandler + custom exceptions
│       ├── repository/                     # 16 JPA repositories
│       ├── scheduler/                      # 4 scheduled tasks (health check, reminders, weekly summary)
│       ├── seeder/                         # DataSeeder (5 elderly + 10 family + demo data)
│       ├── security/                       # JwtAuthenticationFilter, AuthorizationService
│       └── service/                        # 25 business logic services
├── .env.example                            # Environment variables template
└── README.md
```

---

## Setup & Run

### Prerequisites

- **Flutter SDK** >= 3.12.0 (Dart >= 3.12.0)
- **JDK** 21 (Eclipse Temurin recommended)
- **Docker Desktop** (for PostgreSQL)
- **Android Studio** or **VS Code** + Flutter extension

### ⚡ Quick Start

```bash
# 1. Clone
git clone https://github.com/phanhhhhhhh/carenest-mobile.git
cd carenest_mobile

# 2. Environment
cp .env.example .env
# → Set API_BASE_URL (see below), GEMINI_API_KEY (optional for AI features)

# 3. Start PostgreSQL
docker-compose up -d

# 4. Install dependencies
flutter pub get

# 5. Run backend (separate terminal)
cd backend
cp src/main/resources/application-local.example.properties src/main/resources/application-local.properties
mvn spring-boot:run -Dspring-boot.run.profiles=dev
# Dev profile enables: seed data, SQL logging, debug logging

# 6. Run Flutter
flutter run
```

### API_BASE_URL Values by Platform

| Platform | API_BASE_URL |
|----------|-------------|
| Android Emulator | `http://10.0.2.2:8080/api` |
| iOS Simulator | `http://localhost:8080/api` |
| Web (Chrome) | `http://localhost:8080/api` |
| Physical Device | `http://<your-lan-ip>:8080/api` |

If `API_BASE_URL` is not set in `.env`, the app falls back to `10.0.2.2:8080/api` (Android emulator).

---

## Authentication Flow

```
User                   Flutter App                Backend
  │                         │                        │
  │  1. Register           │                        │
  │  (email+name+password  │  POST /api/auth/register
  │   + role ELDERLY/FAMILY)│───────────────────────>│
  │                         │  {message: "check email"}
  │                         │<───────────────────────│
  │  2. Verify email       │                        │
  │  (click link in inbox) │  POST /api/auth/verify-email
  │                         │───────────────────────>│
  │                         │                        │
  │  3. Login              │                        │
  │  (phone+password or    │  POST /api/auth/login   │
  │   email+password)      │───────────────────────>│
  │                         │  {accessToken, refreshToken, user}
  │                         │<───────────────────────│
  │  4. Auto-navigate to   │                        │
  │     role-based shell   │                        │
  │<────────────────────────│                        │
  │                         │                        │
  │  ... Token refresh     │  POST /api/auth/refresh │
  │     (automatic, 60s    │  (Dio interceptor,      │
  │      before expiry)    │   mutex-deduplicated)   │
```

**Auth methods:**
- **Phone + password**: Primary method (no email required)
- **Email + password**: Alternative
- **DEV_PHONE:{number}**: Dev bypass (local/dev profiles only)

Tokens stored in **Flutter Secure Storage**. The Dio interceptor proactively refreshes 60 seconds before expiry and deduplicates concurrent refresh calls via a mutex.

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/auth/register` | — |
| POST | `/auth/login` | — |
| POST | `/auth/refresh` | Refresh Token |
| POST | `/auth/logout` | ✅ |
| POST | `/auth/verify-email` | — |
| POST | `/auth/resend-verification` | — |
| POST | `/auth/forgot-password` | — |
| POST | `/auth/reset-password` | — |
| POST | `/auth/change-password` | ✅ |
| POST | `/auth/setup-pin` | ✅ |
| POST | `/auth/verify-pin` | ✅ |

### Elderly (`/api`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/elderly-profiles/{id}` | ✅ |
| PUT | `/elderly-profiles/{id}` | ✅ |
| POST | `/elderly/{id}/health-metrics` | ✅ |
| GET | `/elderly/{id}/health-metrics` | ✅ |
| GET | `/elderly/{id}/health-report` | ✅ |
| POST | `/elderly/{id}/sync-health-data` | ✅ |
| GET | `/elderly/{id}/weekly-summary` | ✅ |
| POST | `/elderly/{id}/weekly-summary/generate` | ✅ |
| POST | `/elderly/{id}/emergency-events` | ✅ |
| GET | `/elderly/{id}/emergency-events` | ✅ |

### Family (`/api`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/family/{familyId}/elderly` | ✅ |
| GET | `/elderly/{elderlyId}/family` | ✅ |
| POST | `/family-links` | ✅ |
| PATCH | `/family-links/{id}/status` | ✅ |

### Medications (`/api`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/users/{userId}/medications` | ✅ |
| POST | `/medications` | ✅ |
| PATCH | `/medications/{id}` | ✅ |
| DELETE | `/medications/{id}` | ✅ |
| GET | `/medications/{id}/logs` | ✅ |
| POST | `/medications/{id}/logs` | ✅ |

### Appointments, Notifications, Reminders, Camera, etc.
| Method | Endpoint | Auth |
|--------|----------|------|
| GET/POST/PATCH/DELETE | `/appointments` | ✅ |
| GET/PATCH | `/users/{userId}/notifications` | ✅ |
| GET/PUT | `/users/{userId}/notification-preferences` | ✅ |
| GET/POST/PATCH/DELETE | `/reminders` | ✅ |
| GET/POST/DELETE | `/elderly/{id}/cameras` | ✅ |
| GET | `/cameras/{id}/live` | ✅ |
| POST | `/cameras/{id}/voice/start` | ✅ |
| POST | `/cameras/{id}/privacy` | ✅ |
| PUT | `/cameras/{id}/motion-detection` | ✅ |
| GET/POST | `/payment/plans`, `/payment/subscription` | ✅ |
| GET/POST | `/google-fit/status`, `/google-fit/connect`, etc. | ✅ |

Full API docs: `http://localhost:8080/swagger-ui.html` (when backend is running)

---

## Environment Variables

### Backend (`application-*.properties`)
| Variable | Default | Required |
|----------|---------|----------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5433/carenest` | For custom DB |
| `JWT_SECRET` | (dev default, 32 chars) | **Yes for production** |
| `GEMINI_API_KEY` | (empty) | For AI features |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | (empty) | For email verification |
| `FIREBASE_CREDENTIALS_PATH` | (empty) | For FCM push |
| `GOOGLE_FIT_CLIENT_ID` / `GOOGLE_FIT_CLIENT_SECRET` | (empty) | For Google Fit |
| `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` | (empty) | For VNPay payment |
| `MOMO_PARTNER_CODE` / `MOMO_ACCESS_KEY` / `MOMO_SECRET_KEY` | (empty) | For MoMo payment |
| `IMOU_APP_ID` / `IMOU_APP_SECRET` | (empty) | For camera features |

### Flutter (`.env`)
| Variable | Default | Required |
|----------|---------|----------|
| `API_BASE_URL` | `http://10.0.2.2:8080/api` | For non-emulator devices |
| `GEMINI_API_KEY` | (empty) | For AI features |

---

## Demo Data

The `dev` Spring profile (`application-dev.properties`) enables the `DataSeeder` which creates:

| Entity | Count | Details |
|--------|-------|---------|
| Elderly users | 5 | With profiles, health conditions, emergency contacts |
| Family users | 10 | Pre-linked to elderly via ACTIVE family links |
| Medications | 8 | With schedules (daily, twice-daily, as-needed) |
| Medication logs | ~540 | 30 days of TAKEN/MISSED/SKIPPED entries |
| Health metrics | ~240 | 30 days, twice daily (BP, HR, glucose) |
| Appointments | 15 | 3 per elderly (upcoming) |
| Chat messages | 8 | 4 user-AI conversation pairs |
| Subscriptions | 1 | Premium monthly (family user #1) |
| Camera devices | 1 | Demo Imou device (IMOU-DEMO-001) |

**Demo login credentials** (all pre-verified, no email verification needed):

| Role | Phone | Name |
|------|-------|------|
| Elderly | `+84912345001` | John Anderson |
| Elderly | `+84912345002` | Jane Thompson |
| Family | `+84918111001` | Linda Nguyen |
| Family | `+84918111002` | Michael Tran |

---

## Known Limitations

| # | Limitation | Fix |
|---|-----------|-----|
| 1 | **FCM push notifications** — backend is ready but Flutter needs `google-services.json` from a Firebase project | Add Firebase project config |
| 2 | **Payment** — VNPay/MoMo payment flow works but needs sandbox credentials in env vars | Set `VNPAY_*` / `MOMO_*` env vars |
| 3 | **Google Fit** — OAuth flow works but needs Google Cloud project credentials | Set `GOOGLE_FIT_*` env vars |
| 4 | **Camera live view** — Imou integration requires real device SNs and API credentials | Set `IMOU_*` env vars |
| 5 | **Email sending** — SMTP credentials needed for verification + password reset emails | Set `MAIL_*` env vars |
| 6 | **Gemini AI** — Chat, health analysis, STT, weekly summaries need API key | Set `GEMINI_API_KEY` |
| 7 | **iOS simulator** — Default base URL is `10.0.2.2` (Android-only); set `API_BASE_URL` for iOS | Set `API_BASE_URL` in `.env` |
| 8 | **Camera snapshot cleanup** — Scheduled daily but only logs, doesn't actually delete old snapshots | Implement deletion in `CameraService.cleanupOldSnapshots()` |

---

## Git Workflow

- **`main`** — Production, merged from develop for releases
- **`develop`** — Main development branch
- **Feature branches** — `feature/<name>`, merged into develop via PR

### Commit Convention

- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Maintenance (config, cleanup, demo prep)
- `docs:` — Documentation
- `refactor:` — Code refactoring

---

<p align="center">
  <b>CareNest</b> — <i>Peace of mind when you're away</i> 🏠💚
</p>
