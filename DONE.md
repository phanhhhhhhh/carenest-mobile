# CareNest — Pre-Demo Hardening: Summary

Commits are listed oldest → newest. Each line: what changed and why it mattered for the demo.

## Security / correctness hardening (earlier session)

- `466c7a9` **fix: security hardening, N+1 query fixes, contract mismatches, and runtime validation** — foundational cleanup pass across backend/frontend before feature work began.
- `fbcb37f` **chore: clean up unused imports and null-safety warnings** — reduced IDE noise that was masking real warnings.
- `4df540a` **chore: use non-secret-looking placeholders in .env.example** — avoided secret-scanner false positives on the committed example file.
- `6081a23` **fix: resolve pre-demo blockers (port mismatch, seed passwords, chat crash, register regression)** — four separate bugs that would have broken the demo outright: wrong API port, no known demo login passwords, a chat screen crash, and a broken registration flow.

## Phase 1 stability + audit-driven fixes (this ultrawork run, part 1)

- `8b10a9d` **perf: wire family dashboard to aggregate GET /dashboard/family/{id}** — replaced 3 sequential requests (elderly list, medications, medication-logs) with the backend's purpose-built aggregate endpoint.
- `ab21a7a` **fix: queue deep-link push notification payload until nav + auth are ready** — cold-starting the app from a tapped push notification raced `NavigationContainer`'s mount and session restore, silently dropping the deep link. Now queued and replayed once both are ready.
- `b5af0e6` **feat: seed a resolved SOS event with linked camera snapshot** — extended the existing Java `DataSeeder` (rather than adding a redundant `seed_demo.sql`) so the emergency-alert history and camera timeline aren't empty on first demo login.
- `b32a67e` **feat: add dismissible toast system + offline-unreachable detection** — no toast primitive existed; 26 call sites across 11 stores were silently `console.warn`-ing on API failures. Added `ToastHost`/`toastStore` + a debounced "No connection" toast wired into the axios interceptor for genuine backend-unreachable cases.
- `6cc883f` **fix: SOS push notification type mismatch broke tap-to-navigate** — backend sent `type=EMERGENCY`, frontend only matched `SOS` — tapping the SOS push silently went nowhere.
- `f6afba2` **fix: validate family dashboard response + correct misleading comment** — the dashboard endpoint was the one API call skipping the codebase's zod `safeParse` pattern; also corrected a comment overstating what the aggregate endpoint replaced (the screen's full-detail widgets still load separately by design, not leftover redundancy).
- `f89eb3f` **fix: persist family-facing Notification rows for health alerts/AI insights** — the single most important fix. Family only ever got an ephemeral FCM push for threshold breaches and Gemini anomaly insights, never a persisted `Notification` row. Since FCM isn't configured in this build (no `google-services.json`), family was getting **nothing at all** for the health-anomaly-alert UC before this fix. Added `NotificationService.createForUsers()`, wired into both `HealthMetricThresholdService` and `AnomalyDetectionService`.
- `53d93de` **docs: document Imou camera live-view config gap** — README now states live view needs `IMOU_APP_ID`/`IMOU_APP_SECRET` and, even configured, opens an external link rather than an embedded player.
- `a342450` **fix: FamilyAlertsScreen was unreachable except via push notification** — the SOS/emergency history screen had no in-app entry point at all (only the push deep-link, which doesn't fire without FCM). Added a "Xem tất cả" link from the dashboard's alerts section.
- `c92b95f` **docs: add DEMO_SCRIPT.md** — 5-UC walkthrough (SOS, AI chat, health anomaly alert, family dashboard, camera) written from verified current behavior, not aspirational behavior.

## Phase 2/3 polish pass (this ultrawork run, part 2 — scoped strictly to DEMO_SCRIPT.md's tap path)

- `fc3f98b` **fix(ElderlyHealthScreen): silent failure when saving a health reading fails** — `addMetric`'s error state was invisible once any reading already existed (true for every demo account), and the add-reading dialog closed regardless of success/failure. This is the exact UC3 demo step (log a BP reading to trigger anomaly detection). Now returns a success boolean, shows a toast on failure, and only closes the dialog on success.
- `667a9c1` **fix(FamilyAlertsScreen): acknowledge/mark-all-read failures were fully silent** — both `console.warn`-only, wired to toast.
- `105c137` **fix(ElderlyHomeScreen): wire toggleTaken's onError callback to toast** — `medicationStore.toggleTaken` already supported an `onError` callback for exactly this case; neither call site (Home screen's next-dose card, the shared `ProactiveReminderCard` on the Chat screen) passed one, so a failed "Đã uống" tap silently reverted with no explanation.
- `59c5ae1` **feat(seed): add HealthMetricThreshold rows so the deterministic alert path fires** — no threshold rows existed anywhere, so `HealthMetricThresholdService`'s simple min/max check (the family-notification path fixed above) was dead code in every demo run; UC3 depended entirely on the statistical anomaly detector's sensitivity to the exact seeded history. Seeded BP/heart-rate thresholds for John Anderson so the script's "log 175 systolic" step triggers a deterministic alert as well as the statistical one.

## Screens audited in this pass (per DEMO_SCRIPT.md tap path only)

`ElderlyHomeScreen`, `ElderlyChatScreen`, `ElderlyHealthScreen`, `FamilyDashboardScreen`, `FamilyAlertsScreen`, `NotificationsScreen`, `CameraScreen`. All already had spinners (not blank-white-flash states) and reasonable empty states (icon + message, several with mascot illustrations) — no skeleton-loader work was needed since the literal defect the brief described (blank flash) wasn't present on any of them. Camera's Alert.alert-based feedback pattern for live-view/voice/privacy/motion actions was left as-is — it already surfaces failures to the user, just via a different (still non-silent) mechanism than the toast system.

## Known issues outside demo scope (found, not fixed — per this pass's "demo path only" rule)

- The family dashboard aggregate endpoint (`DashboardService`) computes `statusColor`, `statusMessage`, `activeAlerts`, `latestMetrics`, and `upcomingAppointments` server-side, but the frontend `familyStore` only consumes `elderlyId/elderlyName/healthConditions/medicationAdherence` — the rest is computed and discarded. Not a bug (the screen gets equivalent data from separate per-elderly detail stores), but worth a follow-up to either trim the backend response or use it.
- `NotificationsScreen` cards aren't tappable — no mark-as-read-on-tap interaction, even though `notificationStore.markAsRead` exists and works. Minor UX gap, not required by any of the 5 flagship UCs.
- Camera "Live View" is a real Imou API integration but requires credentials not present in this build, and even configured it's an external link launch, not an embedded in-app player (documented in README, not fixed since it needs real third-party credentials this project doesn't have).
- Payment (VNPay/MoMo) and Google Fit integrations are real but need sandbox/OAuth credentials not present in this build (pre-existing, documented in README).

---

CareNest MVP is demo-ready as of 2026-07-22. Remaining known scope boundaries: FCM push notifications require a Firebase project (`google-services.json`) not present in this build — the in-app notification list is the reliable channel for all alert UCs; Imou camera live-view and voice-call features require `IMOU_APP_ID`/`IMOU_APP_SECRET` not present in this build — snapshot capture and the check-in timeline work without them; Payment and Google Fit integrations are functional but need sandbox/OAuth credentials not present in this build.
