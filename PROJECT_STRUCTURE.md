# CareNest — Project Structure Reference

> Purpose: help an AI assistant locate the right file for a given feature without
> guessing. Jump straight to the right layer instead of scanning the whole tree.
>
> Status: backend map confirmed from repo listing (Sept 2026); frontend map
> confirmed against `src/` on 2026-09-02. Keep this file in sync when modules move.
> This repo is a **monorepo**: React Native / Expo app at the root (`src/`), Spring
> Boot backend under `backend/`, and a small Vite/React operator console under
> `admin-web/` (see "Admin web panel" near the end).

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
- **A2 Family Care Feed** — built. Backend: `feed_reactions` table (migration `V40`),
  `FeedReaction`/`FeedItemType`, `FamilyFeedController` (`GET /api/elderly/{id}/feed`,
  `POST .../feed/react`), `FamilyFeedService` (unions check-ins + medication logs +
  emergency events into one timeline; per-item generic `handled` flag, never who acted).
  Frontend: `features/family/store/feedStore.ts`, `familyFeed/FeedRow.tsx`,
  `FamilyFeedScreen.tsx` (stack route `FamilyFeed`); the dashboard's old
  "Cảnh báo & Sự cố" section is now a feed preview. `useDashboardActivity` +
  `ActivityCard` were deleted. "Thả tim" persists a reaction; the elderly-device
  sound feedback is NOT built yet.
- **A3 Free Broadcast (sequential) + A4 Escalation** — built. Migration `V41`:
  `family_links` gains `availability_status` (`AvailabilityStatus` FREE/BUSY),
  `last_ack_at`, `last_notified_at`; new `family_broadcasts` table. Backend:
  `NotificationBroadcastService` (pages one FREE member at a time, oldest-notified
  first; escalates to the whole family once the FREE list is exhausted or 2 h pass),
  `BroadcastEscalationScheduler` (`@Scheduled`, advances at 15 min), `FamilyBroadcastController`
  (`GET /api/elderly/{id}/broadcasts/active`, `PATCH /api/broadcasts/{id}/acknowledge`),
  `PATCH /api/family-links/{id}/availability`. Trigger this iteration: an unwell
  check-in (mood 3) — wired in `CheckInService`. Never used for SOS. Frontend:
  `availabilityStore.ts` + `familyDashboard/AvailabilityChip.tsx` (header toggle),
  `broadcastStore.ts` + `familyDashboard/BroadcastBanner.tsx` (dashboard "Tôi lo được").
  Config: `carenest.broadcast.*` in `application.properties`.
- Flyway is at **V48**; next migration is V49. (`V47` relaxes the `payment_provider`
  CHECK to allow `'VIETQR'` — `PaymentService.createVietQrPayment` persists it and the
  original `V20` constraint rejected it, so VietQR payment creation was broken.)

Premium-plan rework (2026-09-08, on `develop` — commits `0b03d99` / `4e1d1cc`, not yet on `main`):
- Plan limits are **count-based** (`SubscriptionService` constants): FREE = 1 elderly + 1
  family account; PREMIUM = 4 elderly + 6 family. `canAddElderly` / `canAddFamilyMember`
  enforce; `FamilyLinkService.create` throws `PaymentRequiredException` (Vietnamese copy)
  when either cap is hit.
- `SubscriptionService.isPremium(familyId)` is **group-shared**: true if the user has a
  direct PREMIUM_* subscription **or** any family co-linked to one of their linked elderly
  has one (`findByUserIdInAndStatusAndPlanTypeIn`). It resolves the group family→elderly, so
  it only makes sense for a **family** id. `isPremiumForElderly(elderlyId)` (added 2026-09-08)
  is the elderly-facing counterpart — direct plan OR any actively-linked family has Premium —
  and is what `ChatService` uses for the AI-chat quota. Callers of `isPremium`:
  `FamilyFeedService`, `MedicationReminderScheduler`, `PaymentService`, `HealthReportExportController`.
