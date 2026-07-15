# 🏠 CareNest — Peace of mind when you're away

> A mobile app for remote elderly health monitoring, helping families stay connected and track the well-being of their loved ones anytime, anywhere.

**CareNest** is a learning project built with React Native (Expo) and Spring Boot for EXE101 @ FPT University.

**Tech:** React Native (Expo SDK 57) · TypeScript · Zustand · Spring Boot 3.2 · Java 21 · PostgreSQL

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
| 3 | Email verification + OTP verification | ✅ |
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
| 15 | **📷 Camera** — View linked cameras, privacy toggle, check-in snapshots | ✅ |

### 👨‍👩‍👧 Family Side
| # | Feature | Status |
|---|---------|--------|
| 16 | Multi-elderly dashboard with color-coded status | ✅ |
| 17 | **💊 Medications** — View/manage elderly medications, toggle taken | ✅ |
| 18 | **❤️ Health** — View elderly health metrics, set alert thresholds | ✅ |
| 19 | **📅 Appointments** — Full CRUD for elderly appointments | ✅ |
| 20 | **🚨 Alerts** — Active/resolved emergency events, acknowledge, mark all read | ✅ |
| 21 | **📈 Weekly Summary** — AI-generated health report (Gemini, falls back to template) | ✅ |
| 22 | **🎯 Health Thresholds** — Set per-metric min/max, AI recommend, family alert toggle | ✅ |
| 23 | **🔗 Family Link** — Add elderly by phone number, manage connections | ✅ |
| 24 | **📷 Camera** — Link Imou cameras, live view, snapshots, motion detection, privacy mode, timeline | ✅ |
| 25 | **💳 Premium** — Plan cards, VNPay/MoMo payment (needs sandbox credentials) | ✅ |
| 26 | **🔔 Notifications** — In-app list, unread badge, mark read, type filters | ✅ |
| 27 | **⚙️ Notification Settings** — Per-category toggles, quiet hours, reminder minutes | ✅ |

---

## Tech Stack

### 📱 Mobile (Frontend)

| Technology | Purpose |
|------------|---------|
| **React Native** 0.86 + **Expo** SDK 57 | Cross-platform framework |
| **TypeScript** 6.0 | Type-safe development |
| **Zustand** 5.0 | Lightweight state management |
| **React Navigation** 7 | Stack + bottom-tab routing, auth guards, role-based redirect |
| **Axios** 1.7 | HTTP client + JWT interceptor + proactive token refresh |
| **expo-secure-store** | Secure JWT token storage |
| **expo-notifications** | Push notifications (FCM) |
| **@expo/vector-icons** (Ionicons) | Icon system |
| **Google Generative AI** | Gemini AI for chat, health analysis, STT |

### 🖥️ Backend

