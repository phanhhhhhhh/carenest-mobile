# CareNest — Daily Report 23 June 2026

## Tổng quan

Sprint nặng: security hardening toàn diện (7 issues fixed), implement backend UC-02/03/04, wire 3 Flutter screens lên real API, và hoàn thiện UC-01 Auth ở mức production-ready.

| Layer | Đầu ngày | Cuối ngày | Delta |
|-------|----------|-----------|-------|
| Backend | ~35% | ~50% | +15% |
| Flutter | ~25% | ~60% | +35% |
| **Tổng thể** | **~30%** | **~55%** | **+25%** |

---

## Đã làm được

### Flutter — Web Compatibility Fix
**Commit:** `de27689`

- Skip Firebase init trên web (kIsWeb guard)
- Đổi `FirebaseAuth` thành nullable (`FirebaseAuth?`) để tránh crash khi chạy Chrome
- Fix `Null check operator used on a null value` tại `auth_repository.dart` dòng 19 và 42

### Documentation
**Commit:** `05a4f8d`

- Thêm hướng dẫn Chrome web testing (cách chạy app trên trình duyệt không cần thiết bị)
- Fix lệnh Maven PowerShell (dùng `.\mvnw` thay vì `./mvnw`)

### Backend — Security Hardening (7 Critical Issues Fixed)
**Commits:** `6e3885e` + các session state commits (`7128d4c`, `dd5b768`)

4 critical backend security fixes:

1. **DEV_PHONE profile guard** — `FirebaseService.java`: DEV_PHONE bypass chỉ được phép khi chạy profile `local` hoặc `dev`, không bao giờ trên `prod`
2. **Firebase fail-fast** — `FirebaseConfig.java`: IOException không còn bị nuốt, throw `RuntimeException` để app fail ngay khi credential sai/corrupt
3. **JWT weak secret check** — `JwtService.java`: `@PostConstruct` validation — throw exception nếu secret còn là default value và không ở dev profile
4. **Refresh token rotation** — `AuthService.java`: revoke token cũ, issue token mới trong cùng transaction → loại bỏ replay attack risk

3 Flutter security/bug fixes (từ daily review CRITICAL-5/6/7):

5. **Null guard `_firebaseAuth`** — thêm `if (kIsWeb)` guard trước khi dùng `!` operator
6. **SecurityConfig 401 fix** — unauthenticated requests trả về 401 thay vì 403
7. **ConflictException 409** — thêm `ConflictException` + `GlobalExceptionHandler` xử lý HTTP 409 cho duplicate phone number

### Backend — UC-02 ElderlyProfile (POST/GET/PUT /api/elderly-profiles)
**Commit:** `eede0f2`

- Implement `ElderlyProfileService` — create, getById, getByUserId, update
- Implement `ElderlyProfileController` — 3 endpoints: `POST /api/elderly-profiles`, `GET /api/elderly-profiles/{id}`, `PUT /api/elderly-profiles/{id}`
- Foundation cho tất cả UC tiếp theo (UC-03 đến UC-07 đều cần ElderlyId)

### Backend — UC-03 FamilyLink + UC-04 Medication
**Commit:** `83c0dc9`

- **UC-03 FamilyLink:** `FamilyLinkService` + `FamilyLinkController` — link family member với elderly, get danh sách gia đình
- **UC-04 Medication:** `MedicationService` + `MedicationController` — CRUD medications, `MedicationLogService` + `MedicationLogController` — ghi log dùng thuốc

### Flutter — Screen Wiring (3 Screens → Real APIs)
**Commits:** `64e8ae3`, `598c822`, `de7d510`

- **ElderlyMedicationScreen** (`64e8ae3`) — wire real API list/add/log qua Riverpod; thay thế hardcode data bằng `GET /api/medications`, `POST /api/medications`, `POST /api/medication-logs`
- **ElderlyHome + Profile screens** (`598c822`) — wire real API data qua Riverpod providers; tên người dùng, tuổi, thông tin hồ sơ lấy từ backend
- **FamilyDashboard** (`de7d510`) — wire real API + 30s polling để tự động refresh; graceful fallback về empty state khi endpoint `GET /api/family/{familyId}/elderly` chưa có

### UC-01 Auth — Production-Ready Completion
**Commits:** `7128d4c`, `62ac66b`, `dd5b768`, `2674dcb`

- `AuthIntegrationTest` — 9/9 integration tests pass (register, login, refresh, logout, duplicate phone 409, invalid OTP, expired token, ...)
- `application-test.properties` — JWT config riêng cho test environment
- `application-itest.properties` — direct DB connection cho integration test (thay Testcontainers không chạy được trên Windows Docker Desktop)
- `phone_screen_test` + widget test fix — flutter analyze clean, không còn warning nào
- `withOpacity` deprecation fix tại `phone_screen`
- Deslop: xóa what-comments, clean up AuthIntegrationTest
- **Kết quả:** SecurityConfig 403→401, 9/9 tests pass, flutter analyze clean — UC-01 production-ready

---