- Yearly price 499k → **490k**; plan names "Premium Hàng tháng / năm" (was "CareNest Family Plus").
- **PRO tier**: migration `V46` widens `plan_type` to allow `PRO_MONTHLY` / `PRO_YEARLY`,
  but `isPro()` / `isPro` are hard-`false` on BE and FE — scaffolding only.
- `FamilyLinkController` `@PreAuthorize` widened so an already-linked family can create a link
  request for the same elderly (`@authz.isOwnerOrLinkedFamily`). `FamilyLinkService.create`
  keeps writing **`PENDING`** (E4): the phone-number path opens a request the elderly accepts
  via the `FAMILY_LINK_REQUEST` notification (`PATCH /family-links/{id}/status`). The QR path
  still links `ACTIVE` on scan because the elderly initiates it. (The rework briefly made
  `create` write `ACTIVE`; restored to `PENDING` on 2026-09-08.)
- Backend tests green offline: `SubscriptionServiceTest` (15), `FamilyLinkServiceTest` (3),
  `PaymentServiceTest` (5), `FamilyLinkRepositoryTest` (7). `AuthIntegrationTest` still needs
  a running Postgres.

Built in the 2026-09 v3.5 catch-up pass (spec-compliance work):
- **A5 chat quota** — `carenest.chat.free-daily-limit` (default 5) enforced in
  `ChatService`; over-limit → `PaymentRequiredException` (402), `ChatResponse.remainingFreeMessages`.
  Emergency-sounding messages short-circuit to an SOS steer (`intent=EMERGENCY`).
- **A6 AI Family Digest** — `FamilyDigestService` + `FamilyDigestScheduler` (20:00 ICT,
  `carenest.digest.*`), `FamilyDigestController` (`GET /api/family/digest/latest`,
  `POST /api/elderly/{id}/digest/generate`). Frontend `familyDigestStore.ts` + `FamilyDigestScreen`.
- **A7 Visit Streak** — migration `V42` (`family_visits`, `family_visit_settings`),
  `FamilyVisit`/`FamilyVisitSettings`/`VisitCycleType`, `VisitStreakService`,
  `VisitStreakScheduler` (streak break + Tết/birthday reminders, `carenest.visit.*`),
  `VisitStreakController`. Feed gains `FeedItemType.VISIT`. Frontend `visitStreakStore.ts`
  + `FamilyVisitStreakScreen` (manual "Xác nhận đã về thăm", no camera auto-detect).
- **D1 camera consent** — migration `V43` (`elderly_profiles.camera_consent_*`),
  `CameraConsentStatus`, `CameraConsentService` (gates `bindCamera`/live/two-way; SOS
  snapshot records-but-does-not-block), `CameraConsentScheduler` (single 30-day re-ask).
  Frontend `cameraConsentStore.ts` + `ElderlyCameraConsentScreen`.
- **D2 Link Camera** — signed regional IMOU `/openapi/{method}` transport; binding ownership
  verification, idempotent developer-account handling, confirmed online/offline state,
  `listDeviceAbility`, migration `V48` capability persistence, stable provider errors, and a
  consent-aware Family linking modal with ephemeral verification-code handling. Physical-camera
  verification and native setup for newer SDK-only devices remain explicitly pending; see
  `CAMERA_D2_SETUP.md`.
- **Camera authz hardening (2026-09-09, on `develop`)** — every device-scoped
  `CameraController` endpoint (`unbind`, `live`, `motion-detection`, `voice/start|stop`,
  `ptz`, `privacy`, `status` — 8 total) dropped its `or hasRole('ADMIN')` clause; they are
  now `@authz.canAccessCamera(...)` only (owner elderly + ACTIVE-linked family). The old
  override was dead — the `admin-web/` console only calls `/api/admin/**` + payment — and
  contradicted D1 consent. No tests touched this path. Resolves the "ADMIN camera
  super-user" flag.