| Technology | Purpose |
|------------|---------|
| **Spring Boot** 3.2.5 | REST API framework |
| **Java** 21 (virtual threads enabled) | Programming language |
| **Spring Data JPA** + Hibernate | ORM & data access |
| **PostgreSQL** 16 (Docker) | Database |
| **Flyway** | Database migrations (V1–V27) |
| **JJWT** 0.12.5 | JWT authentication (HMAC-SHA256) |
| **Firebase Admin SDK** 9.2.0 | FCM push notifications |
| **Spring Security** | Role-based access control |
| **Spring Mail** | Email verification + password reset |
| **Jackson** | JSON serialization |
| **Lombok** | Boilerplate reduction |
| **SpringDoc OpenAPI** | Swagger UI at `/swagger-ui.html` |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                React Native (Expo) App                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Elderly UI  │  │  Family UI   │  │  Auth Flow  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │        │
│  ┌──────┴─────────────────┴──────────────────┴──────┐ │
│  │              Zustand Stores (18 stores)           │ │
│  │   (auth, elderly, health, meds, family, alerts,   │ │
│  │    appointments, camera, chat, payment, etc.)      │ │
│  └──────────────────────┬───────────────────────────┘ │
│                         │                              │
│  ┌──────────────────────┴───────────────────────────┐ │
│  │         Axios Client + JWT Interceptor            │ │
│  │    (Bearer token attach + proactive refresh       │ │
│  │     + 401 auto-retry + refresh mutex dedup)       │ │
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
├── App.tsx                                  # Entry point
├── index.ts                                 # Expo registerRootComponent
├── src/                                     # Application source
│   ├── core/                                # Shared infrastructure
│   │   ├── api/client.ts                   # Axios + JWT interceptor + refresh
│   │   ├── api/errors.ts                   # API error types & helpers
│   │   ├── auth/sessionEvents.ts           # Session expiry event emitter
│   │   ├── config/appConfig.ts             # Gemini API config
│   │   ├── constants/strings.ts            # App display strings
│   │   ├── navigation/AppNavigator.tsx     # Stack navigator + auth guard
│   │   ├── navigation/ElderlyShell.tsx     # Elderly bottom-tab shell
│   │   ├── navigation/FamilyShell.tsx      # Family bottom-tab shell
│   │   ├── navigation/navigationRef.ts     # Navigation ref for stores
│   │   ├── services/geminiService.ts       # Gemini AI client
│   │   ├── services/pushNotificationService.ts  # FCM push setup
│   │   ├── storage/secureStorage.ts        # expo-secure-store wrapper
│   │   └── theme/                          # Colors, spacing, typography
│   ├── features/                           # Feature modules
│   │   ├── auth/                           # 13 screens + authStore
│   │   ├── elderly/                        # 11 screens + 6 stores + components
│   │   ├── family/                         # 10 screens + 7 stores
│   │   ├── medication/                     # Medication reminder service
│   │   └── notifications/                  # 2 screens + 2 stores
│   └── shared/types/index.ts              # Shared TypeScript types
├── backend/                                # Spring Boot backend
│   ├── pom.xml                             # Maven, Java 21, Spring Boot 3.2.5
│   └── src/main/java/com/carenest/backend/
│       ├── config/                         # SecurityConfig, FirebaseConfig
│       ├── controller/                     # 11 REST controllers
│       ├── dto/                            # 38 DTOs (request + response)
│       ├── entity/                         # 14 JPA entities
│       ├── exception/                      # GlobalExceptionHandler + custom exceptions
│       ├── repository/                     # 16 JPA repositories
│       ├── scheduler/                      # 4 scheduled tasks
│       ├── seeder/                         # DataSeeder (demo data)
│       ├── security/                       # JwtAuthFilter, AuthzService, RateLimitFilter
│       └── service/                        # 25 business logic services
├── assets/                                 # Mascot images, brand logo, app icons
├── .env.example                            # Environment variables template
└── README.md
```

---

## Setup & Run

### Prerequisites

- **Node.js** >= 20
- **JDK** 21 (Eclipse Temurin recommended)
- **Docker Desktop** (for PostgreSQL)
- **VS Code** or **Android Studio**

### ⚡ Quick Start

```bash
# 1. Clone
git clone https://github.com/phanhhhhhhh/carenest-mobile.git
cd carenest_mobile

# 2. Environment
cp .env.example .env
# → Set API_BASE_URL (Android: http://10.0.2.2:8080/api, iOS/physical: http://<ip>:8080/api)
# → Set GEMINI_API_KEY (optional, for AI features)

# 3. Install dependencies
npm install

# 4. Start PostgreSQL
docker-compose up -d

# 5. Run backend (separate terminal)
cd backend
cp src/main/resources/application-local.example.properties src/main/resources/application-local.properties
# Edit application-local.properties with your DB credentials
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 6. Run React Native
npx expo start
# Press 'a' for Android, 'i' for iOS, 'w' for web
```

### API_BASE_URL Values by Platform

| Platform | API_BASE_URL |
|----------|-------------|
| Android Emulator | `http://10.0.2.2:8080/api` |
| iOS Simulator | `http://localhost:8080/api` |
| Web | `http://localhost:8080/api` |
| Physical Device | `http://<your-lan-ip>:8080/api` |

---

## Authentication Flow

```
User                   React Native App          Backend
  │                         │                        │
  │  1. Register           │                        │
  │  (email+name+password  │  POST /api/auth/register
  │   + role ELDERLY/FAMILY)│───────────────────────>│
  │                         │  {userId, requiresVerification}
  │                         │<───────────────────────│
  │  2. Verify (OTP popup) │                        │
  │  (enter 6-digit code)  │  POST /api/auth/verify-otp
  │                         │───────────────────────>│
  │                         │  {accessToken, refreshToken, user}
  │                         │<───────────────────────│
  │  3. Auto-navigate to   │                        │
  │     role-based shell   │                        │
  │<────────────────────────│                        │
  │                         │                        │
  │  ... Token refresh     │  POST /api/auth/refresh │
  │     (automatic, prior  │  (Axios interceptor,    │
  │      to expiry)        │   mutex-deduplicated)   │
```

**Auth methods:**
- **Phone + password**: Primary method (auto-verified, no email needed)
- **Email + password**: Requires verification before login
- **DEV_PHONE:{number}**: Dev bypass (local/dev profiles only)

