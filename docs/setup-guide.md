# CareNest — Setup Guide

> **Nhóm Vela | EXE101 — FPT University**  
> Hướng dẫn cài đặt môi trường dev cho cả Frontend (Flutter) và Backend (Spring Boot).

---

## Mục lục

- [Frontend — Flutter](#frontend--flutter)
- [Backend — Spring Boot](#backend--spring-boot)

---

# Frontend — Flutter

## Yêu cầu cài đặt

| Tool | Version | Tải về |
|------|---------|--------|
| Flutter SDK | **3.x (stable)** | [flutter.dev/docs/get-started/install](https://docs.flutter.dev/get-started/install) |
| Dart | Đi kèm Flutter | — |
| Android Studio | Mới nhất | [developer.android.com/studio](https://developer.android.com/studio) |
| VS Code (tùy chọn) | Mới nhất | [code.visualstudio.com](https://code.visualstudio.com/) |
| Git | Mới nhất | [git-scm.com](https://git-scm.com/) |

> **Lưu ý Android:** Cần cài Android SDK và tạo Android Emulator trong Android Studio (AVD Manager).

---

## Setup lần đầu (4 bước)

### Bước 1 — Clone project

```bash
git clone <repo-url>
cd carenest_mobile
```

### Bước 2 — Cài dependencies

```bash
flutter pub get
```

### Bước 3 — Cấu hình editor

**VS Code:**
1. Cài extension **Flutter** + **Dart** từ Extensions tab
2. Reload VS Code

**Android Studio:**
1. **Plugins** → tìm "Flutter" → Install → Restart
2. Dart plugin sẽ tự cài theo

### Bước 4 — Chạy app

```bash
# Kiểm tra thiết bị/emulator đang kết nối
flutter devices

# Chạy app (debug mode)
flutter run
```

Hoặc trong VS Code: nhấn **F5** → chọn device.

---

## Kiểm tra hoạt động

```bash
flutter doctor
```

Tất cả dấu ✅ là OK. Dấu ⚠️ xem hướng dẫn fix bên dưới.

---

## Cấu trúc project Flutter

```
lib/
├── main.dart                  ← Entry point
├── app.dart                   ← MaterialApp + routing
├── core/
│   ├── constants/             ← Colors, strings, dimensions
│   └── theme/                 ← AppTheme — font size lớn cho elderly
├── data/
│   ├── models/                ← Data classes (JSON serializable)
│   ├── repositories/          ← Giao tiếp với API
│   └── datasources/           ← HTTP client, local storage
├── presentation/
│   ├── screens/               ← UI screens
│   └── widgets/               ← Reusable components
└── providers/                 ← Riverpod providers
```

---

## Lỗi thường gặp (Flutter)

**`flutter: command not found`**
→ Chưa thêm Flutter vào PATH. Xem lại bước cài Flutter SDK và thêm `flutter/bin` vào biến môi trường PATH.

**`No devices found`**
→ Mở Android Studio → AVD Manager → Start emulator. Hoặc cắm điện thoại thật và bật USB Debugging.

**`Gradle build failed`**
→ Chạy `flutter clean` rồi `flutter pub get` lại.

**`Bad state: No element` hoặc lỗi Riverpod**
→ Kiểm tra `ProviderScope` đã bọc `runApp()` trong `main.dart` chưa.

---

# Backend — Spring Boot

## Yêu cầu cài đặt

| Tool | Version | Tải về |
|------|---------|--------|
| JDK | **21** (bắt buộc đúng version) | [Adoptium Temurin 21](https://adoptium.net/) |
| Maven | 3.9+ | [maven.apache.org](https://maven.apache.org/download.cgi) |
| Docker Desktop | Mới nhất | [docker.com](https://www.docker.com/products/docker-desktop/) |
| IntelliJ IDEA | Community hoặc Ultimate | [jetbrains.com](https://www.jetbrains.com/idea/) |

> **Lưu ý Java:** Phải dùng đúng **Java 21**, không phải 17 hay 11.  
> Kiểm tra: `java -version` → phải thấy `21.x.x`

---

## Setup lần đầu (5 bước)

### Bước 1 — Clone project (nếu chưa có)

```bash
git clone <repo-url>
cd carenest_mobile/backend
```

### Bước 2 — Tạo file `.env` và khởi động PostgreSQL

```bash
# Đứng ở thư mục gốc carenest_mobile (không phải trong backend/)
cp .env.example .env
docker-compose up -d
```

Kiểm tra đang chạy:
```bash
docker ps
# Phải thấy container "carenest_db" với STATUS "healthy"
```

> Lần sau chỉ cần `docker-compose up -d` — data được giữ nguyên trong volume `carenest_pgdata`.

### Bước 3 — Mở project trong IntelliJ

1. Mở IntelliJ → **Open** → chọn thư mục `backend`
2. IntelliJ tự detect Maven project và tải dependencies (~2-3 phút lần đầu)
3. **File → Project Structure → Project SDK** → chọn Java 21

### Bước 4 — Cấu hình Lombok

1. **File → Settings → Plugins** → tìm "Lombok" → Install → Restart
2. **File → Settings → Build → Compiler → Annotation Processors** → tick **Enable annotation processing**

### Bước 5 — Tạo file `application-local.properties`

File này chứa secrets riêng của máy bạn — **không được commit**, đã có trong `.gitignore`.

Tạo file tại `backend/src/main/resources/application-local.properties`:

```properties
# JWT secret cho local (chuỗi random >= 32 ký tự, thay thế chuỗi bên dưới)
jwt.secret=local-dev-secret-replace-this-with-something-random

# Firebase credentials (xem Bước 6 bên dưới)
# firebase.credentials-path=C:/path/to/carenest-firebase-adminsdk-xxxxx.json
```

> **Nếu chưa có Firebase key:** Bỏ trống `firebase.credentials-path` — app vẫn chạy được, dùng `DEV_PHONE:` prefix để test (xem phần Test API).

### Bước 6 — Firebase credentials (tùy chọn, cần để test OTP thật)

1. Liên hệ **trưởng nhóm** để nhận file `carenest-firebase-adminsdk-xxxxx.json`
2. Lưu file **ngoài thư mục project** (ví dụ: `C:/Keys/carenest-firebase-adminsdk-xxxxx.json`)
3. Điền path vào `application-local.properties`:
   ```properties
   firebase.credentials-path=C:/Keys/carenest-firebase-adminsdk-xxxxx.json
   ```

> **QUAN TRỌNG:** Không được lưu file key trong thư mục project hoặc commit lên Git.

### Bước 7 — Cấu hình IntelliJ Run Config

1. **Run → Edit Configurations** → chọn `CareNestBackendApplication`
2. Mục **VM options** thêm: `-Dspring.profiles.active=local`
3. Click **OK** → Run (▶)

Hoặc terminal:
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Chạy thành công khi thấy:
```
The following 1 profile is active: "local"
...
Started CareNestBackendApplication in X.XXX seconds
```

**Flyway tự tạo toàn bộ bảng** (V1–V15, 13 bảng) khi khởi động lần đầu.

---

## Kiểm tra hoạt động

| URL | Kết quả mong đợi |
|-----|-----------------|
| `http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| `http://localhost:8080/swagger-ui.html` | Swagger UI — danh sách API |

## Test Auth API (không cần Firebase)

Dùng `DEV_PHONE:` prefix để bypass Firebase hoàn toàn khi test local:

**Register:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body '{"firebaseToken":"DEV_PHONE:+84901234567","name":"Test User","role":"ELDERLY"}'
```

**Login:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"firebaseToken":"DEV_PHONE:+84901234567"}'
```

Kết quả mong đợi: JSON có `accessToken`, `refreshToken`, `user`.

> `DEV_PHONE:` chỉ hoạt động khi `firebase.credentials-path` để trống (dev mode). Trên production sẽ bị từ chối.

---

## Chạy test

> **Yêu cầu:** Docker phải đang chạy (Testcontainers tự tạo PostgreSQL tạm)

```bash
mvn test
```

Lần đầu tải image `postgres:16-alpine` (~100MB), các lần sau nhanh hơn.

---

## Cấu trúc project Backend

```
backend/
├── src/main/java/com/carenest/backend/
│   ├── CareNestBackendApplication.java   ← Entry point
│   ├── entity/                           ← JPA entities (13 bảng)
│   ├── repository/                       ← Spring Data JPA repositories
│   ├── service/                          ← Business logic (AuthService, JwtService, FirebaseService, ...)
│   ├── controller/                       ← REST controllers (AuthController, ...)
│   ├── dto/                              ← Request/Response DTOs
│   ├── security/                         ← JwtAuthenticationFilter
│   ├── config/                           ← SecurityConfig, FirebaseConfig
│   └── exception/                        ← GlobalExceptionHandler
│
├── src/main/resources/
│   ├── application.properties              ← Config chung (commit được)
│   ├── application-local.properties        ← Secrets local — KHÔNG commit (gitignored)
│   └── db/
│       ├── migration/                      ← Flyway SQL (V1–V15, 13 bảng)
│       └── rollback/                       ← Script rollback thủ công (R1–R15)
│
└── src/test/                             ← Integration tests (Testcontainers)
```

---

## Quy tắc migration (QUAN TRỌNG)

- **KHÔNG bao giờ sửa file migration đã có** — Flyway báo lỗi checksum ngay.
- Cần thêm cột/bảng → tạo file mới với số tiếp theo (hiện tại đang ở **V15**, tạo tiếp **V16__...sql**).
- Tên file đúng format: `V{số}__{mô_tả}.sql` (2 dấu gạch dưới ở giữa)

---

## Lỗi thường gặp (Backend)

**`Cannot connect to database`**
→ Docker chưa chạy. Kiểm tra: `docker ps` → nếu không thấy `carenest_db` thì `docker-compose up -d` (chạy từ thư mục gốc `carenest_mobile/`)

**`Flyway checksum mismatch`**
→ Ai đó sửa file migration cũ. Không được sửa file V đã có — phải tạo file V mới.

**`Annotation processor not found` (Lombok không hoạt động)**
→ Kiểm tra lại bước cài Lombok plugin và bật Annotation Processing trong IntelliJ.

**`Test failed: Could not find a valid Docker environment`**
→ Docker Desktop chưa mở. Mở lên rồi chạy test lại.

**`400 Bad Request` khi gọi `/api/auth/register`**
→ Kiểm tra field names: `firebaseToken` (không phải `firebaseIdToken`), `name` (không phải `fullName`).

**`Số điện thoại đã được đăng ký`**
→ Số đó đã register rồi. Dùng `/api/auth/login` hoặc đổi số khác khi test.

**`IntelliJ báo "Cannot resolve symbol"` cho một số class**
→ Chỉ là cache IntelliJ, không ảnh hưởng build. Fix: **Maven → Reload Project**, sau đó **File → Invalidate Caches → Invalidate and Restart**. `mvn compile` vẫn chạy đúng.

---

## Render PostgreSQL — ⚠️ Expire sau 90 ngày

Free tier của Render **tự xóa toàn bộ data sau 90 ngày**.  
→ Set nhắc lịch ở ngày thứ 80 sau khi tạo DB để upgrade lên $7/tháng.

---

*Vela Team | EXE101 — FPT University | Cập nhật: 12/06/2026 — UC-01 Auth done*
