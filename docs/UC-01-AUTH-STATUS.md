# UC-01 Auth — Status Report

**Last updated:** 2026-06-25  
**Status:** ✅ Complete for demo | ✅ Production security issues resolved

---

## File Inventory

### Flutter — lib/

| File | Status | Notes |
|------|--------|-------|
| `lib/features/auth/data/auth_repository.dart` | ✅ KEEP | Handles Firebase OTP + backend JWT |
| `lib/features/auth/presentation/providers/auth_provider.dart` | ✅ KEEP | All 3 state machines (Phone, Otp, Register) |
| `lib/features/auth/presentation/screens/phone_screen.dart` | ✅ KEEP | Production-ready; dev mode shown only on kIsWeb |
| `lib/features/auth/presentation/screens/otp_screen.dart` | ⚠️ REFACTOR | Missing: resend OTP, countdown timer |
| `lib/features/auth/presentation/screens/register_screen.dart` | ⚠️ REFACTOR | Missing: DOB input field |
| `lib/core/storage/secure_storage.dart` | ✅ KEEP | Correct flutter_secure_storage usage; refreshToken key added |
| `lib/core/auth/token_notifier.dart` | ✅ NEW | ChangeNotifier singleton; triggers GoRouter redirect on session expiry |
| `lib/core/network/dio_client.dart` | ✅ FIXED | 401 interceptor: auto-refresh → retry; refresh failure → logout + redirect |
| `lib/core/router/app_router.dart` | ✅ KEEP | Role-based routing correct |
| `lib/presentation/screens/auth/.gitkeep` | ❌ REMOVE | Empty dead folder |

### Backend — backend/src/main/java/

