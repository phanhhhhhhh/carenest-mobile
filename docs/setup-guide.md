# CareNest — Hướng dẫn cài đặt môi trường

> **Nhóm Vela | EXE101 — FPT University**  
> Đọc hết trước khi bắt đầu cài. Mỗi bước quan trọng đều có lý do.

---

## Bạn cần làm gì?

| Bạn là | Đọc phần |
|--------|----------|
| Dev Flutter (mobile) | [Phần 1 — Flutter](#phần-1--flutter) |
| Dev Backend (Spring Boot) | [Phần 2 — Backend](#phần-2--backend) |
| Trưởng nhóm / cả hai | Đọc cả hai |

---

# Phần 1 — Flutter

## Bước 1 — Cài đặt công cụ

Cài đúng thứ tự sau:

### 1.1 Git
Tải tại: https://git-scm.com/downloads  
Sau khi cài, mở terminal kiểm tra:
```bash
git --version
# Kết quả mong đợi: git version 2.x.x
```

### 1.2 Flutter SDK
Tải tại: https://docs.flutter.dev/get-started/install  
Chọn đúng hệ điều hành của máy (Windows / macOS / Linux).

Sau khi giải nén, thêm `flutter/bin` vào biến môi trường PATH.

Kiểm tra:
```bash
flutter --version
# Kết quả mong đợi: Flutter 3.x.x
```

### 1.3 Android Studio
Tải tại: https://developer.android.com/studio  

Sau khi cài xong, mở Android Studio và:
1. **SDK Manager** → cài **Android SDK** (mới nhất)
2. **AVD Manager** → tạo 1 emulator (Pixel 6, API 33 trở lên)

### 1.4 VS Code (tùy chọn nhưng khuyến nghị)
Tải tại: https://code.visualstudio.com  

Sau khi cài, mở VS Code → Extensions → tìm và cài:
- **Flutter** (by Dart Code)
- **Dart** (by Dart Code)

---

## Bước 2 — Clone project

```bash
git clone https://github.com/phanhhhhhhh/carenest-mobile.git
cd carenest-mobile
```

---

## Bước 3 — Cài dependencies Flutter

```bash
flutter pub get
```

---

## Bước 4 — Kiểm tra môi trường

```bash
flutter doctor
```

Mục tiêu: tất cả ✅. Nếu còn ⚠️ thì xem lỗi thường gặp bên dưới.

---

## Bước 5 — Chạy app

```bash
# Kiểm tra emulator/device đang kết nối
flutter devices

# Chạy app
flutter run
```

Hoặc trong VS Code: nhấn **F5** → chọn device.

---

## Lỗi thường gặp (Flutter)

**`flutter: command not found`**  
→ Chưa thêm Flutter vào PATH. Thêm đường dẫn `flutter/bin` vào biến môi trường PATH rồi mở lại terminal.

**`No devices found`**  
→ Mở Android Studio → AVD Manager → Start emulator. Hoặc cắm điện thoại và bật USB Debugging.

**`Gradle build failed`**  
→ Chạy `flutter clean` rồi `flutter pub get` lại.

---

# Phần 2 — Backend

## Bước 1 — Cài đặt công cụ

### 1.1 JDK 21 (bắt buộc đúng version)
Tải tại: https://adoptium.net/ → chọn **Temurin 21**

Kiểm tra sau khi cài:
```bash
java -version
# Kết quả mong đợi: openjdk version "21.x.x"
```

> Nếu máy đang có Java 17 hoặc 11 — vẫn phải cài thêm Java 21. Dự án dùng Virtual Threads chỉ có từ Java 21.

### 1.2 Docker Desktop
Tải tại: https://www.docker.com/products/docker-desktop  

Sau khi cài, mở Docker Desktop và đợi đến khi thấy **"Engine running"** ở góc dưới trái.

Kiểm tra:
```bash
docker --version
# Kết quả mong đợi: Docker version 24.x.x
```

> Docker dùng để chạy PostgreSQL local — không cần cài PostgreSQL riêng.

### 1.3 IntelliJ IDEA
Tải tại: https://www.jetbrains.com/idea/download  
Bản **Community** (miễn phí) là đủ dùng.

---

## Bước 2 — Clone project (nếu chưa có)

```bash
git clone https://github.com/phanhhhhhhh/carenest-mobile.git
cd carenest-mobile
```

---

## Bước 3 — Khởi động database (Docker)

Chạy từ thư mục gốc `carenest-mobile/` (không phải trong `backend/`):

```bash
# Windows PowerShell
cp .env.example .env
docker-compose up -d
```

```bash
# macOS / Linux
cp .env.example .env
docker-compose up -d
```

Kiểm tra database đang chạy:
```bash
docker ps
```
Phải thấy container `carenest_db` với STATUS `healthy`. Nếu thấy `starting` thì đợi thêm 10-15 giây rồi kiểm tra lại.

> **Lần sau:** chỉ cần `docker-compose up -d` — data được giữ nguyên trong volume `carenest_pgdata`.

---

## Bước 4 — Mở project trong IntelliJ

1. Mở IntelliJ → **Open** → chọn thư mục **`backend`** (không phải thư mục gốc)
2. IntelliJ tự detect Maven và tải dependencies — chờ khoảng 2-5 phút lần đầu
3. **File → Project Structure → SDK** → chọn **Java 21**

---

## Bước 5 — Cài Lombok plugin

1. **File → Settings → Plugins** → tìm **"Lombok"** → Install → Restart IntelliJ
2. **File → Settings → Build, Execution, Deployment → Compiler → Annotation Processors**  
   → tick **Enable annotation processing** → OK

> Nếu bỏ qua bước này, IntelliJ sẽ báo đỏ khắp nơi dù code vẫn chạy được.

---

## Bước 6 — Tạo file `application-local.properties`

File này chứa secrets của máy bạn và **không được commit lên Git**.

Tạo file tại đường dẫn:  
`backend/src/main/resources/application-local.properties`

Copy nội dung từ file mẫu đã có sẵn trong repo:
```bash
# Từ trong thư mục backend/src/main/resources/
cp application-local.properties.example application-local.properties
```

Sau đó mở file vừa tạo và điền:

```properties
# JWT secret — thay chuỗi bên dưới bằng chuỗi random bất kỳ >= 32 ký tự
jwt.secret=local-dev-secret-replace-this-with-something-random

# Firebase credentials — để trống nếu chưa có (xem Bước 7)
firebase.credentials-path=
```

---

## Bước 7 — Firebase credentials (tùy chọn)

Cần có để test luồng OTP thật. Nếu chưa có, bỏ qua — app vẫn chạy bình thường.

1. Liên hệ **trưởng nhóm** để nhận file `carenest-firebase-adminsdk-xxxxx.json`
2. Lưu file **ngoài thư mục project** — ví dụ:
   - Windows: `C:\Keys\carenest-firebase-adminsdk-xxxxx.json`
   - macOS/Linux: `/Users/yourname/keys/carenest-firebase-adminsdk-xxxxx.json`
3. Điền path vào `application-local.properties`:
   ```properties
   firebase.credentials-path=C:/Keys/carenest-firebase-adminsdk-xxxxx.json
   ```

> **QUAN TRỌNG:** Tuyệt đối không lưu file key trong thư mục project và không commit lên Git.

---

## Bước 8 — Cấu hình IntelliJ Run Config

1. Menu **Run → Edit Configurations**
2. Chọn `CareNestBackendApplication` (nếu chưa có thì mở file `CareNestBackendApplication.java` → click **Run** một lần để IntelliJ tự tạo)
3. Tìm mục **VM options** (hoặc **Add VM options** nếu chưa hiện) → điền:
   ```
   -Dspring.profiles.active=local
   ```
4. Click **OK**

---

## Bước 9 — Chạy ứng dụng

Click **Run** (▶) trong IntelliJ, hoặc terminal:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Chạy thành công khi log xuất hiện:
```
The following 1 profile is active: "local"
...
Flyway: Successfully validated 15 migrations
...
Started CareNestBackendApplication in X.XXX seconds
```

**Flyway tự tạo toàn bộ 13 bảng** (V1–V15) khi khởi động lần đầu — không cần chạy SQL thủ công.

---

## Kiểm tra hoạt động

| URL | Kết quả mong đợi |
|-----|-----------------|
| `http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| `http://localhost:8080/swagger-ui.html` | Swagger UI hiển thị danh sách API |

---

## Test Auth API (không cần Firebase)

Dùng `DEV_PHONE:` prefix để bypass Firebase khi test local:

**Register tài khoản mới:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body '{"firebaseToken":"DEV_PHONE:+84901234567","name":"Test User","role":"ELDERLY"}'
```

**Login:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"firebaseToken":"DEV_PHONE:+84901234567"}'
```

Kết quả mong đợi: JSON có `accessToken`, `refreshToken`, `user`.

> `DEV_PHONE:` chỉ hoạt động khi `firebase.credentials-path` để trống. Trên production sẽ bị từ chối.

---

## Lỗi thường gặp (Backend)

**`java -version` hiển thị 17 hoặc 11`**  
→ Cài JDK 21 rồi set lại JAVA_HOME trỏ vào JDK 21. Kiểm tra lại với `java -version`.

**`Cannot connect to database` hoặc `Connection refused`**  
→ Docker chưa chạy. Mở Docker Desktop → đợi "Engine running" → rồi `docker-compose up -d` từ thư mục gốc.

**`docker ps` không thấy `carenest_db`**  
→ Chạy `docker-compose up -d` từ thư mục `carenest-mobile/` (không phải trong `backend/`).

**`Flyway checksum mismatch`**  
→ Ai đó đã sửa file migration cũ. Không được sửa file V đã commit — phải tạo file V mới.

**`Annotation processor not found` hoặc Lombok báo lỗi**  
→ Kiểm tra lại Bước 5: cài Lombok plugin và bật Annotation Processing.

**IntelliJ báo đỏ "Cannot resolve symbol" nhưng `mvn compile` vẫn OK**  
→ Chỉ là cache IntelliJ. Fix: **Maven → Reload Project**, sau đó **File → Invalidate Caches → Invalidate and Restart**.

**`400 Bad Request` khi gọi `/api/auth/register`**  
→ Kiểm tra field names: `firebaseToken` (không phải `firebaseIdToken`), `name` (không phải `fullName`).

**`Số điện thoại đã được đăng ký`**  
→ Số đó đã register rồi. Dùng `/api/auth/login` hoặc đổi số khác khi test.

---

## Cấu trúc thư mục Backend

```
backend/
├── src/main/java/com/carenest/backend/
│   ├── CareNestBackendApplication.java   ← Entry point
│   ├── entity/                           ← JPA entities (13 bảng)
│   ├── repository/                       ← Spring Data JPA repositories
│   ├── service/                          ← Business logic
│   ├── controller/                       ← REST controllers
│   ├── dto/                              ← Request/Response DTOs
│   ├── security/                         ← JWT filter
│   ├── config/                           ← SecurityConfig, FirebaseConfig
│   └── exception/                        ← GlobalExceptionHandler
│
├── src/main/resources/
│   ├── application.properties                  ← Config chung (committed)
│   ├── application-local.properties            ← Secrets local — KHÔNG commit
│   ├── application-local.properties.example   ← Template — committed, cập nhật khi có key mới
│   └── db/migration/                           ← Flyway SQL (V1–V15)
```

---

## Quy tắc migration (quan trọng)

- **Không bao giờ sửa** file migration đã commit — Flyway kiểm tra checksum, sửa là lỗi ngay.
- Cần thêm cột/bảng → tạo file mới với số tiếp theo.
- Hiện tại đang ở **V15** → migration tiếp theo là **`V16__mô_tả.sql`**.
- Tên file: `V{số}__{mô_tả}.sql` (2 dấu gạch dưới ở giữa, chữ V hoa).

---

## Render PostgreSQL — ⚠️ Expire sau 90 ngày

Free tier của Render **tự xóa toàn bộ data sau 90 ngày**.  
→ Nhắc lịch ở ngày thứ 80 sau khi tạo DB để gia hạn.

---

*Vela Team | EXE101 — FPT University | Cập nhật: 12/06/2026*