## Cần cập nhật — Dev khác đọc trước

> Nếu bạn pull code từ ngày này, cần làm các bước sau trước khi chạy app hoặc chạy test:

### Backend — File `application-local.properties` (BẮT BUỘC)

File này **không được commit** (gitignore). Mỗi dev tạo thủ công tại `backend/src/main/resources/application-local.properties`:

```properties
# DB local của bạn
spring.datasource.url=jdbc:postgresql://localhost:5433/carenest
spring.datasource.username=carenest
spring.datasource.password=carenest

# JWT secret — phải ≥ 32 ký tự, không được là default value
jwt.secret=your-local-secret-key-min-32-characters-here

# Firebase credentials
firebase.credentials-path=path/to/your/serviceAccountKey.json
```

> **Lưu ý quan trọng:** `JwtService` giờ có `@PostConstruct` check — nếu JWT secret còn là default hoặc < 32 ký tự, **app sẽ không khởi động**.

### Backend — Database `carenest_test` cho Integration Tests

Integration tests (`AuthIntegrationTest`) dùng profile `itest` — cần database `carenest_test` tồn tại trên Docker container:

```bash
# Chạy một lần duy nhất trên máy của bạn
docker exec -it carenest_db psql -U carenest -c "CREATE DATABASE carenest_test;"
```

Sau đó chạy test bằng:
```bash
cd backend
.\mvnw test -Dspring.profiles.active=itest
```

> **Lý do:** Testcontainers không chạy được trên Windows Docker Desktop (API version mismatch). Thay vào đó dùng direct connection tới DB local.

### Backend — Firebase credentials path

- File `serviceAccountKey.json` **không được commit** vào git
- Đường dẫn trong `application-local.properties` phải trỏ đúng tới file của bạn
- Nếu chạy test: `firebase.credentials-path=` (để trống) trong `application-test.properties` là đúng — Firebase được mock trong tests

### Flutter — Không có thay đổi dependencies ngày này

Không có package mới. Chỉ cần đảm bảo file `.env` đã có `GEMINI_API_KEY` (từ ngày 22/06).

---

## Vấn đề gặp phải

- **Testcontainers không chạy được trên Windows Docker Desktop** → switch sang direct DB connection với `application-itest.properties` (profile `itest`). Integration tests chạy trực tiếp trên local PostgreSQL thay vì container.
- **FamilyDashboard thiếu `GET /api/family/{familyId}/elderly` endpoint** → implement graceful fallback empty state. Endpoint này cần được thêm vào sprint tới để unblock FamilyDashboard hoàn toàn.
- **SecurityConfig trả 403 thay vì 401 cho unauthenticated requests** → fixed tại `dd5b768`. HTTP semantics: 401 = unauthenticated (chưa login), 403 = unauthorized (đã login nhưng không có quyền).

---

## Kết quả cuối ngày

- **Backend:** ~50% (UC-01 production-ready, UC-02/03/04 implemented, 9/9 integration tests pass)
- **Flutter:** ~60% (3 screens wired to real API, widget tests, flutter analyze clean)
- **Tổng thể: ~55%**

| UC | Backend | Flutter | Status |
|----|---------|---------|--------|
| UC-01 Auth | DONE | DONE | **PRODUCTION-READY** |
| UC-02 ElderlyProfile | DONE (service+controller) | Partial (UI hardcode) | **WIP** |
| UC-03 FamilyLink | DONE (service+controller) | Partial | **WIP** |
| UC-04 Medication | DONE (service+controller) | DONE (wired) | **WIP** |
| UC-05 HealthMetrics | Partial (entity+repo) | Partial | **BLOCKED** |
| UC-06 Appointment | Partial (entity+repo) | Not started | **BLOCKED** |
| UC-07 Emergency/SOS | Partial (entity+repo) | Partial (API not wired) | **BLOCKED** |
| UC-08 Reminders | Partial (entity+repo) | Not started | **BLOCKED** |
| UC-09 Notifications | Partial (entity+repo) | Partial | **BLOCKED** |

---

## Sprint tuần tới

1. **UC-02 ElderlyProfile — Flutter wiring** — màn hình profile chưa gọi API thực sự (còn dùng hardcode một phần)
2. **`GET /api/family/{familyId}/elderly` endpoint** — unblocks FamilyDashboard hoàn toàn, hiện đang fallback empty state
3. **UC-05 HealthMetrics — Backend service + controller** — cần cho chart data và Gemini context
4. **UC-06 Appointment — Backend + Flutter** — calendar/scheduling feature
5. **UC-07 Emergency/SOS — Backend service + controller** — CRITICAL: tính năng an toàn, SOS button hiện chỉ hiện SnackBar, chưa gọi API
6. **CORS env var** — đọc `ALLOWED_ORIGINS` từ env var trước khi deploy (`Q-5`)
7. **Flutter base URL config** — `--dart-define=BASE_URL=...` thay vì hardcode (`Q-7`)

---

*Báo cáo tổng hợp cuối ngày 23/06/2026 — CareNest team*
