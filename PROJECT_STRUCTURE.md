# CareNest — Project Structure Reference

> Purpose: help an AI assistant locate the right file for a given feature without
> guessing. Jump straight to the right layer instead of scanning the whole tree.
>
> Status: backend map confirmed from repo listing (Sept 2026); frontend map
> confirmed against `src/` on 2026-09-02. Keep this file in sync when modules move.
> This repo is a **monorepo**: React Native / Expo app at the root (`src/`), Spring
> Boot backend under `backend/`.

## Canonical spec: Master Spec v3.5 (2026-09-06)

`Doc/Now/General/CareNest_Master_Spec_v2.docx` (content is **v3.5**) supersedes the old
USE_CASE / Feature_Analysis / Documentation docs. Product repositioned to a **daily
family-connection app**; medication / SOS / camera are safety layers, not the core.

Built and current (spec only documents these — do not rebuild):
- SOS 1-touch + 2-level escalation (3 / 10 min no-ack) + secondary contact —
  `EmergencyEventService`, `EmergencyEscalationScheduler`, migration `V37`,
  `elderly_profiles.secondary_family_user_id`. SOS always broadcasts to the whole
  family immediately, never filtered by availability.
- **A1 Daily 1-Touch Check-in** — built. Backend: `check_ins` table (migration
  `V39`), `CheckIn`/`CheckInSource` entities, `CheckInController`
  (`/api/elderly/{id}/check-ins`, `.../today`), `CheckInService`. Frontend:
  `features/elderly/store/checkinStore.ts`, `elderlyHome/CheckinPanel.tsx` (3 mood
  buttons + a 🆘 button that runs the existing SOS countdown, not a 4th mood),
  family-side `familyDashboard/TodayCheckinCard.tsx`. Mood 1-3 = happy/neutral/unwell.
- Flyway is at **V39**; next migration is V40.

Spec'd but **not yet in code** (no files exist for these — build targets):
- **A2 Family Care Feed** — social timeline replacing the dashboard aggregate;
  generic ack status only, never names who acked.
- **A3 Free Broadcast (sequential) + A4 Escalation** — `family_links` needs
  `availability_status`/`last_ack_at`/`last_notified_at`; new
  `NotificationBroadcastService` + `availabilityStore.ts`. Daily notifications only,
  never SOS.
- **A7 Visit Streak** — new `family_visits` + `family_visit_settings` tables,
  scheduler, `visitStreakStore.ts`, manual-confirm screen (no camera auto-detect).
- **B1** — prescription-photo/OCR **removed** from the UI (`MedicationForm.tsx`) and
  API (`MedicationRequest`/`MedicationResponse`/`MedicationService`); `medications.photo_url`
  column and the now-`@Deprecated` `Medication.photoUrl` field are kept but unused.
  Still to do: add `medications.voice_url` + a voice-to-text entry path for schedules.
- **D1** camera-consent onboarding + D7 privacy-mode fallback.

Dropped from roadmap: QR scanner, PDF export, Zalo OA, prescription-photo storage,
camera-based visit auto-detect.

## Backend (`backend/src/main/java/com/carenest/backend/`)

Standard layered Spring Boot structure: `controller` → `service` → `repository` → `entity`, with `dto` per feature and cross-cutting `config`/`security`/`scheduler`/`exception`.

### Feature → Controller → Service → Entity map

