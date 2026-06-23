# CareNest — Daily Report 22 June 2026

## Tổng quan

Ngày 22/06 tập trung vào hai mảng chính: thiết lập Chrome web testing infrastructure cho backend (DEV_PHONE bypass) và wiring các Flutter UI screens với dữ liệu thực — tích hợp Gemini AI chat, hiển thị real user data trong profile, và làm interactive medication screen.

## Đã làm được

### Backend — Developer Tooling

**Commit `932ed35` — feat: add DEV_PHONE bypass login for Chrome web testing**

- `FirebaseService` chấp nhận prefix `"DEV_PHONE:+84xxx"` khi Firebase chưa được khởi tạo.
- Cho phép test luồng đăng nhập trên Chrome browser mà không cần cấu hình Firebase đầy đủ.
- Giảm ma sát cho developer khi test local trên web.
- **Lưu ý:** Bypass này được thêm mà không có profile/environment guard — dẫn đến security issue sẽ được fix vào ngày 23.

### Flutter — UI Wiring & AI Integration

**Commit `355c361` — feat: wire Gemini AI chat, real user data in profiles, interactive medication**

- **Gemini AI Chat:** Tích hợp `google_generative_ai` SDK, chat screen gửi/nhận message thực với Gemini API. Thêm `flutter_dotenv` để quản lý API key (key hiện là placeholder, chưa inject thực tế).
- **Elderly Profile Screen:** Hiển thị real user data lấy từ `SecureStorage` thay vì hardcode. Profile của người cao tuổi được populate từ dữ liệu đã lưu sau đăng nhập.
- **Medication Screen:** Thêm interactive toggle (bật/tắt trạng thái thuốc) và dialog thêm thuốc mới. Screen chuyển từ static list sang UI có thể tương tác.

### Sync

**Commit `d45e584` — Merge origin/main into develop**

- Đồng bộ nhánh `develop` với `main` để giữ lịch sử commit nhất quán.

## Vấn đề gặp phải

- **Security issue (critical):** DEV_PHONE bypass không có production guard — bất kỳ request nào dùng prefix `DEV_PHONE:` đều được chấp nhận kể cả trên môi trường production. Sẽ được fix ngày 23.
- **Gemini API key là placeholder:** `flutter_dotenv` được thêm nhưng key thực chưa được inject đúng cách — chat feature chưa hoạt động end-to-end.
- **Firebase chưa init trên web:** Chrome web testing cần workaround thủ công; Firebase SDK không tự init trên web platform, cần skip hoặc mock.
- **Medication data chưa gắn backend:** Interactive medication screen vẫn dùng local state, chưa persist hoặc gọi API.

## Kết quả cuối ngày

- Backend: ~35%
- Flutter: ~30%
- **Tổng thể: ~30%**
- UC hoàn thành trong ngày: Chrome testing infrastructure, Gemini chat wired (pending real key), medication screen interactive

## Ngày mai cần làm

- Fix security issues: thêm profile guard cho DEV_PHONE bypass, Firebase fail-fast mode, cấu hình JWT đúng, token rotation
- Inject Gemini API key thực vào `.env` và test chat end-to-end
- Implement UC-02, UC-03, UC-04 backend services (elderly profile, medication, health records)
- Wire Flutter screens (medication, profile, health history) tới real backend APIs
- Viết guide hoặc README cho Chrome web testing flow
