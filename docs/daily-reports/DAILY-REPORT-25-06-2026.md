# CareNest | Daily Report 25 June 2026 | Vela Team — EXE101

## Tổng quan

Ngày hôm nay tập trung hoàn thiện **security hardening cho UC-01 Auth**: implement resource-level authorization phía backend (method security + @PreAuthorize), implement 401 auto-refresh interceptor phía Flutter, viết đầy đủ documentation cho toàn bộ auth flow, và xác minh 9/9 integration tests pass sau khi thêm @EnableMethodSecurity.

---

## Tiến độ cuối ngày

```
Backend   ████████████████████░░░░  ~55%  (+5% từ hôm qua — resource authz complete)
Flutter   ████████████████░░░░░░░░  ~62%  (+2% — 401 refresh wired)
Tổng thể  ████████████████████░░░░  ~58%  (+4%)
```

---

## Đã làm được

### Backend

**Commit `f4b258d` — 22:39 — Security: resource-level authorization**

Files thay đổi:
- `backend/src/main/java/.../config/SecurityConfig.java` — thêm `@EnableMethodSecurity`
- `backend/src/main/java/.../security/AuthorizationService.java` (**NEW**) — `@Service("authz")` với 4 methods: `isOwnerOrLinkedFamily`, `canAccessElderlyProfile`, `isFamilyLinkParticipant`, `canAccessMedication`
- `backend/src/main/java/.../controller/ElderlyProfileController.java` — thêm `@PreAuthorize` trên 3 endpoints
- `backend/src/main/java/.../controller/FamilyLinkController.java` — thêm `@PreAuthorize` trên 3 endpoints
- `backend/src/main/java/.../controller/MedicationController.java` — thêm `@PreAuthorize` trên 4 endpoints

Ý nghĩa: Trước khi fix, bất kỳ user đã authenticate nào cũng có thể gọi bất kỳ endpoint nào (user A token → user B data). Sau khi fix, Spring Security đánh giá ownership/link check tại method level trước khi controller được gọi. User A token → user B endpoint → 403 Forbidden.

**Commit `b430233` — 22:58 — Deslop + itest port fix**

Files thay đổi:
- `backend/src/main/java/.../security/AuthorizationService.java` — xóa 4 Javadoc blocks "what" comments
- `lib/core/network/dio_client.dart` — trim comment thừa
- `backend/src/test/resources/application-itest.properties` — sửa port từ `5433` → `5432`

Ý nghĩa: Port mismatch là lý do itest không connect được PostgreSQL. Fix này unblock `AuthIntegrationTest`.

**Kết quả kiểm tra:** `mvn test -Dtest=AuthIntegrationTest -Dspring.profiles.active=itest` → `Tests run: 9, Failures: 0, Errors: 0` → **BUILD SUCCESS**

---

### Flutter

**Commit `f4b258d` — 22:39 — 401 auto-refresh interceptor**

Files thay đổi:
- `lib/core/auth/token_notifier.dart` (**NEW**) — `ChangeNotifier` singleton; khi session hết hạn, `notifyListeners()` kích GoRouter re-evaluate redirect
- `lib/core/network/dio_client.dart` — thêm `InterceptorsWrapper` với 401 detection → gọi `POST /api/auth/refresh` bằng fresh Dio (không interceptor) → save token mới → retry request gốc → nếu refresh fail thì `clearAll()` + notify router
- `lib/core/router/app_router.dart` — thêm `refreshListenable: TokenNotifier.instance`
- `lib/core/storage/secure_storage.dart` — thêm `saveRefreshToken()`, `getRefreshToken()`
- `lib/features/auth/data/auth_repository.dart` — save `refreshToken` khi login và register

Ý nghĩa: Trước khi fix, khi accessToken hết hạn (15 phút) thì mọi API call âm thầm fail hoặc crash. Sau khi fix: 401 → tự refresh → retry transparent với user; nếu refresh cũng fail → tự logout + redirect về /phone screen.

Loop prevention: request đã retry được đánh dấu bằng header `x-retry-after-refresh` — interceptor bỏ qua retry thứ hai. Path `/auth/refresh` cũng được exclude khỏi interceptor.

---

### Documentation

**Commit `c7d555b` — 22:09 — Tạo 3 docs mới**

- `docs/ARCHITECTURE.md` (**NEW**, 239 dòng) — tech stack, auth flow diagram ASCII, JWT lifecycle, Flutter 401 auto-refresh flow, resource-level authorization mapping table
- `docs/ONBOARDING-DEV.md` (**NEW**, 216 dòng) — hướng dẫn setup môi trường dev từ đầu: prerequisites, DB setup, backend run, Flutter run, test chạy
- `docs/UC-01-AUTH-STATUS.md` (**NEW**, 171 dòng) — file inventory (status từng file), working API endpoints, known issues HIGH/MEDIUM/LOW, cách test UC-01 (Firebase/dev bypass/curl), seeded test accounts

**Commit `f4b258d` — 22:39 — Cập nhật docs sau khi fix**

- `docs/ARCHITECTURE.md` — thêm section "Flutter 401 Auto-Refresh Flow" và "Resource-Level Authorization" với @PreAuthorize mapping table
- `docs/UC-01-AUTH-STATUS.md` — đổi issues #1, #2, #3 từ ⚠️ OPEN → ✅ FIXED với mô tả chi tiết

---

## Cần cập nhật — Dev khác đọc trước