| Feature / Module | Controller | Service(s) | Entity(ies) |
|---|---|---|---|
| Auth (register/login/OTP/PIN) | `AuthController` | `AuthService`, `JwtService`, `OtpService` | `User`, `UserRole`, `RefreshToken`, `OtpVerification` |
| User & notification prefs | `UserController` | `UserService`, `FcmService` | `NotificationPreferences` |
| Elderly profile | `ElderlyProfileController` | `ElderlyProfileService` | `ElderlyProfile`, `EmergencyContact` |
| Family linking | `FamilyLinkController` | `FamilyLinkService` | `FamilyLink`, `FamilyLinkStatus` |
| Camera monitoring (IMOU) | `CameraController` | `CameraService`, `ImouApiService` | `CameraDevice`, `CameraSnapshot` |
| Emergency / SOS | `EmergencyEventController` | `EmergencyEventService` | `EmergencyEvent`, `EmergencyStatus` |
| Daily check-in (A1) | `CheckInController` | `CheckInService` | `CheckIn`, `CheckInSource` |
| Health metrics | `HealthMetricController`, `HealthMetricThresholdController` | `HealthMetricService`, `HealthMetricThresholdService`, `HealthReportService`, `HealthSyncService`, `AnomalyDetectionService` | `HealthMetric`, `HealthMetricType`, `HealthMetricThreshold` |
| Google Fit integration | `GoogleFitController` | `GoogleFitService` | `GoogleFitToken` |
| Medication | `MedicationController`, `MedicationCatalogController`, `MedicationLogController` | `MedicationService`, `MedicationCatalogService`, `MedicationLogService`, `MedicationScheduleCalculator` | `Medication`, `MedicationCatalogItem`, `MedicationLog`, `MedicationLogStatus`, `MedicationSchedule` |
| Reminders | `ReminderController` | `ReminderService`, `SchedulerStateService` | `Reminder`, `RepeatRule`, `SchedulerState` |
| Appointments | `AppointmentController` | `AppointmentService` | `Appointment`, `AppointmentStatus` |
| Chatbot (Gemini) | `ChatController`, `VoiceController` | `ChatService`, `ChatReminderService`, `GeminiApiService`, `SpeechToTextService` | `ChatMessage` |
| Dashboard (family view) | `DashboardController` | `DashboardService` | — (aggregates other entities) |
| Notifications (push/SMS/email) | `NotificationController` | `NotificationService`, `FcmService`, `SmsService`, `EmailService`, `FirebaseService` | `Notification`, `NotificationType` |
| Payments / subscription | `PaymentController` | `PaymentService`, `SubscriptionService` | `Subscription` |

### Cross-cutting

- `config/` — `FirebaseConfig`, `SecurityConfig`
- `security/` — `JwtAuthenticationFilter`, `RateLimitFilter`, `AuthorizationService`
- `scheduler/` — `AppointmentReminderScheduler`, `MedicationReminderScheduler`, `ReminderScheduler`, `HealthCheckScheduler`, `WeeklySummaryScheduler`
- `exception/` — `GlobalExceptionHandler` + `ConflictException`, `NotFoundException`, `UnauthorizedException`, `PaymentRequiredException`, `RateLimitExceededException`, `GeminiApiException`
- `seeder/` — `DataSeeder` (runs only when `carenest.seed.enabled=true`, i.e. `dev` / `local` profile; skips if `users` table is non-empty)
- `dto/` — grouped by feature subpackage (`auth`, `camera`, `chat`, `dashboard`, `elderly`, `emergency`, `family`, `googlefit`, `health`, `medication`, `notification`, `payment`, `reminder`, `appointment`, `user`)

### Config / run

- `application.properties` — base config, no `server.port` (defaults to 8080)
- `application-dev.properties` — `server.port=8082`, `carenest.seed.enabled=true`, verbose SQL/Flyway logging. **This is the profile the mobile `.env` expects** (`EXPO_PUBLIC_API_BASE_URL` → `:8082/api`).
- `application-local.properties` — seed enabled, port stays 8080
- DB: PostgreSQL on `localhost:5433` (via `docker-compose.yml`, which runs Postgres only — not the backend). Default creds `carenest` / `carenest`.
- Actuator health: `GET /actuator/health` (NOT under `/api`; unauthenticated). Everything under `/api/**` needs a JWT except `/api/auth/**`.
- Run: `java -jar backend/target/carenest-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev`

### Tests (`backend/src/test/java/com/carenest/backend/`)

- `controller/` — `AuthIntegrationTest`, `AppointmentIntegrationTest`, `NotificationIntegrationTest`
- `repository/` — `BaseRepositoryTest` + repo tests for `Appointment`, `FamilyLink`, `HealthMetric`, `Medication`, `User`

## Frontend (React Native / Expo — repo root, `src/`)

