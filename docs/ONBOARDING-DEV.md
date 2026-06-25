# CareNest — Dev Onboarding (UC-01 in 15 minutes)

**Target:** New developer, zero prior context  
**Goal:** Backend running + Flutter app showing the home screen in ≤15 minutes  
**Method:** Dev mode bypass (no Firebase SMS needed)

---

## Prerequisites Checklist

Before starting, confirm you have:

- [ ] **Flutter SDK** 3.x — `flutter --version`
- [ ] **Java 21+** — `java --version`
- [ ] **Maven** — `mvn --version`
- [ ] **PostgreSQL 15** running locally on port 5432 or 5433
- [ ] **Chrome browser** (for dev mode web login without Firebase OTP)
- [ ] This repo cloned

---

## Step 1 — Database Setup (2 min)

```sql
-- Connect to your PostgreSQL and run:
CREATE DATABASE carenest;
CREATE USER carenest WITH PASSWORD 'carenest';
GRANT ALL PRIVILEGES ON DATABASE carenest TO carenest;
```

> **Tip:** If you have `psql` in PATH:
> ```bash
> psql -U postgres -c "CREATE DATABASE carenest;"
> psql -U postgres -c "CREATE USER carenest WITH PASSWORD 'carenest';"
> psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE carenest TO carenest;"
> ```

---

## Step 2 — Backend Setup (5 min)

### 2a. Create local config file

```bash
cd backend/src/main/resources
cp application-local.properties.example application-local.properties
```

Edit `application-local.properties`:

```properties
# Database — adjust port if yours is 5432
spring.datasource.url=jdbc:postgresql://localhost:5433/carenest
spring.datasource.username=carenest
spring.datasource.password=carenest

# JWT — any 32+ character random string
jwt.secret=my-local-dev-secret-at-least-32-chars!

# Firebase — leave empty to use DEV_PHONE: bypass
firebase.credentials-path=

# Enable seeder to create test data
carenest.seed.enabled=true
```

> **Do NOT commit `application-local.properties`** — it's gitignored.

### 2b. Start the backend

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**Expected output (first run — Flyway runs 15 migrations):**
```
Flyway: Migrating schema to version 15
...
Started CareNestBackendApplication in ~8s
```

**Verify it's up:**
```bash
curl http://localhost:8080/actuator/health
# → {"status":"UP"}
```

**Test the auth endpoint directly:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"firebaseToken":"DEV_PHONE:+84912345678"}'
```

Expected response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "expiresIn": 900,
  "user": { "id": 1, "name": "...", "role": "ELDERLY", "phone": "+84912345678" }
}
```

If you get a 404, the phone isn't registered yet — use `/api/auth/register` first:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firebaseToken":"DEV_PHONE:+84912345678","name":"Dev User","role":"ELDERLY"}'
```

---

## Step 3 — Flutter Setup (3 min)

### 3a. Install dependencies

```bash
# From repo root
flutter pub get
```

### 3b. Create .env file

```bash
# From repo root
cp .env.example .env 2>/dev/null || touch .env
```

Edit `.env`:
```env
# Leave Gemini key blank to disable chat, or add your Gemini API key
GEMINI_API_KEY=
```

> **Note:** The base API URL (`http://localhost:8080/api` on web, `http://10.0.2.2:8080/api` on Android emulator) is hardcoded in `lib/core/network/dio_client.dart`. No env var needed for dev.

---

## Step 4 — Run & Test UC-01 (5 min)

### Option A: Chrome (recommended for dev — no OTP needed)

```bash
flutter run -d chrome
```

1. App opens at `http://localhost:*` in Chrome
2. Enter any Vietnamese phone number format, e.g. `0912345678`
3. You'll see the dev mode banner (yellow box) — tap **"Đăng nhập Dev (bypass OTP)"**
4. Backend verifies via dev bypass → logs you in or creates account
5. App redirects to `/elderly/home` (ELDERLY role) or `/family/dashboard` (FAMILY role)

**To test FAMILY role:** Change role in the register step, or run the register curl with `"role":"FAMILY"`.

### Option B: Android Emulator (requires full Firebase setup)

```bash
# Only if you have a Firebase project with Android app configured
flutter run -d emulator-5554
# Enter real phone → wait for SMS → enter OTP
```

> For Android emulator with dev backend: the emulator uses `10.0.2.2` to reach `localhost`. This is already handled in `DioClient`.

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Backend fails to start: "relation 'flyway_schema_history' does not exist" | DB doesn't exist yet | Run Step 1 |
| `JWT secret too weak` on startup | Missing `jwt.secret` in local properties | Add 32+ char secret to `application-local.properties` |
| Flutter `curl: Connection refused` | Backend not running | Start backend first (Step 2b) |
| Dev bypass button not visible | Running on Android/iOS instead of Chrome | Use `flutter run -d chrome` |
| 401 on API call | JWT expired (15 min) | Logout and login again (refresh not yet implemented in Flutter) |
| Flyway checksum mismatch | You edited a migration file after it ran | Drop the DB and recreate: `DROP DATABASE carenest; CREATE DATABASE carenest;` then restart |

---

## Project Structure (Quick Map)

```
carenest_mobile/
├── lib/
│   ├── main.dart                    # App entry, Firebase init, dotenv load
│   ├── app.dart                     # MaterialApp + router
│   ├── core/
│   │   ├── network/dio_client.dart  # HTTP client (auth interceptor here)
│   │   ├── router/app_router.dart   # All routes + auth guard
│   │   └── storage/secure_storage.dart  # JWT/role persistence
│   └── features/
│       ├── auth/                    # UC-01: phone → OTP → register/login
│       ├── elderly/                 # Elderly user screens
│       └── family/                  # Family member screens
└── backend/
    ├── src/main/java/com/carenest/backend/
    │   ├── controller/              # REST endpoints
    │   ├── service/                 # Business logic
    │   ├── entity/                  # JPA entities
    │   └── security/                # JWT filter
    └── src/main/resources/
        ├── application.properties   # Base config (committed)
        ├── application-local.properties  # Your local overrides (gitignored)
        └── db/migration/            # Flyway SQL migrations V1–V15
```

---

## Useful Swagger UI

Once backend is running:  
`http://localhost:8080/swagger-ui.html`

All API endpoints are documented there. Auth endpoints (`/api/auth/**`) are public — click "Try it out" to test without needing the Flutter app.