| File | Status | Notes |
|------|--------|-------|
| `controller/AuthController.java` | ✅ KEEP | All 4 endpoints: register, login, refresh, logout |
| `service/AuthService.java` | ✅ KEEP | Firebase verify → DB create/lookup → JWT issue |
| `service/JwtService.java` | ✅ KEEP | HS256, expiry guard, role claim |
| `service/FirebaseService.java` | ✅ KEEP | Profile-gated dev bypass |
| `config/SecurityConfig.java` | ✅ FIXED | @EnableMethodSecurity added; CORS still too permissive (issue #5) |
| `security/AuthorizationService.java` | ✅ NEW | @Service("authz") — ownership checks used by @PreAuthorize SpEL |
| `config/FirebaseConfig.java` | ✅ KEEP | Graceful skip when no credentials |
| `security/JwtAuthenticationFilter.java` | ✅ KEEP | Sets userId + role as principal |
| `exception/GlobalExceptionHandler.java` | ⚠️ REFACTOR | Missing AccessDeniedException handler |
| `entity/OtpVerification.java` | ❌ REMOVE | Dead code — Firebase handles OTP, entity never written |
| `repository/OtpVerificationRepository.java` | ❌ REMOVE | Paired with unused entity |
| `dto/auth/*.java` (all) | ✅ KEEP | LoginRequest, RegisterRequest, RefreshRequest, AuthResponse, UserResponse |

### Database — db/migration/

| Migration | Status | Notes |
|-----------|--------|-------|
| `V1__create_users.sql` | ✅ KEEP | Solid schema; UNIQUE(phone), soft delete |
| `V11__create_otp_verifications.sql` | ⚠️ DEPRECATE | Table never written by app; OTP plaintext is security risk; consider dropping |
| `V12__create_refresh_tokens.sql` | ✅ KEEP | Correct hash storage; missing index on expires_at |

---

## Working API Endpoints

Base URL (dev): `http://localhost:8080/api`  
Base URL (prod): configured by Render's `PORT` env var; domain is the Render service URL

| Method | Path | Auth | Request Body | Response | Notes |
|--------|------|------|-------------|----------|-------|
| `POST` | `/api/auth/register` | None | `{ firebaseToken, name, role, dob? }` | `{ accessToken, refreshToken, expiresIn, user }` | 201 Created |
| `POST` | `/api/auth/login` | None | `{ firebaseToken }` | `{ accessToken, refreshToken, expiresIn, user }` | 404 if not registered |
| `POST` | `/api/auth/refresh` | None | `{ refreshToken }` | `{ accessToken, refreshToken, expiresIn, user }` | Old token revoked |
| `POST` | `/api/auth/logout` | Bearer JWT | — | 204 No Content | Revokes all user's refresh tokens |

### Dev mode bypass (local/dev profile only)
Send `firebaseToken: "DEV_PHONE:+84912345678"` to `/api/auth/login` or `/api/auth/register` to skip Firebase OTP verification.

---

## Known Issues

### HIGH Severity

| # | Issue | Status | Fix |
|---|-------|--------|-----|
| 1 | Flutter had no 401 interceptor — JWT expiry silently broke API | ✅ **FIXED** | `DioClient` now detects 401, calls `POST /auth/refresh`, retries; on failure clears storage and triggers router redirect |
| 2 | Flutter never called `POST /api/auth/refresh` | ✅ **FIXED** | `SecureStorage` now stores `refreshToken`; `auth_repository.dart` saves it on login/register; `DioClient` uses it in the interceptor |
| 3 | `SecurityConfig` missing `@EnableMethodSecurity` — any authenticated user could access any endpoint | ✅ **FIXED** | `@EnableMethodSecurity` added; `@PreAuthorize` added to all 3 controllers via `AuthorizationService` SpEL |
| 4 | JWT secret has weak fallback in `application.properties` | ⚠️ OPEN | Change `jwt.secret=${JWT_SECRET:...}` to `jwt.secret=${JWT_SECRET}` (no fallback) |

### MEDIUM Severity

| # | Issue | Fix |
|---|-------|-----|
| 5 | CORS `http://localhost:*` active in production | Gate with `@Profile("!prod")` or read from env var |
| 6 | `result.user!.getIdToken()` force-unwrap in `auth_repository.dart` | Add null check with fallback error |
| 7 | `state.extra as String` unsafe cast in router | Add `?? ''` guard or use typed route params |
| 8 | No resend OTP in `OtpScreen` | Add resend button with 60-second countdown |

### LOW Severity

| # | Issue | Fix |
|---|-------|-----|
| 9 | `OtpVerification` entity is dead code | Remove class + repository |
| 10 | DOB not collected in RegisterScreen | Add optional DatePicker field |
| 11 | `dioProvider` in wrong file | Move to `dio_client.dart` |

---

## How to Test UC-01

### Option A: Full Firebase OTP (Mobile device, real phone number)

```bash
# 1. Start backend
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 2. Start Flutter on Android emulator
flutter run --dart-define=API_ENV=local

# 3. Enter real Vietnamese phone number (+84xxx)
# 4. Receive SMS OTP
# 5. Enter 6-digit code
# 6. If new user → fills Register screen → tap Đăng ký
# 7. Redirects to role home screen
```

### Option B: Dev bypass (Chrome, no SMS needed)

```bash
# 1. Start backend with local profile (enables DEV_PHONE: bypass)
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 2. Run Flutter on Chrome
flutter run -d chrome

# 3. Enter any valid phone format (e.g., 0912345678)
# 4. Tap "Đăng nhập Dev (bypass OTP)" button (visible only in Chrome)
# 5. Backend registers/logs in without OTP

# Test register: use a phone number not in the DB
# Test login: use a phone number already seeded (check DataSeeder.java)
```

### Option C: Direct API test with curl

```bash
# Register (dev mode)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firebaseToken":"DEV_PHONE:+84912345678","name":"Test User","role":"ELDERLY"}'

# Login (dev mode)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"firebaseToken":"DEV_PHONE:+84912345678"}'

# Refresh
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<token-from-login-response>"}'

# Logout
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

---

## Seeded Test Accounts (when `carenest.seed.enabled=true`)

| Phone | Name | Role |
|-------|------|------|
| `0912345001` | Nguyễn Văn An | ELDERLY |
| `0912345002` | Trần Thị Bình | ELDERLY |
| `0912345003` | Lê Văn Cường | ELDERLY |
| `0918111001` | Nguyễn Thị Lan | FAMILY |
| `0918111002` | Trần Văn Minh | FAMILY |

Use with dev bypass: `firebaseToken: "DEV_PHONE:+84912345001"` (replace `0` prefix with `+84`).