Feature-based structure: `core/` (app-wide infra) + `features/<domain>/` (screens/store/components/services per domain) + `shared/` (cross-feature primitives). Screens live at `features/<domain>/screens/`; most screens also have a sibling lowercase subfolder (e.g. `elderlyHome/`) holding that screen's local styles/hooks/widgets.

### `core/` — app-wide infrastructure

| Area | Files |
|---|---|
| API client | `core/api/client.ts` (axios, `baseURL` from `AppConfig.apiBaseUrl`), `core/api/errors.ts` |
| Auth (token handling) | `core/auth/jwt.ts`, `core/auth/sessionEvents.ts` |
| Config | `core/config/appConfig.ts` — reads `EXPO_PUBLIC_API_BASE_URL`, falls back to `10.0.2.2:8082` (Android emu) / `localhost:8082` |
| Constants | `core/constants/strings.ts` |
| Navigation | `core/navigation/AppNavigator.tsx`, `ElderlyShell.tsx`, `FamilyShell.tsx`, `navigationRef.ts` |
| Services | `core/services/geminiService.ts`, `pushNotificationService.ts` |
| Storage | `core/storage/secureStorage.ts` (expo-secure-store) |
| Theme | `core/theme/colors.ts`, `index.ts`, `spacing.ts`, `typography.ts` |

### `features/` — by domain

Screen files are prefixed with the domain (`Elderly*` / `Family*`); the table lists them without prefix for brevity.

| Feature | Screens (`features/<domain>/screens/`) | Stores (`features/<domain>/store/`) | Other |
|---|---|---|---|
| **auth** | GetStarted, Welcome, WelcomeBack, Phone, Register (+Success), OtpVerify, VerificationChoice, VerifyEmail (+Prompt), Forgot/NewPassword, PasswordResetSuccess, PinSetup, PinVerify | `authStore.ts` | `screens/phone/validators.ts`, `screens/register/validators.ts` |
| **elderly** | Home, Appointments, Camera, Chat, EditProfile, EmergencyContacts, Health, HealthReport, Medication, MedicationHistory, Profile, QRInvite | `elderlyStore`, `chatStore`, `checkinStore`, `googleFitStore`, `healthMetricStore`, `healthReportStore`, `medicationStore` | `components/ProactiveReminderCard.tsx`; `screens/elderlyHome/CheckinPanel.tsx` |
| **family** | Camera, Alerts, Appointments, Dashboard, Health, Medication, Profile, HealthThreshold, PremiumPlans, WeeklySummary, ScanQR | `appointmentStore`, `cameraStore`, `emergencyEventStore`, `familyStore`, `healthThresholdStore`, `paymentStore`, `weeklySummaryStore` | `components/SosAlertOverlay.tsx` |
| **medication** | — (screens live under `elderly` / `family`) | — | `services/medicationCatalogApi.ts`, `medicationReminderService.ts` |
| **notifications** | NotificationsScreen, NotificationSettingsScreen | `notificationStore`, `notificationSettingsStore` | — |

### `shared/` — cross-feature primitives

- `components/` — `ToastHost.tsx`, `toastStore.ts`
- `schemas/index.ts` — validation schemas
- `types/index.ts` — shared TS types
- `utils/crossPlatformAlert.ts`

### Notes

- `family/screens/CameraScreen.tsx` (family-side camera view) is separate from `elderly/screens/ElderlyCameraScreen.tsx` — don't conflate when working on the camera module.
- No `api/services` folder per backend-feature (e.g. no dedicated `authApi.ts`) except `medication/services/`. Most feature stores call `core/api/client.ts` directly — verify the actual call pattern in a store file before assuming a convention.
- App entry point: root `App.tsx` / `index.ts` (not under `src/`).
- Demo accounts (seed profile only): elderly `+84912345001`, family `+84918111001`, password `Demo@1234` for all. Full list in `README.md` → "Demo Data".

## General notes

- No `Payment` / `ImouApi` mock or sandbox flag confirmed — verify against `PaymentService` / `ImouApiService` before assuming real vs. sandbox integration.
- Camera module (`CameraController`, `CameraService`, `ImouApiService`, `CameraDevice`, `CameraSnapshot`) is the newest addition (Module 8, UC-26–UC-33) — cross-check against the use case spec when working here.
