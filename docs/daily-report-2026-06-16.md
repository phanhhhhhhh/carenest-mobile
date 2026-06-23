# CareNest — Daily Report 16 June 2026

## Tổng quan
Ngày 16/06 là ngày đột phá đầu tiên cho Flutter: toàn bộ skeleton project được dựng từ đầu và UC-01 Auth Flow hoàn chỉnh (Phone OTP → Firebase → JWT) được implement xong trong cùng một ngày. PR đầu tiên cũng được merge vào main.

## Đã làm được

### Flutter — Auth Module (UC-01)

- **a1ab6c8** — Dựng Flutter skeleton + auth scaffold ban đầu
  - Thêm 24 dependencies vào `pubspec.yaml`: `firebase_auth`, `dio`, `flutter_riverpod`, `go_router`, `flutter_secure_storage`, v.v.
  - Tạo `secure_storage.dart` để lưu JWT token an toàn
  - Implement phiên bản khởi tạo của `auth_repository.dart` và `auth_provider.dart`
  - Tạo các màn hình ban đầu: `phone_screen.dart`, `otp_screen.dart`, `home_screen.dart`
  - Cập nhật plugin registrants cho Linux, macOS, Windows
  - ~995 insertions — về cơ bản là toàn bộ project Flutter được dựng từ đầu

- **efbee8e** — Implement đầy đủ UC-01 Auth Flow cho Flutter
  - Hoàn thiện `auth_repository.dart`: tích hợp Firebase Phone Auth + gọi backend Spring Boot để lấy JWT
  - Hoàn thiện `auth_provider.dart`: quản lý state với Riverpod, xử lý login/register/token refresh
  - Hoàn thiện `otp_screen.dart` và `phone_screen.dart`: UI nhập số điện thoại và OTP
  - Tạo mới `register_screen.dart`: màn hình đăng ký cho user mới
  - Cập nhật `home_screen.dart`: điều hướng theo role (ELDERLY / FAMILY)
  - ~1307 insertions — complete auth flow hoạt động end-to-end

### Release

- **53655ae** — Merge pull request #5 từ `phanhhhhhhh/develop` → `main`
  - PR đầu tiên chính thức của dự án được merge
  - Đánh dấu UC-01 hoàn chỉnh trên cả backend lẫn Flutter

## Cần cập nhật — Dev khác đọc trước

> Nếu bạn pull code từ ngày này, cần làm các bước sau trước khi chạy app:

### Flutter — Dependencies mới (pubspec.yaml)

Chạy `flutter pub get` để cài 24 packages mới, bao gồm:

| Package | Dùng để làm gì |
|---------|---------------|
| `firebase_auth` | Phone OTP authentication |
| `firebase_core` | Khởi tạo Firebase SDK |
| `dio` | HTTP client gọi backend API |
| `flutter_riverpod` | State management |
| `go_router` | Navigation/routing |
| `flutter_secure_storage` | Lưu JWT token an toàn (iOS Keychain, Android Keystore) |

### Firebase — Setup cần thiết

1. Cần file `google-services.json` (Android) và `GoogleService-Info.plist` (iOS) — lấy từ Firebase Console project CareNest
2. Cả 2 file này **không được commit** vào git (đã có trong `.gitignore`)
3. Liên hệ trưởng nhóm để lấy file cấu hình nếu chưa có

### flutter_secure_storage — Platform config

- **Android:** `minSdkVersion` phải ≥ 18 trong `android/app/build.gradle`
- **iOS:** keychain sharing không cần cấu hình thêm
- **Web:** không hỗ trợ `flutter_secure_storage` — web dùng path khác (xem báo cáo 22/06)

---

## Vấn đề gặp phải

- Phải cài đặt nhiều dependency cùng lúc (24 packages) — dễ xảy ra version conflict, cần kiểm tra compatibility kỹ
- Plugin registrants (`GeneratedPluginRegistrant`) phải được cập nhật thủ công cho cả 3 desktop platform (Linux, macOS, Windows) khi thêm native plugins như `flutter_secure_storage`
- `flutter_secure_storage` yêu cầu cấu hình thêm cho từng platform (Android Keystore, iOS Keychain, Windows DPAPI) — có thể gây lỗi nếu thiếu config
- Tích hợp Firebase Phone Auth với backend JWT là flow phức tạp (Firebase token → backend verify → issue JWT) — cần đảm bảo error handling đầy đủ cho các edge case (OTP timeout, invalid token, v.v.)

## Kết quả cuối ngày

- Backend: ~35% (Foundation + UC-01 done từ trước)
- Flutter: ~20% (UC-01 Auth complete, UI screens are shells)
- **Tổng thể: ~20%**
- UC hoàn thành: UC-01 Auth (Flutter side)

## Ngày mai cần làm

- Bắt đầu implement UC-02 trở đi (Health Monitoring, Medication, Emergency, v.v.) trên Flutter
- Chuyển các UI screens hiện đang là shell/hardcode thành màn hình thực với data thật
- Kết nối Flutter với backend API cho các UC còn lại (UC-02 đến UC-09)
- Thiết kế và implement navigation flow đầy đủ giữa các màn hình
- Viết widget tests cơ bản cho auth flow vừa implement