- **D7 timed Privacy Mode** — `camera_devices.privacy_mode_expires_at`,
  `CameraService.setPrivacyMode(id, enabled, hours)` + `expirePrivacyWindows()` (60s poll,
  auto-restore + family notice).
- **G3** — VietQR/NAPAS + **manual reconciliation** (`PaymentService.createVietQrPayment` /
  `confirmManualPayment`, `POST /api/payment/vietqr/{create,confirm}`); yearly price
  fixed 399k → 499k (later **490k** in the 2026-09-08 rework); `/plans` features list the
  current premium benefits.
  (VNPay/MoMo gateways left in place as secondary.)
- **B1/B2** — `MedicationScheduleCalculator.previousDoseTime` + `MedicationReminderScheduler.sweepMissedDoses`
  auto-logs MISSED doses (`carenest.medication.missed-grace-minutes`, default 90).
  `medications.voice_url` (V44) + `MedicationRequest/Response.voiceUrl`; `MedicationVoiceService` +
  `POST /api/medications/parse-voice` (multipart audio → transcribe → Gemini extract →
  `MedicationDraftResponse`, confirm-before-save). Custom reminder voice is put in the
  reminder FCM payload only when a linked family member is Family Plus
  (`MedicationReminderScheduler` checks `voiceUrl` non-blank + `hasPremiumFamily`).
  **Front-end voice — built (2026-09-07).** Shared recorder `features/medication/hooks/
  useVoiceClipRecorder.ts` (record `.m4a` → `audio/mp4`, permission + audio-mode + cap +
  unmount cleanup). Two features on top:
  · **Voice entry (B1)** — `useMedicationVoiceInput` → `medicationVoiceApi.parseMedicationVoice`
    → `medicationVoiceDraft.draftToMedicationPrefill` (shifts ISO day-of-week 1=Mon to the
    form's 0=Mon index) + `voiceReviewHint`; schema `MedicationVoiceDraftSchema`. UI:
    `VoiceCaptureRow` "Đọc để điền nhanh".
  · **Custom reminder voice (B2)** — record: `useReminderVoiceRecorder` →
    `cloudinaryUpload.uploadVoiceClip` (unsigned preset, `EXPO_PUBLIC_CLOUDINARY_*`,
    `AppConfig.cloudinary`) → stores the `secure_url` as `medication.voiceUrl`. UI:
    `ReminderVoiceSection` in the family `MedicationForm` — hidden unless Cloudinary is
    configured, locked with a "Family Plus" note unless `subscription.isPremium`
    (`usePaymentStore`), record / re-record / remove / preview.
    Playback: `reminderVoicePlayer` (imperative one-shot) plays the clip when a
    `MEDICATION_REMINDER`/`MEDICATION_SNOOZE` notification carrying `voiceUrl` is received
    in the foreground or tapped (`pushNotificationService`); `medicationReminderService`
    now copies `med.voiceUrl` into the local scheduled-reminder `data`.
    `PlayVoiceReminderButton` ("Nghe lời nhắc", `useAudioPlayer`) on the elderly
    `DueBanner` + `MedRow` for manual replay. `notificationVoiceData.extractVoiceUrl` is the
    pure payload parser (kept expo-audio-free so it's unit-testable).
  Voice entry + `ReminderVoiceSection` are in the **family** `MedicationForm` only (elderly
  med screen has no add form). Tests: `medicationVoiceDraft.test.ts`, `cloudinaryUpload.test.ts`,
  `notificationVoiceData.test.ts`.
  Known limit: background/killed playback of a remote clip needs a native module, so the
  auto-play is foreground-only; the elderly's own med list carries `voiceUrl` regardless of
  premium (gate is on record + on FCM), so a post-downgrade clip still plays locally.
- **A2** — feed retention now plan-aware (7 d free / unlimited Plus); heart reaction sends
  warm FCM feedback to the elderly device.
- **D5** — `FeedItemType.CAMERA`; scheduled/manual camera snapshots unioned into the Feed
  (SOS snapshots stay under the EMERGENCY item; motion-window alerts remain notification-only).
- **E4** — only the elderly may activate a pending family link (`FamilyLinkService.updateStatus`
  guards `actingUserId == link.elderly.id`). The phone-number path (`POST /api/family-links`)
  creates the link `PENDING`; the elderly accepts/declines from the `FAMILY_LINK_REQUEST`
  notification (`respondToFamilyLinkRequest` → `PATCH /family-links/{id}/status`).
- Compliance: `PrivacyPolicyScreen` linked from Register; sensitive-data notes.
- SOS fixes: `acknowledgeAllForUser` no longer resolves ACTIVE events; secondary contact
  only added at escalation Level 2; escalation titles say "CẤP ĐỘ 1" / "CẤP ĐỘ 2" matching level.
- G3 operator: `GET /api/payment/pending` + `POST /api/payment/vietqr/{confirm,reject}` (all
  `hasRole('ADMIN')`). `reject` marks the PENDING subscription `CANCELLED`
  (`PaymentService.rejectManualPayment`, guards `ALREADY_ACTIVE` / `NOT_PENDING`).
  `DataSeeder` seeds one admin (`+84900000001` / `admin@carenest.test` / `Demo@1234`) +
  2 PENDING VietQR subscriptions. Tests: `PaymentServiceTest` (5, offline). The operator
  UI is the **standalone `admin-web/` app** (Vite + React), not part of the mobile app —
  see the "Admin web panel" section below.
- **Premium PDF health-report export** (kept — team decision 2026-09-07, overrides the
  v3.5 "drop PDF export" line; released to `main` in merge `6f10b55`).
  `HealthReportExportController` (`GET /api/elderly/{id}/health-report.pdf`,
  `hasRole('FAMILY')` + `@authz.isOwnerOrLinkedFamily`). `SubscriptionService.requirePremium`
  throws `PaymentRequiredException` → **402** for non-premium callers; range is capped at
  365 days. `HealthReportService.generateReport` builds the shared aggregate (metrics +
  medication adherence + appointment summary + latest stored weekly summary);
  `HealthReportPdfService` renders it on demand with **openpdf 3.0.5** and an embedded
  `NotoSans-Regular.ttf` (Vietnamese glyphs), 2 000-row detail cap with an in-PDF disclosure,
  medical disclaimer — no server-side file storage. `SubscriptionService.isPremium` filters
  on `PlanType IN (PREMIUM_MONTHLY, PREMIUM_YEARLY)`. Tests: `HealthReportExportControllerTest`,
  `HealthReportPdfServiceTest`, `SubscriptionServiceTest`.
  Frontend: `family/services/healthReportExportService.ts` (DI-based; validates the `%PDF`
  magic bytes + content-type, writes to the cache dir, opens the native share sheet;
  maps 401→session-expire, 402→premium prompt, 403→forbidden) and
  `family/screens/familyHealth/exportFlow.ts` (client-side premium gate + 7-day/30-day range).
  The accessible “Xuất PDF” action sits in the `FamilyHealthScreen` app bar. Deps:
  `expo-file-system`, `expo-sharing`.

Still to do: optionally, background/killed playback of `medication.voiceUrl` (needs a native
module — foreground auto-play + manual replay are built, see B2 note above). The ADMIN
payment-reconciliation UI is the standalone `admin-web/` app (see below).

QR link flow — **KEPT** (team decision 2026-09-07, overrides the v3.5 "drop QR scanner"
line). `ElderlyQRInviteScreen`, `FamilyScanQRScreen`, `familyScanQR/`, `elderlyQRInvite/`,
`InviteController`/`InviteTokenService`, `core/api/inviteApi.ts` and the dashboard/profile
entry points stay. Linking has two coexisting paths: QR (elderly generates token → family
scans → link `ACTIVE` immediately, since the elderly initiated it) and phone-number
(`POST /api/family-links` → `PENDING` → elderly accepts via the `FAMILY_LINK_REQUEST`
notification, per UC E4).

Dropped from roadmap: Zalo OA, prescription-photo storage,
camera-based visit auto-detect.

## Backend (`backend/src/main/java/com/carenest/backend/`)

Standard layered Spring Boot structure: `controller` → `service` → `repository` → `entity`, with `dto` per feature and cross-cutting `config`/`security`/`scheduler`/`exception`.

### Feature → Controller → Service → Entity map

| Feature / Module | Controller | Service(s) | Entity(ies) |
|---|---|---|---|
| Auth (register/login/OTP/PIN) | `AuthController` | `AuthService`, `JwtService`, `OtpService` | `User`, `UserRole`, `RefreshToken`, `OtpVerification` |
| User & notification prefs | `UserController` | `UserService`, `FcmService` | `NotificationPreferences` |
| Elderly profile | `ElderlyProfileController` | `ElderlyProfileService` | `ElderlyProfile`, `EmergencyContact` |
| Family linking + availability (A3) | `FamilyLinkController` | `FamilyLinkService` | `FamilyLink`, `FamilyLinkStatus`, `AvailabilityStatus` |
| Free Broadcast / escalation (A3/A4) | `FamilyBroadcastController` | `NotificationBroadcastService` (+ `BroadcastEscalationScheduler`) | `FamilyBroadcast`, `BroadcastStatus`, `BroadcastTriggerType` |
| Camera monitoring (IMOU) | `CameraController` | `CameraService`, `ImouApiService` | `CameraDevice`, `CameraSnapshot` |
| Emergency / SOS | `EmergencyEventController` | `EmergencyEventService` | `EmergencyEvent`, `EmergencyStatus` |
| Daily check-in (A1) | `CheckInController` | `CheckInService` | `CheckIn`, `CheckInSource` |
| Family Care Feed (A2) | `FamilyFeedController` | `FamilyFeedService` | `FeedReaction`, `FeedItemType` (feed items are aggregated, not stored) |
| Health metrics + Premium PDF export | `HealthMetricController`, `HealthMetricThresholdController`, `HealthReportExportController` | `HealthMetricService`, `HealthMetricThresholdService`, `HealthReportService`, `HealthReportPdfService`, `HealthSyncService`, `AnomalyDetectionService` | `HealthMetric`, `HealthMetricType`, `HealthMetricThreshold` |
| Google Fit integration | `GoogleFitController` | `GoogleFitService` | `GoogleFitToken` |
| Medication | `MedicationController`, `MedicationCatalogController`, `MedicationLogController` | `MedicationService`, `MedicationCatalogService`, `MedicationLogService`, `MedicationScheduleCalculator` | `Medication`, `MedicationCatalogItem`, `MedicationLog`, `MedicationLogStatus`, `MedicationSchedule` |
| Reminders | `ReminderController` | `ReminderService`, `SchedulerStateService` | `Reminder`, `RepeatRule`, `SchedulerState` |
| Appointments | `AppointmentController` | `AppointmentService` | `Appointment`, `AppointmentStatus` |
| Chatbot (Gemini) | `ChatController`, `VoiceController` | `ChatService`, `ChatReminderService`, `GeminiApiService`, `SpeechToTextService` | `ChatMessage` |
| Dashboard (family view) | `DashboardController` | `DashboardService` | — (aggregates other entities) |
| Notifications (push/SMS/email) | `NotificationController` | `NotificationService`, `FcmService`, `SmsService`, `EmailService`, `FirebaseService` | `Notification`, `NotificationType` |
| Payments / subscription | `PaymentController` | `PaymentService`, `SubscriptionService` | `Subscription` |
| Admin console (read-only, ROLE_ADMIN) | `AdminController` | `AdminService` | — (aggregates; `dto/admin/Admin*Response`). Serves the standalone `admin-web/` app — see section below. |

### Cross-cutting

- `config/` — `FirebaseConfig`, `SecurityConfig`, `WebMvcConfig` + `AdminAuditInterceptor` (one `ADMIN_AUDIT` log line per admin-console / payment-operator request)
- `security/` — `JwtAuthenticationFilter`, `RateLimitFilter`, `AuthorizationService`
- `scheduler/` — `AppointmentReminderScheduler`, `MedicationReminderScheduler`, `ReminderScheduler`, `HealthCheckScheduler`, `WeeklySummaryScheduler`, `BroadcastEscalationScheduler`, `EmergencyEscalationScheduler`, `VisitStreakScheduler`, `FamilyDigestScheduler`, `CameraConsentScheduler` (no subscription-expiry job — `Subscription` rows never move to `EXPIRED`; `endDate` is the real gate and `SubscriptionService` filters on `Subscription.isPremium()`)
- `exception/` — `GlobalExceptionHandler` + `ConflictException`, `NotFoundException`, `UnauthorizedException`, `PaymentRequiredException`, `RateLimitExceededException`, `GeminiApiException` (`IllegalArgumentException` → 400)
- `seeder/` — `DataSeeder` — `@Profile({"local","dev"})` **and** `carenest.seed.enabled=true` (both required); skips if `users` table is non-empty. Seeds 5 elderly + 10 family + **1 ADMIN** (`+84900000001` / `admin@carenest.test`, password `Demo@1234`) + demo data incl. 1 ACTIVE + 2 PENDING VietQR subscriptions.
- `dto/` — grouped by feature subpackage (`auth`, `camera`, `chat`, `dashboard`, `elderly`, `emergency`, `family`, `googlefit`, `health`, `medication`, `notification`, `payment`, `reminder`, `appointment`, `user`, **`admin`**)

### Config / run

- `application.properties` — base config: `server.port=8082`, `jwt.secret=${JWT_SECRET}` (no default — must be set), `cors.allowed-origins` default `http://localhost:8082`, `spring.data.web.pageable.max-page-size=100`.
- `application-dev.properties` — `carenest.seed.enabled=true`, verbose SQL/Flyway logging, a **dev-only `jwt.secret` fallback**. **This is the profile the mobile `.env` expects** (`EXPO_PUBLIC_API_BASE_URL` → `:8082/api`). Port inherited from base = **8082**.
- `application-local.properties` — seed enabled; no port override, so also **8082**.
- DB: PostgreSQL on `localhost:5433` (via `docker-compose.yml`, which runs Postgres only — not the backend). Default creds `carenest` / `carenest`.
- Actuator health: `GET /actuator/health` (NOT under `/api`; unauthenticated). Everything under `/api/**` needs a JWT except `/api/auth/**`; `/api/admin/**` additionally requires `ROLE_ADMIN` (URL rule + class-level `@PreAuthorize`).
- Run: `java -jar backend/target/carenest-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev`

### Tests (`backend/src/test/java/com/carenest/backend/`) — ~152 tests, `mvn -o test`

- `controller/` — `AdminControllerSecurityTest` (`@WebMvcTest`, ADMIN gate), `CheckInControllerTest`, `HealthReportExportControllerTest`, `AuthIntegrationTest` / `AppointmentIntegrationTest` / `NotificationIntegrationTest` (need a running Postgres — the only red tests offline)
- `service/` — `AdminServiceTest`, `SubscriptionServiceTest`, `FamilyLinkServiceTest`, `PaymentServiceTest`, `NotificationBroadcastServiceTest`, `VisitStreakServiceTest`, `EmergencyEscalationServiceTest`, `CameraTokenRefreshServiceTest`, `CameraTokenUpdaterTest`
- `repository/` — `BaseRepositoryTest` + repo tests for `Appointment`, `FamilyLink`, `HealthMetric`, `Medication`, `User`, `CheckIn`
- `config/` — `ImouPropertiesTest`

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
| **family** | Camera, Alerts, Appointments, Dashboard, Feed, Health (Premium PDF export), Medication, Profile, HealthThreshold, PremiumPlans, WeeklySummary, ScanQR | `appointmentStore`, `availabilityStore`, `broadcastStore`, `cameraStore`, `emergencyEventStore`, `familyStore`, `feedStore`, `healthThresholdStore`, `paymentStore`, `weeklySummaryStore` | `services/healthReportExportService.ts`, `screens/familyHealth/exportFlow.ts`; `components/SosAlertOverlay.tsx`; `screens/familyFeed/FeedRow.tsx`; `screens/familyDashboard/{AvailabilityChip,BroadcastBanner}.tsx` |
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

## Admin web panel (`admin-web/`)

Full operator console — a normal web app, **not** part of the Expo app. Vite + React 19
+ TypeScript, no UI framework. Excluded from root eslint / tsc / prettier.

Backend: `AdminController` (`/api/admin/**`, all `@PreAuthorize("hasRole('ADMIN')")`) →
`AdminService` + `dto/admin/Admin*Response` records. Read-only, paginated (Spring `Page`),
filter via query params. Endpoints: `/overview`, `/users` (+ `/users/{id}` detail),
`/subscriptions`, `/elderly`, `/family-links`, `/emergencies`, `/check-ins`, `/medications`,
`/health-metrics`, `/cameras`, `/notifications`, `/appointments`. Repos gained `count*` and
`findForAdmin(...)` `@Query` methods (JOIN FETCH to avoid N+1). Tests: `AdminServiceTest`.

Frontend:
- `src/api.ts` — `fetch` wrapper; JWT from `POST /api/auth/login` in `localStorage`
  (`carenest_admin_token`); `/auth/login` is sent `anonymous` (no stale token); 401/403 on
  an authed call clears the session.
- `src/App.tsx` — login ↔ shell; owns the `/overview` fetch (sidebar badges + Overview page).
- `src/Layout.tsx` + `src/useHashRoute.ts` — sidebar, `#/…` routing, PENDING-links /
  active-SOS badges.
- `src/ResourceListPage.tsx` — generic filtered+paginated table; each `pages/resources.tsx`
  page is just columns + filters + a fetcher.
- `src/pages/` — `OverviewPage`, `UsersPage` (+ detail drawer), `SubscriptionsPage`,
  `PaymentsPage` (confirm/reject), and the `resources.tsx` bundle (elderly, family-links,
  emergencies, check-ins, medications, health-metrics, cameras, notifications, appointments).
- `src/components.tsx` (`PageHeader`/`StatCard`/`StateBlock`/`Pagination`/`Badge`), `src/format.ts`.
- Dev: `npm install && npm run dev` (`:5174`); the proxy forwards `/api` → `:8082`
  **without `changeOrigin`** (keeps it same-origin — with it, the backend rejects POSTs as
  "Invalid CORS request"). `VITE_API_TARGET` overrides the backend URL. Build → `dist/`
  (static); a different deploy origin needs adding to `cors.allowed-origins`.
- Login: seeded ADMIN `+84900000001` / `Demo@1234` (dev/local; `DataSeeder` also seeds 2
  PENDING VietQR subs). See `admin-web/README.md`.

## General notes

- No `Payment` / `ImouApi` mock or sandbox flag confirmed — verify against `PaymentService` / `ImouApiService` before assuming real vs. sandbox integration.
- Camera module (`CameraController`, `CameraService`, `ImouApiService`, `CameraDevice`, `CameraSnapshot`) is the newest addition (Module 8, UC-26–UC-33) — cross-check against the use case spec when working here.
