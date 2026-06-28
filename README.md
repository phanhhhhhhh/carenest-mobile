# 🏠 CareNest — Peace of mind when you're away

> A mobile app for remote elderly health monitoring, helping families stay connected and track the well-being of their loved ones anytime, anywhere.

**CareNest** is a learning project built with Flutter and Spring Boot.

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
- [Git Workflow](#git-workflow)

---

## Overview

CareNest is a mobile platform connecting elderly users with their families through two roles in one app:

| Role | Description |
|------|-------------|
| **🧓 Elderly** | A simple, friendly interface: health tracking, medication management, SOS emergency button, AI-powered chat |
| **👨‍👩‍👧 Family** | A monitoring dashboard: view health metrics, medication schedules, and receive emergency alerts for loved ones |

## Features

### 🧓 Elderly Side
- **🏠 Home** — Time-of-day greeting, **SOS emergency button** (3-second countdown), health summary cards, today's medications
- **💊 Medications** — Add/view medications, daily progress bar, mark as taken/skipped
- **❤️ Health** — View vitals (blood pressure, blood sugar, heart rate), AI-generated health insights, add new metrics
- **🤖 Chat AI** — Chat with Gemini AI in Vietnamese, quick-reply suggestion chips, offline fallback with sample responses
- **👤 Profile** — Avatar, personal health profile, settings (edit profile, notifications, family connections, logout)

### 👨‍👩‍👧 Family Side
- **📊 Dashboard** — Elderly status card, health metrics overview, recent activity feed, auto-refresh every 30 seconds
- **💊 Medications** — View the elderly's medication list
- **❤️ Health** — View the elderly's health metrics
- **🚨 Alerts** — Receive emergency notifications
- **👤 Profile** — Manage personal account info

## Tech Stack

### 📱 Mobile (Frontend)

| Technology | Purpose |
|------------|---------|
| **Flutter** (SDK ^3.12.0, Dart ^3.12.0) | Cross-platform framework |
| **Riverpod** ^2.6.1 | State management (StateNotifier + autoDispose) |
| **GoRouter** ^15.1.2 | Declarative routing, auth guards |
| **Dio** ^5.8.0 | HTTP client + JWT interceptor |
| **Firebase Auth** ^5.5.2 | Phone OTP verification via SMS |
| **Flutter Secure Storage** ^9.2.4 | Secure JWT token storage |
| **Google Generative AI** ^0.4.0 | Gemini 1.5 Flash integration |
| **flutter_dotenv** ^5.1.0 | Environment variables |

### 🖥️ Backend

| Technology | Purpose |
|------------|---------|
| **Spring Boot** 3.2.5 | REST API framework |
| **Java** 21 | Programming language |
| **Spring Data JPA** + Hibernate | ORM & data access |
| **PostgreSQL** 16 (Docker) | Database |
| **Flyway** | Database migration |
| **JJWT** 0.12.5 | JWT authentication |
| **Firebase Admin SDK** | Firebase token verification |
| **Maven** | Build & dependency management |

### ☁️ Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | PostgreSQL for local development |
| **Render** (free tier) | Backend deployment |
| **Uptime Robot** | Health check monitoring |
| **Gemini API** | AI chat & health analysis |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Flutter Mobile App                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Elderly UI  │  │  Family UI   │  │  Auth Flow  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │        │
│  ┌──────┴─────────────────┴──────────────────┴──────┐ │
│  │              Riverpod State Layer                 │ │
│  │   (AuthProvider / ElderlyProvider / FamilyProvider)│ │
│  └──────────────────────┬───────────────────────────┘ │
│                         │                              │
│  ┌──────────────────────┴───────────────────────────┐ │
│  │            Dio HTTP Client + Interceptor          │ │
│  │        (JWT Bearer Token + 401 Auto-Refresh)      │ │
│  └──────────────────────┬───────────────────────────┘ │
└─────────────────────────┼─────────────────────────────┘
                          │ HTTPS
┌─────────────────────────┼─────────────────────────────┐
│        Spring Boot REST API (Render Cloud)            │
│  ┌──────────────────────┴───────────────────────────┐ │
│  │          JWT Authentication Filter                │ │
│  └──────┬──────────────────────────────────┬────────┘ │
│         │                                  │           │
│  ┌──────┴──────┐  ┌──────────────────┐  ┌──┴────────┐ │
│  │ Controllers │  │    Services      │  │ Security  │ │
│  └──────┬──────┘  └────────┬─────────┘  └───────────┘ │
│         │                  │                            │
│  ┌──────┴──────────────────┴──────────┐                │
│  │      JPA Repositories + Entities    │                │
│  └──────────────────┬─────────────────┘                │
└─────────────────────┼──────────────────────────────────┘
                      │
              ┌───────┴───────┐
              │  PostgreSQL   │
              │   (Docker /   │
              │  Render PG)   │
              └───────────────┘
```

## Project Structure

```
carenest_mobile/
├── lib/                                  # Flutter source code
│   ├── main.dart                         # Entry point: Firebase, dotenv, runApp
│   ├── app.dart                          # MaterialApp.router + theme
│   ├── core/                             # Shared infrastructure
│   │   ├── auth/token_notifier.dart      # TokenNotifier — session expiry detection
│   │   ├── config/app_config.dart        # Gemini API key config, system prompt
│   │   ├── constants/                    # AppColors, AppStrings
│   │   ├── navigation/                   # ElderlyShell, FamilyShell (bottom nav)
│   │   ├── network/dio_client.dart       # Dio client + JWT interceptor + refresh
│   │   ├── router/app_router.dart        # GoRouter config (auth guard, role redirect)
│   │   ├── services/gemini_service.dart  # Gemini 1.5 Flash chat service
│   │   ├── storage/secure_storage.dart   # FlutterSecureStorage wrapper
│   │   └── theme/app_theme.dart          # Material 3 theme (Nunito, #2E7D9A)
│   └── features/                         # Feature-based modules
│       ├── auth/                         # Authentication (OTP + Register)
│       ├── elderly/                      # Elderly-facing screens
│       └── family/                       # Family-facing screens
├── backend/                              # Spring Boot REST API
│   ├── src/main/java/com/carenest/
│   │   ├── config/                       # Security, Firebase, CORS config
│   │   ├── controller/                   # REST controllers (4)
│   │   ├── service/                      # Business logic services (6)
│   │   ├── repository/                   # JPA repositories (12)
│   │   ├── entity/                       # JPA entities (18)
│   │   ├── dto/                          # Data Transfer Objects (10)
│   │   └── security/                     # JWT filter, AuthorizationService
│   └── src/main/resources/
│       ├── db/migration/                 # Flyway migrations (V1–V15)
│       └── application-*.properties      # Environment-specific config
├── test/                                 # Unit & widget tests
├── docs/                                 # Project documentation (local only)
├── scripts/                              # Utility scripts
├── docker-compose.yml                    # PostgreSQL 16 Docker
├── .env.example                          # Environment variables template
└── analysis_options.yaml                 # Dart linter config
```

## Setup & Run

### Prerequisites

- **Flutter SDK** >= 3.12.0 (Dart >= 3.12.0)
- **JDK** 21 (Eclipse Temurin recommended)
- **Docker Desktop**
- **Android Studio** (for emulator) or **VS Code** + Flutter extension

### ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/phanhhhhhhh/carenest-mobile.git
cd carenest_mobile

# 2. Set up environment variables
cp .env.example .env
# → Open .env and fill in your GEMINI_API_KEY; keep other values as default for local dev

# 3. Start PostgreSQL
docker-compose up -d

# 4. Install Flutter dependencies
flutter pub get

# 5. Verify your environment
flutter doctor

# 6. Run the app
flutter run                          # Auto-select attached device
flutter run -d chrome                # Run on Chrome (web)
flutter run -d <device_id>           # Run on a specific device
```

### 🖥️ Run the Backend (separate terminal)

```bash
cd backend

# Create local config (from the provided template)
cp src/main/resources/application-local.example.properties \
   src/main/resources/application-local.properties

# Run Spring Boot with the local profile
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 🔧 Dev Mode (Web)

When running on Chrome, enter a phone number with the `DEV_PHONE:` prefix to bypass Firebase OTP verification:

```
DEV_PHONE:0987654321
```

> ⚠️ For local development only.

## Authentication Flow

```
   User                   Flutter App              Firebase          Backend
    │                         │                       │                  │
    │  1. Enter phone number  │                       │                  │
    │────────────────────────>│                       │                  │
    │                         │  2. Send OTP request  │                  │
    │                         │──────────────────────>│                  │
    │                         │  3. Send OTP via SMS  │                  │
    │  4. Receive OTP, enter  │                       │                  │
    │────────────────────────>│                       │                  │
    │                         │  5. Verify OTP        │                  │
    │                         │──────────────────────>│                  │
    │                         │  6. Firebase ID Token │                  │
    │                         │<──────────────────────│                  │
    │                         │  7. POST /api/auth/login (ID Token)       │
    │                         │──────────────────────────────────────────>│
    │                         │  8. JWT access + refresh tokens           │
    │                         │<──────────────────────────────────────────│
    │                         │                       │                  │
    │  9. Navigate to home    │                       │                  │
    │<────────────────────────│                       │                  │
    │                         │                       │                  │
    │  ... when access token expires ...              │                  │
    │                         │  POST /api/auth/refresh                   │
    │                         │──────────────────────────────────────────>│
    │                         │  New JWT access token                     │
    │                         │<──────────────────────────────────────────│
```

Tokens are stored in **Flutter Secure Storage** and automatically attached via the **Dio Interceptor**. When a token expires (401), the interceptor automatically refreshes and retries the original request.

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/login` | Login with Firebase ID Token | — |
| `POST` | `/api/auth/register` | Register a new account | — |
| `POST` | `/api/auth/refresh` | Refresh access token | Refresh Token |
| `GET` | `/api/elderly/profile` | Get elderly profile | ✅ |
| `PUT` | `/api/elderly/profile` | Update elderly profile | ✅ |
| `GET` | `/api/family/elderly` | List monitored elderly | ✅ |
| `POST` | `/api/family/link` | Send connection request | ✅ |
| `PUT` | `/api/family/link/{id}` | Respond to connection request | ✅ |
| `GET` | `/api/medications` | Get medication list | ✅ |
| `POST` | `/api/medications` | Add a new medication | ✅ |
| `POST` | `/api/medications/{id}/log` | Log medication intake | ✅ |

> Local backend URL: `http://10.0.2.2:8080/api` (Android emulator) / `http://localhost:8080/api` (web)

## Git Workflow

- **`main`** — Production, only merged from develop for releases/demos
- **`develop`** — Main development branch
- **Feature branches** — `feature/<feature-name>`, merged into develop via PR

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