Tokens stored in **expo-secure-store**. The Axios interceptor proactively refreshes before expiry and deduplicates concurrent refresh calls via a mutex.

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
| POST | `/auth/send-otp` | — |
| POST | `/auth/verify-otp` | — |
| POST | `/auth/resend-verification` | — |
| POST | `/auth/forgot-password` | — |
| POST | `/auth/reset-password` | — |
| POST | `/auth/change-password` | ✅ |
| POST | `/auth/setup-pin` | ✅ |
| POST | `/auth/verify-pin` | ✅ |

### Elderly (`/api`)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET/PUT | `/elderly-profiles/{id}` | ✅ |
| POST/GET | `/elderly/{id}/health-metrics` | ✅ |
| GET | `/elderly/{id}/health-report` | ✅ |
| POST | `/elderly/{id}/sync-health-data` | ✅ |
| GET/POST | `/elderly/{id}/weekly-summary` | ✅ |
| POST/GET | `/elderly/{id}/emergency-events` | ✅ |
| PATCH | `/emergency-events/{id}/acknowledge` | ✅ |

### Family, Medications, Appointments, Camera, etc.
Full API docs: `http://localhost:8080/swagger-ui.html` (when backend is running)

---

## Environment Variables

### Backend (`application-*.properties`)
| Variable | Default | Required |
|----------|---------|----------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5433/carenest` | For custom DB |
| `JWT_SECRET` | (dev default) | **Yes for production** |
| `GEMINI_API_KEY` | (empty) | For AI features |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | (empty) | For email verification |
| `FIREBASE_CREDENTIALS_PATH` | (empty) | For FCM push |
| `GOOGLE_FIT_CLIENT_ID` / `GOOGLE_FIT_CLIENT_SECRET` | (empty) | For Google Fit |
| `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` | (empty) | For VNPay payment |
| `MOMO_PARTNER_CODE` / `MOMO_ACCESS_KEY` / `MOMO_SECRET_KEY` | (empty) | For MoMo payment |
| `IMOU_APP_ID` / `IMOU_APP_SECRET` | (empty) | For camera features |

### React Native (`.env`)
| Variable | Default | Required |
|----------|---------|----------|
| `API_BASE_URL` | `http://10.0.2.2:8080/api` | For non-emulator devices |
| `GEMINI_API_KEY` | (empty) | For AI features |

---

## Demo Data

The `dev` Spring profile enables the `DataSeeder` which creates:

| Entity | Count | Details |
|--------|-------|---------|
| Elderly users | 5 | With profiles, health conditions, emergency contacts |
| Family users | 10 | Pre-linked to elderly via ACTIVE family links |
| Medications | 8 | With schedules (daily, twice-daily, as-needed) |
| Medication logs | ~540 | 30 days of TAKEN/MISSED/SKIPPED entries |
| Health metrics | ~240 | 30 days, twice daily (BP, HR, glucose) |
| Appointments | 15 | 3 per elderly (upcoming) |
| Chat messages | 8 | 4 user-AI conversation pairs |
| Subscriptions | 1 | Premium monthly |
| Camera devices | 1 | Demo Imou device |

**Demo login credentials:**

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
| 1 | **FCM push notifications** — Backend is ready but needs `google-services.json` from a Firebase project | Add Firebase project config |
| 2 | **Payment** — VNPay/MoMo flow works but needs sandbox credentials | Set `VNPAY_*` / `MOMO_*` env vars |
| 3 | **Google Fit** — OAuth flow works but needs Google Cloud project credentials | Set `GOOGLE_FIT_*` env vars |
| 4 | **Camera live view** — Imou integration requires real device SNs and API credentials | Set `IMOU_*` env vars |
| 5 | **Email sending** — SMTP credentials needed for verification + password reset emails | Set `MAIL_*` env vars |
| 6 | **Gemini AI** — Chat, health analysis, STT, weekly summaries need API key | Set `GEMINI_API_KEY` |
| 7 | **iOS simulator** — Default base URL is `10.0.2.2` (Android-only) | Set `API_BASE_URL` in `.env` |
| 8 | **Camera snapshot cleanup** — Scheduled daily but doesn't actually delete old snapshots | Implement in `CameraService.cleanupOldSnapshots()` |

---

## Git Workflow

- **`main`** — Production, merged from develop for releases
- **`develop`** — Main development branch
- **Feature branches** — `feature/<name>`, merged into develop via PR

### Commit Convention

- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Maintenance (config, cleanup)
- `docs:` — Documentation
- `refactor:` — Code refactoring

---

<p align="center">
  <b>CareNest</b> — <i>Peace of mind when you're away</i> 🏠💚
</p>
