# 🏠 CareNest — Yên tâm khi xa nhà

> Ứng dụng chăm sóc sức khỏe người cao tuổi từ xa, giúp gia đình kết nối và theo dõi tình trạng sức khỏe của ông bà, cha mẹ mọi lúc mọi nơi.

**CareNest** là đồ án môn học **EXE101** — Nhóm **Vela**, học kỳ Summer 2026, Đại học FPT.

---

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Luồng xác thực](#luồng-xác-thực)
- [API Endpoints](#api-endpoints)
- [Nhóm phát triển](#nhóm-phát-triển)
- [Giấy phép](#giấy-phép)

---

## Giới thiệu

CareNest là nền tảng di động kết nối người cao tuổi với gia đình thông qua hai ứng dụng trong một:

| Vai trò | Mô tả |
|---------|-------|
| **🧓 Người cao tuổi (Elderly)** | Ứng dụng đơn giản, thân thiện: theo dõi sức khỏe, quản lý thuốc, nút SOS khẩn cấp, trò chuyện cùng AI |
| **👨‍👩‍👧 Người thân (Family)** | Dashboard giám sát: xem chỉ số sức khỏe, lịch uống thuốc, nhận cảnh báo khẩn cấp của người thân |

## Tính năng chính

### 🧓 Phía Người cao tuổi
- **🏠 Trang chủ** — Lời chào theo thời gian trong ngày, nút **SOS khẩn cấp** (đếm ngược 3 giây), tổng quan sức khỏe, danh sách thuốc hôm nay
- **💊 Quản lý thuốc** — Thêm/xem thuốc, thanh tiến trình hàng ngày, đánh dấu đã uống/bỏ lỡ
- **❤️ Sức khỏe** — Xem chỉ số (huyết áp, đường huyết, nhịp tim), nhận phân tích sức khỏe từ AI, thêm chỉ số mới
- **🤖 Chat AI** — Trò chuyện cùng Gemini AI bằng tiếng Việt, gợi ý câu hỏi nhanh, hoạt động offline với phản hồi mẫu
- **👤 Hồ sơ** — Avatar, thông tin sức khỏe cá nhân, cài đặt (chỉnh sửa, thông báo, kết nối gia đình, đăng xuất)

### 👨‍👩‍👧 Phía Người thân
- **📊 Dashboard** — Thẻ trạng thái người cao tuổi, tổng quan chỉ số, hoạt động gần đây, tự động cập nhật mỗi 30 giây
- **💊 Thuốc** — Xem danh sách thuốc của người thân
- **❤️ Sức khỏe** — Xem chỉ số sức khỏe của người thân
- **🚨 Cảnh báo** — Nhận thông báo khẩn cấp
- **👤 Hồ sơ** — Quản lý thông tin cá nhân

## Công nghệ sử dụng

### 📱 Mobile (Frontend)

| Công nghệ | Mục đích |
|-----------|----------|
| **Flutter** (SDK ^3.12.0, Dart ^3.12.0) | Cross-platform framework |
| **Riverpod** ^2.6.1 | State management (StateNotifier + autoDispose) |
| **GoRouter** ^15.1.2 | Declarative routing, auth guards |
| **Dio** ^5.8.0 | HTTP client + JWT interceptor |
| **Firebase Auth** ^5.5.2 | Xác thực OTP qua SMS |
| **Flutter Secure Storage** ^9.2.4 | Lưu token JWT an toàn |
| **Google Generative AI** ^0.4.0 | Tích hợp Gemini 1.5 Flash |
| **flutter_dotenv** ^5.1.0 | Biến môi trường |

### 🖥️ Backend

| Công nghệ | Mục đích |
|-----------|----------|
| **Spring Boot** 3.2.5 | REST API framework |
| **Java** 21 | Ngôn ngữ lập trình |
| **Spring Data JPA** + Hibernate | ORM & data access |
| **PostgreSQL** 16 (Docker) | Cơ sở dữ liệu |
| **Flyway** | Database migration |
| **JJWT** 0.12.5 | JWT authentication |
| **Firebase Admin SDK** | Xác thực Firebase token |
| **Maven** | Build & dependency management |

### ☁️ Hạ tầng

| Công nghệ | Mục đích |
|-----------|----------|
| **Docker** | PostgreSQL local development |
| **Render** (free tier) | Deploy backend |
| **Uptime Robot** | Health check monitoring |
| **Gemini API** | AI chat & phân tích sức khỏe |

## Kiến trúc hệ thống

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

## Cấu trúc dự án

```
carenest_mobile/
├── lib/                                  # Mã nguồn Flutter
│   ├── main.dart                         # Entry point: Firebase, dotenv, runApp
│   ├── app.dart                          # MaterialApp.router + theme
│   ├── core/                             # Hạ tầng dùng chung
│   │   ├── auth/token_notifier.dart      # TokenNotifier — phát hiện hết hạn session
│   │   ├── config/app_config.dart        # Cấu hình Gemini API key, system prompt
│   │   ├── constants/                    # AppColors, AppStrings
│   │   ├── navigation/                   # ElderlyShell, FamilyShell (bottom nav)
│   │   ├── network/dio_client.dart       # Dio client + JWT interceptor + refresh
│   │   ├── router/app_router.dart        # GoRouter config (auth guard, role redirect)
│   │   ├── services/gemini_service.dart  # Gemini 1.5 Flash chat
│   │   ├── storage/secure_storage.dart   # FlutterSecureStorage wrapper
│   │   └── theme/app_theme.dart          # Material 3 theme (Nunito, #2E7D9A)
│   └── features/                         # Feature-based modules
│       ├── auth/                         # Xác thực (OTP + Register)
│       ├── elderly/                      # Màn hình người cao tuổi
│       └── family/                       # Màn hình người thân
├── backend/                              # Spring Boot REST API
│   ├── src/main/java/com/carenest/
│   │   ├── config/                       # Security, Firebase, CORS config
│   │   ├── controller/                   # Auth, ElderlyProfile, FamilyLink, Medication
│   │   ├── service/                      # Business logic
│   │   ├── repository/                   # JPA repositories (12 repos)
│   │   ├── entity/                       # JPA entities (18 entities)
│   │   ├── dto/                          # Data Transfer Objects
│   │   └── security/                     # JWT filter, AuthorizationService
│   └── src/main/resources/
│       ├── db/migration/                 # Flyway migrations (V1–V15)
│       └── application-*.properties      # Cấu hình theo môi trường
├── test/                                 # Unit & widget tests
├── docs/                                 # Tài liệu dự án (local only)
│   ├── ARCHITECTURE.md                   # Kiến trúc chi tiết
│   ├── carenest-feature-analysis.md      # Phân tích 24 use case
│   ├── setup-guide.md                    # Hướng dẫn cài đặt chi tiết
│   ├── tech-stack.md                     # Giải thích lựa chọn công nghệ
│   ├── workflow.md                       # Quy trình làm việc nhóm
│   └── daily-reports/                    # Nhật ký daily standup
├── scripts/                              # Scripts tiện ích
├── docker-compose.yml                    # PostgreSQL 16 Docker
├── .env.example                          # Mẫu biến môi trường
└── analysis_options.yaml                 # Dart linter config
```

## Cài đặt & Chạy

### Yêu cầu hệ thống

- **Flutter SDK** >= 3.12.0 (Dart >= 3.12.0)
- **JDK** 21 (Eclipse Temurin khuyến nghị)
- **Docker Desktop**
- **Android Studio** (cho emulator) hoặc **VS Code** + Flutter extension

### ⚡ Quick Start

```bash
# 1. Clone repository
git clone https://github.com/phanhhhhhhh/carenest-mobile.git
cd carenest_mobile

# 2. Cấu hình biến môi trường
cp .env.example .env
# → Mở .env và điền GEMINI_API_KEY, các giá trị khác giữ mặc định cho dev local

# 3. Khởi động PostgreSQL
docker-compose up -d

# 4. Cài Flutter dependencies
flutter pub get

# 5. Kiểm tra môi trường
flutter doctor

# 6. Chạy ứng dụng
flutter run                          # Tự động chọn thiết bị
flutter run -d chrome                # Chạy trên Chrome (web)
flutter run -d <device_id>           # Chạy trên thiết bị cụ thể
```

### 🖥️ Chạy Backend (trong terminal riêng)

```bash
cd backend

# Tạo file cấu hình local (từ mẫu có sẵn)
cp src/main/resources/application-local.example.properties \
   src/main/resources/application-local.properties

# Chạy Spring Boot với profile local
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 🔧 Dev Mode (Web)

Khi chạy trên Chrome, nhập số điện thoại với prefix `DEV_PHONE:` để bỏ qua bước xác thực OTP Firebase:

```
DEV_PHONE:0987654321
```

> ⚠️ Chỉ dùng cho môi trường phát triển local.

## Luồng xác thực

```
 Người dùng                Flutter App              Firebase          Backend
    │                         │                       │                  │
    │  1. Nhập SĐT            │                       │                  │
    │────────────────────────>│                       │                  │
    │                         │  2. Gửi OTP request   │                  │
    │                         │──────────────────────>│                  │
    │                         │  3. Gửi mã OTP SMS    │                  │
    │  4. Nhận OTP, nhập mã   │                       │                  │
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
    │  9. Vào trang chủ       │                       │                  │
    │<────────────────────────│                       │                  │
    │                         │                       │                  │
    │  ... khi access token hết hạn ...               │                  │
    │                         │  POST /api/auth/refresh                   │
    │                         │──────────────────────────────────────────>│
    │                         │  JWT access token mới                     │
    │                         │<──────────────────────────────────────────│
```

Token được lưu trong **Flutter Secure Storage** và tự động đính kèm qua **Dio Interceptor**. Khi token hết hạn (401), interceptor tự động gọi refresh và retry request gốc.

## API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/auth/login` | Đăng nhập bằng Firebase ID Token | — |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới | — |
| `POST` | `/api/auth/refresh` | Làm mới access token | Refresh Token |
| `GET` | `/api/elderly/profile` | Lấy hồ sơ người cao tuổi | ✅ |
| `PUT` | `/api/elderly/profile` | Cập nhật hồ sơ người cao tuổi | ✅ |
| `GET` | `/api/family/elderly` | Lấy danh sách người thân đang theo dõi | ✅ |
| `POST` | `/api/family/link` | Gửi yêu cầu kết nối | ✅ |
| `PUT` | `/api/family/link/{id}` | Phản hồi yêu cầu kết nối | ✅ |
| `GET` | `/api/medications` | Lấy danh sách thuốc | ✅ |
| `POST` | `/api/medications` | Thêm thuốc mới | ✅ |
| `POST` | `/api/medications/{id}/log` | Ghi nhận lịch sử uống thuốc | ✅ |

> Backend URL local: `http://10.0.2.2:8080/api` (Android emulator) / `http://localhost:8080/api` (web)

## Nhóm phát triển

**Nhóm Vela** — EXE101, Đại học FPT, Summer 2026

| Thành viên | Vai trò |
|------------|---------|
| **Phan** (Trưởng nhóm) | Flutter Developer, Backend Developer |
| Các thành viên khác | Flutter / Backend / QA |

### Git Workflow

- **`main`** — Production, chỉ merge từ develop khi release/demo
- **`develop`** — Nhánh phát triển chính
- **Feature branches** — `feature/<tên-tính-năng>`, merge vào develop qua PR

### Commit Convention

- `feat:` — Tính năng mới
- `fix:` — Sửa lỗi
- `chore:` — Công việc phụ trợ (config, cleanup)
- `docs:` — Tài liệu
- `refactor:` — Tái cấu trúc code

## Giấy phép

Dự án học tập — Đại học FPT, EXE101.

---

<p align="center">
  <b>CareNest</b> — <i>Yên tâm khi xa nhà</i> 🏠💚
</p>