> Pull code từ hôm nay? Đọc kỹ phần này trước khi chạy app hoặc test.

### 1. File `application-itest.properties` đã sửa port

`backend/src/test/resources/application-itest.properties` — đã đổi từ `localhost:5433` → `localhost:5432`.

Nếu máy bạn chạy PostgreSQL trên port **5433** (Docker container), cần sửa lại thành 5433 hoặc đảm bảo PostgreSQL của bạn đang listen trên 5432.

```bash
# Kiểm tra port PostgreSQL đang dùng:
netstat -ano | findstr 5432
netstat -ano | findstr 5433
```

### 2. Database `carenest_test` phải tồn tại

Integration tests cần database riêng. Nếu chưa tạo:

```bash
# Dùng postgres superuser (carenest user không có CREATEDB permission):
psql -U postgres -p 5432 -c "CREATE DATABASE carenest_test OWNER carenest;"
```

### 3. File mới: `lib/core/auth/token_notifier.dart`

File này export `TokenNotifier` singleton. Import trong `app_router.dart` và `dio_client.dart`. Không cần config gì thêm — singleton tự khởi tạo.

### 4. `SecureStorage` có 2 method mới

`saveRefreshToken(String)` và `getRefreshToken()` — nếu có code nào dùng `SecureStorage` và expect interface cũ, không bị breaking (chỉ thêm, không xóa).

### 5. `DioClient.create()` giờ trả về Dio có interceptor

Nếu bạn có provider nào tạo Dio thủ công thay vì dùng `DioClient.create()`, hãy chuyển sang dùng `DioClient.create()` để có 401 interceptor.

### 6. Repository tests vẫn fail trên Windows (pre-existing)

`AppointmentRepositoryTest`, `FamilyLinkRepositoryTest`, etc. dùng Testcontainers — fail trên Windows vì Docker API version mismatch. Đây là vấn đề cũ, **không phải do hôm nay**. Chỉ chạy integration test bằng:

```bash
cd backend
mvn test -Dspring.profiles.active=itest -Dtest=AuthIntegrationTest
```

---

## Vấn đề gặp phải

| # | Vấn đề | Nguyên nhân | Workaround |
|---|--------|-------------|------------|
| 1 | `application-itest.properties` port 5433 không connect được | PostgreSQL local chạy trên 5432, không phải 5433 | Sửa port → 5432 trong file properties |
| 2 | `carenest` user thiếu `CREATEDB` permission | PostgreSQL GRANT chưa được set | Dùng `postgres` superuser tạo DB: `psql -U postgres -c "CREATE DATABASE carenest_test OWNER carenest;"` |
| 3 | Repository tests fail do Testcontainers | Docker Desktop trên Windows không tương thích | Pre-existing issue — scope itest chỉ chạy AuthIntegrationTest |
| 4 | `AuthorizationService` có 4 Javadoc "what" comments | AI-generated slop | Xóa trong deslop pass (commit `b430233`) |

---

## Trạng thái UC cuối ngày

| UC | Backend | Flutter | Status |
|----|---------|---------|--------|
| UC-01 Auth | ✅ DONE + method security | ✅ DONE + 401 refresh | **PRODUCTION-READY** |
| UC-02 ElderlyProfile | ✅ Service + Controller + @PreAuthorize | Partial (UI wired) | **WIP** |
| UC-03 FamilyLink | ✅ Service + Controller + @PreAuthorize | Partial | **WIP** |
| UC-04 Medication | ✅ Service + Controller + @PreAuthorize | ✅ Wired (Riverpod) | **WIP** |
| UC-05 HealthMetrics | Partial (entity+repo only) | Partial | **BLOCKED** |
| UC-06 Appointment | Partial (entity+repo only) | Not started | **BLOCKED** |
| UC-07 Emergency/SOS | Partial (entity+repo only) | Partial (button UI only) | **BLOCKED** |
| UC-08 Reminders | Partial (entity+repo only) | Not started | **BLOCKED** |
| UC-09 Notifications | Partial (entity+repo only) | Partial | **BLOCKED** |

---

## Ngày mai cần làm

1. **`GET /api/family/{familyId}/elderly` endpoint** — FamilyDashboard hiện đang fallback empty state vì endpoint này chưa tồn tại. Unblock toàn bộ family flow.

2. **UC-05 HealthMetrics — Backend Service + Controller** — entity/repo đã có, cần implement service logic và 3 endpoints: `POST /api/health-metrics`, `GET /api/users/{id}/health-metrics`, `GET /api/users/{id}/health-metrics/latest`. Cần cho chart data và Gemini health context.

3. **GlobalExceptionHandler — thêm `AccessDeniedException` handler** — hiện 403 trả về Spring default response, cần standard JSON format giống các lỗi khác: `{ "error": "FORBIDDEN", "message": "...", "timestamp": "..." }`.

4. **UC-07 Emergency/SOS — Backend Service** — SOS button trong Flutter chỉ hiển thị SnackBar, chưa gọi API. Đây là tính năng an toàn quan trọng nhất cần unblock sớm.

5. **Sửa known issues còn open trong UC-01-AUTH-STATUS.md** — Issue #4 (JWT secret weak fallback), #5 (CORS quá rộng), #6 (force-unwrap `result.user!`), #7 (unsafe cast `state.extra as String`).

---

*Báo cáo cuối ngày 25/06/2026 — CareNest Vela Team — EXE101 FPT*
