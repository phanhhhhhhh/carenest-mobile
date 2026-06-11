# 📋 CareNest — Báo Cáo Phân Tích Feature & Kế Hoạch Thực Hiện

> **Phiên bản:** 1.0 | **Ngày:** 09/06/2026 | **Dự án:** EXE101 → EXE2

---

# PHẦN 1 — TỔNG QUAN DỰ ÁN

## CareNest là gì?

**CareNest** là ứng dụng điện thoại giúp **gia đình chăm sóc người thân cao tuổi từ xa**.

Vấn đề thực tế: Con cái đi làm xa, không ở cạnh bố mẹ/ông bà mỗi ngày. Họ lo lắng:
- Bố mẹ có uống thuốc đúng giờ không?
- Huyết áp, đường huyết hôm nay thế nào?
- Nếu có chuyện khẩn cấp, làm sao biết ngay?
- Ông bà ở nhà một mình có cô đơn không?

CareNest giải quyết tất cả những vấn đề đó trong một ứng dụng duy nhất.

## Ai dùng app này?

| Người dùng | Mô tả | Dùng app để làm gì |
|------------|-------|-------------------|
| 👴 **Elderly** (Người cao tuổi) | 60 tuổi trở lên, dùng app trực tiếp | Nhận nhắc thuốc, chat với AI, bấm SOS khi cần |
| 👨 **Family** (Thành viên gia đình) | 25–45 tuổi, đang đi làm xa | Theo dõi sức khỏe bố mẹ, cài lịch thuốc, nhận cảnh báo |
| 🤖 **System/AI** | Hệ thống tự động (Gemini AI) | Gửi thông báo, phân tích sức khỏe, tạo báo cáo |

## Tổng số tính năng

- **24 Use Cases** chia thành **7 Module**
- **17 tính năng MVP** (làm trong EXE2)
- **6 tính năng Premium** (giai đoạn sau)
- **1 tính năng defer** (Google Fit — quá phức tạp)

| Module | Tên | Số UC |
|--------|-----|-------|
| 1 | Authentication & Onboarding | 3 UC |
| 2 | Medication Management | 4 UC |
| 3 | Health Monitoring | 5 UC |
| 4 | Emergency Alert | 2 UC |
| 5 | AI Chatbot Companion | 3 UC |
| 6 | Family Dashboard | 4 UC |
| 7 | Settings & Profile | 3 UC |

---

# PHẦN 2 — PHÂN TÍCH CHI TIẾT TỪNG TÍNH NĂNG

---

## MODULE 1: AUTHENTICATION & ONBOARDING

---

### 🔷 UC-01: Đăng Ký Tài Khoản

**📌 Mô tả bằng ngôn ngữ thường:**
Người dùng mở app lần đầu, chọn mình là người cao tuổi hay thành viên gia đình, nhập tên + số điện thoại + ngày sinh. Hệ thống gửi mã OTP 6 số qua Zalo hoặc SMS. Người dùng nhập mã → tài khoản được tạo → vào trang chủ.

**👤 Ai sử dụng:** Elderly & Family (lần đầu dùng app)

**🔄 Luồng sử dụng:**
```
Mở app → Chọn vai trò (Elderly/Family) → Nhập thông tin cá nhân
→ Nhận OTP qua Zalo/SMS → Nhập OTP → Hoàn tất hồ sơ ban đầu → Vào Home
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Màn hình chọn role, form nhập thông tin, màn hình nhập OTP, loading state
- Backend: API `/auth/register`, `/auth/send-otp`, `/auth/verify-otp` | Bảng `users`
- Bên thứ 3: **Firebase Auth** (gửi OTP SMS) hoặc **Zalo OA** (gửi OTP qua Zalo)

**📊 Độ khó:** ⭐⭐⭐ Khó
> Lý do: Tích hợp Firebase Auth + Zalo OTP là hai hệ thống khác nhau, cần xử lý nhiều trường hợp lỗi (OTP hết hạn, sai mã, quá số lần thử).

**📅 Ước tính:** 4–5 ngày

**🔗 Phải làm trước:** Không có dependency

**🚦 Trạng thái:** `[ ] Chưa bắt đầu` — chưa có màn hình nào

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

### 🔷 UC-02: Đăng Nhập

**📌 Mô tả bằng ngôn ngữ thường:**
Người dùng đã có tài khoản mở app, nhập số điện thoại, rồi nhập mã PIN 6 số (hoặc dùng vân tay / Face ID). Hệ thống xác nhận → vào trang chủ. Nếu quên PIN thì reset qua OTP.

**👤 Ai sử dụng:** Elderly & Family

**🔄 Luồng sử dụng:**
```
Mở app → Nhập số điện thoại → Nhập PIN 6 số (hoặc scan vân tay)
→ Xác thực thành công → Vào Home Dashboard
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Màn hình nhập số điện thoại, màn hình PIN, tích hợp `local_auth` cho vân tay/Face ID
- Backend: API `/auth/login` trả về JWT token | Lưu token vào `shared_preferences`
- Bên thứ 3: **local_auth** (Flutter package cho biometrics)

**📊 Độ khó:** ⭐⭐ Trung bình
> Lý do: Biometrics khá dễ với package có sẵn, PIN UI cần custom nhưng không quá phức tạp.

**📅 Ước tính:** 3 ngày

**🔗 Phải làm sau:** UC-01

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

### 🔷 UC-03: Kết Nối Elderly ↔ Family

**📌 Mô tả bằng ngôn ngữ thường:**
Thành viên gia đình vào cài đặt, nhập số điện thoại của bố/mẹ (hoặc quét mã QR). Hệ thống gửi thông báo đến điện thoại của người cao tuổi. Người cao tuổi bấm "Đồng ý" → hai tài khoản được liên kết. Sau đó, gia đình có thể theo dõi sức khỏe của bố/mẹ.

**👤 Ai sử dụng:** Family (gửi yêu cầu), Elderly (xác nhận)

**🔄 Luồng sử dụng:**
```
Family: Vào Cài đặt → "Thêm người thân" → Nhập SĐT hoặc quét QR
→ Gửi yêu cầu kết nối
Elderly: Nhận thông báo → Xem thông tin → Bấm "Đồng ý"
→ Hai tài khoản liên kết thành công
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Màn hình nhập SĐT, màn hình quét QR (`qr_code_scanner`), màn hình xác nhận cho Elderly
- Backend: API `/family-links/request`, `/family-links/confirm` | Bảng `family_links`
- Bên thứ 3: **FCM** (gửi thông báo yêu cầu kết nối đến Elderly)

**📊 Độ khó:** ⭐⭐ Trung bình
> Lý do: Logic kết nối hai tài khoản khá rõ ràng, nhưng cần xử lý real-time notification.

**📅 Ước tính:** 3 ngày

**🔗 Phải làm sau:** UC-01, UC-02

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

## MODULE 2: MEDICATION MANAGEMENT

---

### 🔷 UC-04: Thêm Lịch Uống Thuốc

**📌 Mô tả bằng ngôn ngữ thường:**
Thành viên gia đình (hoặc bản thân người cao tuổi) vào mục "Quản lý thuốc", bấm "Thêm thuốc mới". Điền tên thuốc, liều lượng, giờ uống (ví dụ: 7:00 sáng và 19:00 tối), chọn ngày trong tuần. Có thể chụp ảnh toa thuốc để lưu kèm. Bấm Lưu → hệ thống tự động tạo lịch nhắc nhở.

**👤 Ai sử dụng:** Family (chủ yếu), Elderly (tự thêm)

**🔄 Luồng sử dụng:**
```
Vào "Quản lý Thuốc" → "Thêm thuốc" → Nhập tên thuốc, liều lượng
→ Chọn giờ uống + ngày trong tuần → (Tùy chọn) Chụp ảnh toa thuốc
→ Lưu → Lịch nhắc tự động được tạo
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Form thêm thuốc, Time picker, Day selector, camera/gallery picker
- Backend: API `/medications` (POST) | Bảng `medications`, `medication_schedules` | Scheduler (Spring Scheduler / Quartz)
- Bên thứ 3: **Cloudinary** (lưu ảnh toa thuốc)

**📊 Độ khó:** ⭐⭐ Trung bình
> Lý do: Form UI không quá khó, nhưng phần Backend scheduler (tạo job nhắc nhở tự động) cần thiết kế cẩn thận.

**📅 Ước tính:** 4 ngày

**🔗 Phải làm sau:** UC-03

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

### 🔷 UC-05: Nhận Nhắc Uống Thuốc & Xác Nhận

**📌 Mô tả bằng ngôn ngữ thường:**
Đúng giờ đã đặt, điện thoại của người cao tuổi rung lên và hiện thông báo: "Đã đến giờ uống thuốc huyết áp Amlodipine 5mg". Bấm vào thông báo → màn hình hiển thị tên thuốc, liều lượng. Người cao tuổi bấm "Đã uống" → hệ thống ghi lại và thông báo cho gia đình biết. Nếu không bấm sau X phút → gia đình nhận cảnh báo "Bố chưa uống thuốc".

**👤 Ai sử dụng:** Elderly (nhận và xác nhận), Family (nhận cảnh báo nếu bỏ lỡ)

**🔄 Luồng sử dụng:**
```
Hệ thống gửi Push Notification → Elderly mở thông báo
→ Xem tên + liều thuốc → Bấm "Đã uống"
→ Hệ thống ghi lại + cập nhật dashboard gia đình

[Nếu không phản hồi sau 30 phút]
→ Hệ thống gửi cảnh báo đến Family
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Màn hình xác nhận uống thuốc, xử lý notification tap
- Backend: **Scheduler** kiểm tra trạng thái sau X phút, gửi alert nếu chưa confirm | Bảng `medication_logs`
- Bên thứ 3: **FCM** (push notification), **Zalo OA** (kênh dự phòng)

**📊 Độ khó:** ⭐⭐⭐ Khó
> Lý do: Phần scheduler "kiểm tra sau X phút rồi gửi alert" là logic phức tạp ở backend. Cần xử lý timezone, missed doses, v.v.

**📅 Ước tính:** 5 ngày

**🔗 Phải làm sau:** UC-04

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

### 🔷 UC-06: Xem Lịch Sử Uống Thuốc

**📌 Mô tả bằng ngôn ngữ thường:**
Vào mục "Lịch sử" trong Quản lý Thuốc. Chọn xem 7 ngày hoặc 30 ngày. Màn hình hiển thị biểu đồ tỷ lệ tuân thủ (ví dụ: "Tuần này uống đúng 85%") và danh sách từng lần uống (đúng giờ / trễ / bỏ lỡ).

**👤 Ai sử dụng:** Family & Elderly

**🔄 Luồng sử dụng:**
```
Vào "Quản lý Thuốc" → "Lịch sử" → Chọn khoảng thời gian (7/30 ngày)
→ Xem biểu đồ tỷ lệ tuân thủ + danh sách chi tiết từng liều
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Chart widget (`fl_chart`), danh sách log có filter ngày tháng
- Backend: API `/medications/{id}/history?days=7` | Query từ bảng `medication_logs`
- Bên thứ 3: Không cần

**📊 Độ khó:** ⭐⭐ Trung bình
> Lý do: Chủ yếu là UI hiển thị data, chart library có sẵn. Backend chỉ cần query đơn giản.

**📅 Ước tính:** 3 ngày

**🔗 Phải làm sau:** UC-05

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🟡 Should have

---

### 🔷 UC-07: Sửa / Xóa Lịch Thuốc

**📌 Mô tả bằng ngôn ngữ thường:**
Thành viên gia đình vào danh sách thuốc, bấm vào thuốc muốn chỉnh. Chỉnh sửa liều lượng, giờ uống, hoặc bấm "Xóa" để dừng hẳn. Sau khi lưu, lịch nhắc nhở tự động cập nhật theo thông tin mới.

**👤 Ai sử dụng:** Family

**🔄 Luồng sử dụng:**
```
Vào danh sách thuốc → Chọn thuốc → Chỉnh sửa thông tin → Lưu
hoặc → Bấm "Xóa" → Xác nhận → Lịch nhắc bị hủy
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Form edit (tương tự UC-04), dialog xác nhận xóa
- Backend: API `/medications/{id}` (PUT/DELETE) | Cập nhật/hủy scheduled jobs
- Bên thứ 3: Không cần

**📊 Độ khó:** ⭐ Dễ
> Lý do: Tái sử dụng form từ UC-04, chỉ thêm logic DELETE và update scheduler.

**📅 Ước tính:** 2 ngày

**🔗 Phải làm sau:** UC-04

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

## MODULE 3: HEALTH MONITORING

---

### 🔷 UC-08: Nhập Chỉ Số Sức Khỏe Thủ Công

**📌 Mô tả bằng ngôn ngữ thường:**
Người cao tuổi vào mục "Sức khỏe", bấm "Ghi chỉ số". Chọn loại chỉ số muốn ghi: huyết áp, đường huyết, nhịp tim, cân nặng. Nhập số liệu. Bấm Lưu → AI ngay lập tức phân tích và hiển thị nhận xét ngắn (ví dụ: "Huyết áp của bạn hơi cao hôm nay, hãy nghỉ ngơi và uống nhiều nước").

**👤 Ai sử dụng:** Elderly

**🔄 Luồng sử dụng:**
```
Vào "Sức khỏe" → "Ghi chỉ số" → Chọn loại chỉ số
→ Nhập số liệu → Lưu → Xem nhận xét của AI ngay lập tức
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Form chọn loại + nhập số, màn hình kết quả với AI insight
- Backend: API `/health-metrics` (POST) | Bảng `health_metrics` | Trigger AI analysis
- Bên thứ 3: **Gemini API** (phân tích chỉ số và đưa ra nhận xét)

**📊 Độ khó:** ⭐⭐ Trung bình
> Lý do: UI nhập số đơn giản, nhưng cần tích hợp Gemini API đúng cách để phân tích real-time.

**📅 Ước tính:** 4 ngày

**🔗 Phải làm sau:** UC-01

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

### 🔷 UC-09: Đồng Bộ Dữ Liệu từ Google Fit / Smartwatch

**📌 Mô tả bằng ngôn ngữ thường:**
App tự động lấy dữ liệu sức khỏe (nhịp tim, số bước đi, giấc ngủ) từ Google Fit hoặc đồng hồ thông minh mỗi giờ. Người dùng không cần làm gì — data tự cập nhật.

**👤 Ai sử dụng:** System (tự động)

**⚙️ Kỹ thuật cần làm:**
- Flutter: Google Fit OAuth integration, background sync
- Backend: Webhook hoặc scheduled fetch từ Google Fit API
- Bên thứ 3: **Google Fit API** (OAuth approval từ Google mất 2–4 tuần)

**📊 Độ khó:** ⭐⭐⭐⭐ Rất khó
> Lý do: Google Fit API cần OAuth review approval (mất nhiều tuần), background sync phức tạp, phụ thuộc thiết bị người dùng có smartwatch không.

**📅 Ước tính:** 10–14 ngày (chưa tính thời gian chờ Google approve)

**🔗 Phải làm sau:** UC-08

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** ⚪ Phase 2 — **DEFER**, không làm trong EXE2

---

### 🔷 UC-10: AI Phát Hiện Bất Thường & Cảnh Báo

**📌 Mô tả bằng ngôn ngữ thường:**
Mỗi khi có chỉ số mới được ghi, AI tự động so sánh với ngưỡng bình thường của người đó (dựa trên tuổi, bệnh nền). Nếu phát hiện bất thường (ví dụ huyết áp 180/110), AI gửi ngay thông báo đến gia đình: "⚠️ Huyết áp của bố đang cao bất thường, hãy liên hệ ngay!". Dashboard gia đình cũng chuyển sang màu đỏ.

**👤 Ai sử dụng:** AI (tự động phân tích), Family (nhận cảnh báo)

**🔄 Luồng sử dụng:**
```
[Tự động khi có chỉ số mới]
AI nhận dữ liệu → So sánh ngưỡng bình thường → Phân tích xu hướng 7 ngày
→ [Bình thường] Cập nhật dashboard xanh
→ [Bất thường] Ghi log cảnh báo + Gửi Push/Zalo notification đến Family
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Hiển thị badge cảnh báo, màu status (xanh/vàng/đỏ) trên dashboard
- Backend: AI analysis service gọi Gemini API | Bảng `health_alerts` | Notification trigger
- Bên thứ 3: **Gemini API** (phân tích), **FCM + Zalo OA** (gửi cảnh báo)

**📊 Độ khó:** ⭐⭐⭐ Khó
> Lý do: Logic AI phải được prompt đúng để phân tích chính xác. Cần thiết kế threshold thông minh theo từng người (có bệnh nền khác nhau).

**📅 Ước tính:** 5–6 ngày

**🔗 Phải làm sau:** UC-08, UC-22 (hồ sơ sức khỏe)

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

### 🔷 UC-11: Xem Báo Cáo Sức Khỏe

**📌 Mô tả bằng ngôn ngữ thường:**
Vào mục "Báo cáo", chọn loại chỉ số (huyết áp, đường huyết, v.v.) và khoảng thời gian. Màn hình hiển thị biểu đồ đường thể hiện xu hướng theo thời gian kèm nhận xét của AI ("Huyết áp của bạn đang có xu hướng giảm tốt trong tuần qua"). Có thể xuất PDF để mang đến bệnh viện (tính năng Premium).

**👤 Ai sử dụng:** Family & Elderly

**🔄 Luồng sử dụng:**
```
Vào "Sức khỏe" → "Báo cáo" → Chọn loại chỉ số + khoảng thời gian
→ Xem biểu đồ + nhận xét AI → (Premium) Xuất PDF
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Line chart (`fl_chart`), date range picker, PDF export (`pdf` package — Premium only)
- Backend: API `/health-metrics/report?type=blood_pressure&days=30`
- Bên thứ 3: **Gemini API** (tạo nhận xét AI cho biểu đồ)

**📊 Độ khó:** ⭐⭐ Trung bình
> Lý do: Chart và report khá standard. PDF export hơi phức tạp nhưng có thể defer sang Premium.

**📅 Ước tính:** 4 ngày (chart + AI comment, không cần PDF trước)

**🔗 Phải làm sau:** UC-08

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🟡 Should have (chart); ⚪ Phase 2 (PDF export)

---

### 🔷 UC-12: AI Báo Cáo Tuần (Weekly Summary)

**📌 Mô tả bằng ngôn ngữ thường:**
Mỗi Chủ nhật lúc 20:00, AI tự động tạo và gửi một bản tóm tắt sức khỏe tuần qua cho gia đình: chỉ số nào tốt, chỉ số nào đáng lo, tỷ lệ uống thuốc đúng giờ, số lần phát hiện bất thường. Giống như "bản tin sức khỏe hàng tuần" của bố/mẹ.

**👤 Ai sử dụng:** AI (tạo báo cáo), Family (nhận)

**⚙️ Kỹ thuật cần làm:**
- Flutter: Màn hình xem weekly report, lịch sử các báo cáo cũ
- Backend: Scheduled job (Chủ nhật 20:00) → gọi Gemini API → lưu report → push notification
- Bên thứ 3: **Gemini API**, **FCM**

**📊 Độ khó:** ⭐⭐⭐ Khó
> Lý do: Cần thiết kế prompt AI tốt để tóm tắt dữ liệu một tuần ra bản báo cáo có giá trị thực sự.

**📅 Ước tính:** 5 ngày

**🔗 Phải làm sau:** UC-08, UC-10, UC-11

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** ⚪ Phase 2 (Premium feature)

---

## MODULE 4: EMERGENCY ALERT

---

### 🔷 UC-13: Nút SOS Khẩn Cấp

**📌 Mô tả bằng ngôn ngữ thường:**
Trên trang chủ của người cao tuổi có một **nút đỏ to "SOS"** rất dễ nhìn. Khi bấm, xuất hiện đếm ngược 3 giây (để tránh bấm nhầm). Nếu không bấm Hủy, hệ thống ngay lập tức gửi tin nhắn khẩn cấp đến TẤT CẢ thành viên gia đình đã kết nối, kèm vị trí GPS của người cao tuổi. Gia đình nhận thông báo đỏ và bấm "Đã biết" để xác nhận.

**👤 Ai sử dụng:** Elderly (bấm SOS), Family (nhận cảnh báo)

**🔄 Luồng sử dụng:**
```
Elderly bấm nút SOS đỏ → Đếm ngược 3 giây (có thể bấm Hủy)
→ Hệ thống gửi Push + Zalo + SMS đến tất cả Family kèm GPS
→ Family nhận thông báo đỏ → Bấm "Đã biết"
→ Hệ thống ghi lại sự kiện với timestamp đầy đủ
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Nút SOS lớn, countdown dialog, `geolocator` package lấy GPS
- Backend: API `/emergency/sos` | Bảng `emergency_incidents` | Multi-channel notification
- Bên thứ 3: **FCM** (push), **Zalo OA** (Zalo notification), **SMS gateway** (Twilio/VNPT fallback)

**📊 Độ khó:** ⭐⭐⭐ Khó
> Lý do: Cần gửi nhiều kênh thông báo đồng thời (Push + Zalo + SMS), xử lý fallback khi một kênh fail. GPS permission phức tạp trên iOS/Android.

**📅 Ước tính:** 5–6 ngày

**🔗 Phải làm sau:** UC-03

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have (đây là tính năng "wow" khi demo)

---

### 🔷 UC-14: Xem Lịch Sử Sự Kiện SOS

**📌 Mô tả bằng ngôn ngữ thường:**
Thành viên gia đình vào Dashboard, mở mục "Lịch sử khẩn cấp". Xem danh sách các lần SOS đã xảy ra: thời gian, địa điểm (tên đường nếu có), trạng thái (đã được xác nhận hay chưa).

**👤 Ai sử dụng:** Family

**🔄 Luồng sử dụng:**
```
Vào Dashboard → "Lịch sử khẩn cấp"
→ Xem danh sách theo thời gian (mới nhất lên đầu)
→ Bấm vào sự kiện → Xem chi tiết (giờ, vị trí trên bản đồ)
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Danh sách sự kiện, Google Maps widget hiển thị vị trí
- Backend: API `/emergency/incidents` | Query từ bảng `emergency_incidents`
- Bên thứ 3: **Google Maps** (hiển thị vị trí trên bản đồ)

**📊 Độ khó:** ⭐ Dễ
> Lý do: Chỉ là màn hình hiển thị danh sách, không có logic phức tạp.

**📅 Ước tính:** 2 ngày

**🔗 Phải làm sau:** UC-13

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🟡 Should have

---

## MODULE 5: AI CHATBOT COMPANION

---

### 🔷 UC-15: Chat Với AI Companion

**📌 Mô tả bằng ngôn ngữ thường:**
Người cao tuổi mở tab "Chat". AI chào hỏi theo tên và thời điểm trong ngày ("Chào buổi sáng bà Lan!"). Người dùng có thể hỏi về sức khỏe ("Huyết áp của tôi có ổn không?"), về thuốc ("Tôi uống thuốc gì hôm nay?"), hoặc chỉ đơn giản là nói chuyện cho vui để bớt cô đơn. AI trả lời thân thiện, ấm áp, dùng ngôn ngữ dễ hiểu cho người lớn tuổi.

**👤 Ai sử dụng:** Elderly

**🔄 Luồng sử dụng:**
```
Mở tab "Chat" → AI chào hỏi cá nhân hóa
→ Elderly gõ hoặc nói câu hỏi
→ AI phân loại: hỏi về sức khỏe / hỏi về thuốc / trò chuyện thường
→ AI trả lời phù hợp (dùng dữ liệu thật từ hồ sơ nếu cần)
→ Lịch sử chat được lưu lại
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Chat UI (bubble messages), TTS playback (tùy chọn nghe thay vì đọc)
- Backend: API `/chat/message` | Bảng `chat_history` | Gemini API với system prompt
- Bên thứ 3: **Gemini API** (AI), **flutter_tts** (đọc to câu trả lời)

**📊 Độ khó:** ⭐⭐⭐ Khó
> Lý do: Cần thiết kế system prompt tốt để AI biết về bệnh nền, thuốc, chỉ số sức khỏe của từng người. Phải "inject" dữ liệu thật vào context của AI.

**📅 Ước tính:** 6–7 ngày

**🔗 Phải làm sau:** UC-08, UC-04 (cần có dữ liệu sức khỏe và thuốc để AI trả lời)

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have (đây là tính năng differentiator quan trọng nhất)

---

### 🔷 UC-16: Nhập Liệu Bằng Giọng Nói

**📌 Mô tả bằng ngôn ngữ thường:**
Trong màn hình Chat, có nút micro. Người cao tuổi bấm giữ và nói — app chuyển giọng nói thành chữ rồi gửi cho AI xử lý giống như gõ tay. Rất tiện cho người lớn tuổi không quen gõ điện thoại.

**👤 Ai sử dụng:** Elderly

**⚙️ Kỹ thuật cần làm:**
- Flutter: `speech_to_text` package, microphone UI (hold-to-talk button)
- Backend: Không cần thêm — voice → text → xử lý như UC-15
- Bên thứ 3: **speech_to_text** (Flutter package, dùng native STT của thiết bị)

**📊 Độ khó:** ⭐⭐ Trung bình
> Lý do: Package `speech_to_text` đã xử lý phần khó, nhưng cần test kỹ với tiếng Việt.

**📅 Ước tính:** 3 ngày

**🔗 Phải làm sau:** UC-15

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** ⚪ Phase 2

---

### 🔷 UC-17: AI Nhắc Nhở Qua Chat

**📌 Mô tả bằng ngôn ngữ thường:**
Thay vì chỉ gửi thông báo khô khan, AI gửi nhắc nhở qua Chat theo kiểu trò chuyện thân thiện: "Bà Lan ơi, còn 30 phút nữa là đến giờ uống thuốc huyết áp rồi đó! Bà có nhớ để thuốc ở đâu không?" Cảm giác như có người nhắc chứ không phải máy tính.

**👤 Ai sử dụng:** System (gửi tự động), Elderly (đọc và phản hồi)

**⚙️ Kỹ thuật cần làm:**
- Backend: Scheduler kiểm tra lịch, tạo message thông qua Gemini để viết theo phong cách thân thiện → đẩy vào chat
- Flutter: Không cần thêm (dùng UI chat của UC-15)

**📊 Độ khó:** ⭐⭐ Trung bình

**📅 Ước tính:** 3 ngày

**🔗 Phải làm sau:** UC-15, UC-04

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** ⚪ Phase 2

---

## MODULE 6: FAMILY DASHBOARD

---

### 🔷 UC-18: Tổng Quan Sức Khỏe Trên Dashboard (Family)

**📌 Mô tả bằng ngôn ngữ thường:**
Khi thành viên gia đình mở app, trang chủ hiển thị ngay các thông tin quan trọng nhất về bố/mẹ hôm nay: chỉ số sức khỏe mới nhất, tình trạng uống thuốc (đã uống bao nhiêu liều), cảnh báo nào chưa xử lý, và tóm tắt chat với AI. Bấm vào ô nào thì xem chi tiết phần đó.

**👤 Ai sử dụng:** Family

**🔄 Luồng sử dụng:**
```
Mở app → Trang chủ hiển thị widgets tóm tắt
→ Bấm widget "Sức khỏe" → Xem chi tiết chỉ số
→ Bấm widget "Thuốc" → Xem lịch sử uống thuốc hôm nay
→ Bấm widget "Cảnh báo" → Xem danh sách cảnh báo
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Dashboard layout với các Card widgets, pull-to-refresh, navigation to detail screens
- Backend: API `/dashboard/summary/{elderlyId}` — aggregated endpoint trả nhiều data cùng lúc
- Bên thứ 3: Không cần

**📊 Độ khó:** ⭐⭐ Trung bình
> Lý do: UI layout khá phức tạp nhưng logic không khó. API cần aggregate nhiều bảng.

**📅 Ước tính:** 4 ngày

**🔗 Phải làm sau:** UC-03, UC-08, UC-04

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

### 🔷 UC-19: Nhận Thông Báo Real-Time

**📌 Mô tả bằng ngôn ngữ thường:**
Gia đình nhận thông báo ngay lập tức khi: bố/mẹ bỏ lỡ liều thuốc, AI phát hiện chỉ số bất thường, SOS được bấm, hoặc sắp đến lịch khám. Bấm vào thông báo → mở thẳng màn hình liên quan. Có thể gọi điện cho bố/mẹ ngay từ màn hình thông báo.

**👤 Ai sử dụng:** Family

**🔄 Luồng sử dụng:**
```
Sự kiện xảy ra → Hệ thống gửi Push Notification đến điện thoại Family
→ Family mở thông báo → Vào màn hình chi tiết tương ứng
→ (Tùy chọn) Bấm nút gọi điện cho Elderly
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Notification handler, deep link navigation (mở đúng màn hình từ notification), `url_launcher` để gọi điện
- Backend: FCM integration trong tất cả các event (UC-05, UC-10, UC-13, UC-20)
- Bên thứ 3: **FCM** (Firebase Cloud Messaging)

**📊 Độ khó:** ⭐⭐⭐ Khó
> Lý do: Cần setup FCM đúng cách trên cả Android + iOS. Deep link navigation phức tạp. iOS có nhiều restriction về background notifications.

**📅 Ước tính:** 5 ngày (setup FCM + tất cả notification types)

**🔗 Phải làm sau:** UC-04, UC-08, UC-13

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have

---

### 🔷 UC-20: Quản Lý Lịch Khám Bệnh

**📌 Mô tả bằng ngôn ngữ thường:**
Thành viên gia đình tạo lịch khám bệnh cho bố/mẹ: tên bệnh viện/bác sĩ, ngày giờ, chuyên khoa, ghi chú. Hệ thống tự nhắc cả gia đình và người cao tuổi trước 1 ngày và trước 2 tiếng. Sau buổi khám, có thể ghi lại kết quả.

**👤 Ai sử dụng:** Family

**🔄 Luồng sử dụng:**
```
Vào "Lịch hẹn" → "Thêm lịch khám" → Nhập thông tin
→ Lưu → Nhắc nhở tự động được tạo
→ Sau khám: Đánh dấu "Đã khám" + Ghi kết quả
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Form tạo lịch hẹn, calendar view, màn hình kết quả khám
- Backend: API `/appointments` (CRUD) | Bảng `appointments` | Reminder scheduler (1 ngày trước, 2 giờ trước)
- Bên thứ 3: **FCM** (nhắc nhở)

**📊 Độ khó:** ⭐⭐ Trung bình

**📅 Ước tính:** 4 ngày

**🔗 Phải làm sau:** UC-03

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🟡 Should have

---

### 🔷 UC-21: Theo Dõi Nhiều Hồ Sơ Elderly

**📌 Mô tả bằng ngôn ngữ thường:**
Người dùng Premium có thể kết nối và theo dõi nhiều người thân cùng lúc (ví dụ vừa theo dõi bố vừa theo dõi mẹ). Trang chủ hiển thị danh sách tất cả hồ sơ với màu trạng thái (xanh = ổn, vàng = cần chú ý, đỏ = khẩn cấp).

**👤 Ai sử dụng:** Family (Premium)

**⚙️ Kỹ thuật cần làm:**
- Flutter: Multi-profile switcher UI trên dashboard
- Backend: Logic cho phép nhiều `family_links` per Family account
- Bên thứ 3: Không cần

**📊 Độ khó:** ⭐⭐ Trung bình

**📅 Ước tính:** 4 ngày

**🔗 Phải làm sau:** UC-03, UC-18, UC-24

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** ⚪ Phase 2 (Premium feature)

---

## MODULE 7: SETTINGS & PROFILE

---

### 🔷 UC-22: Hồ Sơ Sức Khỏe Người Cao Tuổi

**📌 Mô tả bằng ngôn ngữ thường:**
Vào "Hồ sơ" → "Thông tin sức khỏe", điền các thông tin nền: mắc bệnh mãn tính gì (tiểu đường, cao huyết áp...), dị ứng thuốc, nhóm máu, chiều cao, cân nặng. AI sẽ dùng thông tin này để đặt ngưỡng cảnh báo phù hợp với từng người (không dùng ngưỡng chung cho tất cả).

**👤 Ai sử dụng:** Family & Elderly

**🔄 Luồng sử dụng:**
```
Vào "Hồ sơ" → "Thông tin sức khỏe" → Điền/cập nhật thông tin
→ Lưu → AI cập nhật ngưỡng cảnh báo cá nhân hóa
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Form với các trường: checkbox bệnh mãn tính, chip selection dị ứng, text input
- Backend: API `/elderly-profiles` (PUT) | Bảng `elderly_profiles`
- Bên thứ 3: Không cần

**📊 Độ khó:** ⭐ Dễ

**📅 Ước tính:** 2 ngày

**🔗 Phải làm sau:** UC-01

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🔴 Must have (cần làm sớm vì UC-10 phụ thuộc vào đây)

---

### 🔷 UC-23: Cài Đặt Thông Báo

**📌 Mô tả bằng ngôn ngữ thường:**
Vào "Cài đặt" → "Thông báo". Bật/tắt từng loại thông báo: nhắc thuốc, cảnh báo sức khỏe, SOS, báo cáo tuần. Chọn kênh nhận (Push, Zalo, SMS). Đặt giờ "Không làm phiền" (ví dụ 22:00–7:00 — nhưng SOS luôn vượt qua giới hạn này).

**👤 Ai sử dụng:** Family & Elderly

**🔄 Luồng sử dụng:**
```
Vào "Cài đặt" → "Thông báo" → Toggle bật/tắt từng loại
→ Chọn kênh nhận → Đặt giờ Không làm phiền → Lưu
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Settings screen với Toggle switches, time range picker
- Backend: API `/notification-settings` | Bảng `notification_preferences`
- Bên thứ 3: Không cần

**📊 Độ khó:** ⭐ Dễ

**📅 Ước tính:** 2 ngày

**🔗 Phải làm sau:** UC-01

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** 🟡 Should have

---

### 🔷 UC-24: Nâng Cấp Premium (Thanh Toán)

**📌 Mô tả bằng ngôn ngữ thường:**
Vào "Cài đặt" → "Gói dịch vụ". So sánh Free vs Premium. Chọn thanh toán tháng hoặc năm. Thanh toán qua VNPay hoặc MoMo. Sau khi thanh toán thành công, các tính năng Premium mở khóa ngay lập tức.

**👤 Ai sử dụng:** Family

**🔄 Luồng sử dụng:**
```
Vào "Gói dịch vụ" → Xem so sánh Free/Premium
→ Chọn chu kỳ (tháng/năm) → Chọn VNPay hoặc MoMo
→ Thanh toán → Premium kích hoạt ngay
```

**⚙️ Kỹ thuật cần làm:**
- Flutter: Paywall screen, WebView cho VNPay/MoMo, success screen
- Backend: Payment webhook từ VNPay/MoMo | Bảng `subscriptions`
- Bên thứ 3: **VNPay** hoặc **MoMo** (cần đăng ký merchant account)

**📊 Độ khó:** ⭐⭐⭐⭐ Rất khó
> Lý do: Cần đăng ký tài khoản merchant VNPay/MoMo (mất 1–2 tuần duyệt). Xử lý webhook thanh toán cần bảo mật cao. Nhiều edge case (timeout, trùng lệnh, hoàn tiền).

**📅 Ước tính:** 8–10 ngày

**🔗 Phải làm sau:** UC-21, UC-12

**🚦 Trạng thái:** `[ ] Chưa bắt đầu`

**🎯 Ưu tiên EXE2:** ⚪ Phase 2 (cần merchant account thật, không làm đầu tiên)

---

# PHẦN 3 — KẾ HOẠCH THỰC HIỆN

## Bảng Tổng Hợp Tất Cả Use Cases

| UC | Tên | Độ khó | Thời gian | Ưu tiên | Trạng thái |
|----|-----|--------|-----------|---------|-----------|
| UC-01 | Đăng ký tài khoản | ⭐⭐⭐ | 4–5 ngày | 🔴 Must | [ ] |
| UC-02 | Đăng nhập (PIN/Biometrics) | ⭐⭐ | 3 ngày | 🔴 Must | [ ] |
| UC-03 | Link Elderly ↔ Family | ⭐⭐ | 3 ngày | 🔴 Must | [ ] |
| UC-04 | Thêm lịch uống thuốc | ⭐⭐ | 4 ngày | 🔴 Must | [ ] |
| UC-05 | Nhắc thuốc + xác nhận | ⭐⭐⭐ | 5 ngày | 🔴 Must | [ ] |
| UC-06 | Lịch sử uống thuốc | ⭐⭐ | 3 ngày | 🟡 Should | [ ] |
| UC-07 | Sửa/xóa lịch thuốc | ⭐ | 2 ngày | 🔴 Must | [ ] |
| UC-08 | Nhập chỉ số sức khỏe | ⭐⭐ | 4 ngày | 🔴 Must | [ ] |
| UC-09 | Sync Google Fit | ⭐⭐⭐⭐ | 12–14 ngày | ⚪ Phase 2 | [ ] |
| UC-10 | AI phát hiện bất thường | ⭐⭐⭐ | 5–6 ngày | 🔴 Must | [ ] |
| UC-11 | Báo cáo sức khỏe (chart) | ⭐⭐ | 4 ngày | 🟡 Should | [ ] |
| UC-12 | AI Weekly Summary | ⭐⭐⭐ | 5 ngày | ⚪ Phase 2 | [ ] |
| UC-13 | Nút SOS khẩn cấp | ⭐⭐⭐ | 5–6 ngày | 🔴 Must | [ ] |
| UC-14 | Lịch sử SOS | ⭐ | 2 ngày | 🟡 Should | [ ] |
| UC-15 | Chat với AI Companion | ⭐⭐⭐ | 6–7 ngày | 🔴 Must | [ ] |
| UC-16 | Voice Input (STT) | ⭐⭐ | 3 ngày | ⚪ Phase 2 | [ ] |
| UC-17 | AI nhắc qua Chat | ⭐⭐ | 3 ngày | ⚪ Phase 2 | [ ] |
| UC-18 | Family Dashboard tổng quan | ⭐⭐ | 4 ngày | 🔴 Must | [ ] |
| UC-19 | Thông báo real-time | ⭐⭐⭐ | 5 ngày | 🔴 Must | [ ] |
| UC-20 | Lịch khám bệnh | ⭐⭐ | 4 ngày | 🟡 Should | [ ] |
| UC-21 | Nhiều hồ sơ Elderly | ⭐⭐ | 4 ngày | ⚪ Phase 2 | [ ] |
| UC-22 | Hồ sơ sức khỏe Elderly | ⭐ | 2 ngày | 🔴 Must | [ ] |
| UC-23 | Cài đặt thông báo | ⭐ | 2 ngày | 🟡 Should | [ ] |
| UC-24 | Nâng cấp Premium | ⭐⭐⭐⭐ | 8–10 ngày | ⚪ Phase 2 | [ ] |

**Tổng MVP (Must + Should):** ~17 UC ≈ **67–72 ngày dev** (1 người làm)

---

## Thứ Tự Implement Đề Xuất

```
TUẦN 1–2: NỀN TẢNG
├── Setup dependencies (pubspec.yaml, Firebase, tất cả packages)
├── Setup Riverpod + routing (go_router)
├── Data models + HTTP client
└── UC-01 + UC-02 (Auth — cổng vào mọi thứ)

TUẦN 3–4: CORE FLOW
├── UC-03 (Link Elderly ↔ Family)
├── UC-22 (Hồ sơ sức khỏe — cần trước khi làm AI)
├── UC-08 (Nhập chỉ số sức khỏe)
└── UC-18 (Family Dashboard — khung chính)

TUẦN 5–6: MEDICATION MODULE
├── UC-04 (Thêm lịch thuốc)
├── UC-05 (Nhắc + xác nhận)
├── UC-07 (Sửa/xóa)
└── UC-19 (Notification setup — FCM)

TUẦN 7–8: AI + HEALTH
├── UC-10 (AI anomaly detection)
├── UC-15 (AI Chatbot)
├── UC-11 (Health chart)
└── UC-06 (Lịch sử thuốc)

TUẦN 9–10: EMERGENCY + POLISH
├── UC-13 (SOS button)
├── UC-14 (Lịch sử SOS)
├── UC-20 (Lịch khám)
└── UC-23 (Cài đặt thông báo)

TUẦN 11+: PHASE 2 (sau khi có user)
└── UC-09, UC-12, UC-16, UC-17, UC-21, UC-24
```

---

## Phân Công 3 Dev

> Giả định: 3 dev làm song song, ưu tiên tránh conflict code.

### 👨‍💻 Dev 1 — Mobile Lead (Flutter Focus)
**Chuyên trách:** Tất cả màn hình Elderly, AI Chatbot, UX/UI

| Tuần | Công việc |
|------|-----------|
| 1–2 | Setup project, pubspec, app skeleton, routing |
| 3–4 | UC-01, UC-02 (Auth screens) |
| 5–6 | UC-08 (Health metrics UI), UC-22 (Profile form) |
| 7–8 | UC-15 (AI Chatbot UI + Gemini integration) |
| 9–10 | UC-13 (SOS button), UC-16 (Voice input) |

### 👨‍💻 Dev 2 — Flutter Family Side
**Chuyên trách:** Tất cả màn hình Family, Dashboard, Notifications

| Tuần | Công việc |
|------|-----------|
| 1–2 | Data models, Riverpod providers, HTTP client base |
| 3–4 | UC-03 (Link flow), UC-18 (Family Dashboard) |
| 5–6 | UC-04, UC-07 (Medication CRUD) |
| 7–8 | UC-06, UC-11 (History & Charts — fl_chart) |
| 9–10 | UC-20 (Appointments), UC-23 (Settings), UC-14 (SOS history) |

### 👨‍💻 Dev 3 — Backend Lead (Spring Boot)
**Chuyên trách:** Toàn bộ Backend API, Database, Scheduler, AI integration

| Tuần | Công việc |
|------|-----------|
| 1–2 | Spring Boot setup, DB schema, Auth API (UC-01, UC-02) |
| 3–4 | Family Link API (UC-03), Health Metrics API (UC-08) |
| 5–6 | Medication API + Scheduler (UC-04, UC-05), FCM setup (UC-19) |
| 7–8 | Gemini AI integration (UC-10, UC-15), Health Report API (UC-11) |
| 9–10 | SOS API + multi-channel notification (UC-13), Appointments (UC-20) |

---

## Timeline Tổng Thể (3 Dev Song Song)

```
Tuần 1–2   ████████  Setup + Auth (UC-01, UC-02)
Tuần 3–4   ████████  Core linking + Health + Dashboard (UC-03, UC-08, UC-18, UC-22)
Tuần 5–6   ████████  Medication full + Notifications (UC-04, UC-05, UC-07, UC-19)
Tuần 7–8   ████████  AI features + Charts (UC-10, UC-15, UC-06, UC-11)
Tuần 9–10  ████████  Emergency + Polish (UC-13, UC-14, UC-20, UC-23)
Tuần 11+   ░░░░░░░░  Phase 2 features (Premium, Google Fit, Voice...)
```

**Ước tính MVP hoàn chỉnh: 10 tuần với 3 dev song song**

---

# PHẦN 4 — RỦI RO & LƯU Ý

## ⚠️ Những tính năng dễ bị underestimate thời gian

| Tính năng | Tưởng mất | Thực tế | Lý do |
|-----------|-----------|---------|-------|
| UC-01 Đăng ký OTP | 1–2 ngày | 4–5 ngày | Firebase Auth setup + Zalo OTP + test trên thiết bị thật |
| UC-05 Nhắc thuốc | 2–3 ngày | 5–6 ngày | Backend scheduler + missed dose alert logic phức tạp |
| UC-19 Notifications | 2 ngày | 5 ngày | FCM cần test trên cả Android + iOS, deep link navigation |
| UC-13 SOS button | 2 ngày | 5–6 ngày | GPS permission + multi-channel (Push + Zalo + SMS) |
| UC-15 AI Chatbot | 3 ngày | 6–7 ngày | Prompt engineering để AI "hiểu" dữ liệu sức khỏe của từng người |
| UC-24 Payment | 3 ngày | 8–10 ngày | Merchant account approval + webhook security + edge cases |

---

## 🔴 Điểm kỹ thuật cần cẩn thận

### 1. Firebase Authentication (UC-01, UC-02)
- iOS cần APN certificate để gửi OTP SMS — yêu cầu Apple Developer Account ($99/năm)
- Test OTP trên thiết bị thật, không test được trên emulator đầy đủ
- Zalo OTP cần đăng ký Zalo OA (Official Account) trước

### 2. Push Notifications (UC-05, UC-10, UC-13, UC-19)
- iOS yêu cầu signed provisioning profile để test FCM
- Background notification trên iOS bị giới hạn bởi Apple — SOS có thể không hiển thị nếu app bị kill
- Cần test trên thiết bị thật của cả Android và iOS

### 3. Gemini AI Integration (UC-10, UC-15)
- Free tier có rate limit — khi nhiều user cùng lúc có thể bị throttle
- Prompt phải được thiết kế cẩn thận để AI không đưa ra lời khuyên y tế sai (disclaimer cần thiết)
- Mỗi lần gọi AI tốn tiền — cần tối ưu (không gọi AI với mọi thao tác nhỏ)

### 4. GPS & Location (UC-13 SOS)
- Android 10+ cần `ACCESS_BACKGROUND_LOCATION` permission — user phải cấp thủ công
- iOS cần `NSLocationWhenInUseUsageDescription` trong Info.plist
- GPS không chính xác khi ở trong nhà (tầng hầm, bệnh viện)

### 5. Payment Integration (UC-24)
- **Bắt đầu đăng ký VNPay/MoMo merchant NGAY** nếu muốn có cho EXE2 — quá trình duyệt mất 2–4 tuần
- Webhook phải dùng HTTPS — cần domain thật, không dùng `localhost`
- Không bao giờ xử lý thanh toán chỉ ở client (Flutter) — luôn verify ở Backend

### 6. Backend Scheduler (UC-05, UC-12, UC-17, UC-20)
- Scheduler phải xử lý đúng timezone (Việt Nam UTC+7)
- Nếu server restart, job không được mất — cần Quartz hoặc database-backed scheduler
- Nhiều user → nhiều scheduled jobs → cần giám sát hiệu năng

---

## 🟡 Những thứ có thể gây chậm tiến độ cả nhóm

### 1. Thiếu Backend API → Flutter bị block
- Dev Flutter phụ thuộc vào Backend API để test tính năng thật
- **Giải pháp:** Dev Backend luôn đi trước 1 sprint; Dev Flutter dùng mock data khi chờ API

### 2. Conflict khi nhiều người cùng sửa một file
- `main.dart`, `app.dart`, `pubspec.yaml` là những file dễ conflict nhất
- **Giải pháp:** Quy ước: mỗi người làm 1 branch riêng theo UC, merge vào `develop` khi xong

### 3. Chưa có Apple Developer Account
- Cần account để test Firebase Auth trên iPhone thật
- **Giải pháp:** Đăng ký sớm hoặc ưu tiên test trên Android trước

### 4. Gemini API có giới hạn free tier
- Khi cả nhóm cùng test AI feature, có thể hit rate limit
- **Giải pháp:** Mỗi dev dùng API key riêng; implement caching câu trả lời AI khi có thể

### 5. Không test trên thiết bị thật đủ sớm
- Notifications, GPS, biometrics KHÔNG hoạt động đúng trên emulator
- **Giải pháp:** Cần ít nhất 1 Android thật và 1 iPhone thật để test từ sprint đầu tiên

---

## ✅ Checklist Trước Khi Bắt Đầu Code

- [ ] Đăng ký Firebase project + bật Phone Auth
- [ ] Đăng ký Zalo OA (để gửi OTP qua Zalo)
- [ ] Tạo Google Cloud project + bật Gemini API
- [ ] Tạo Cloudinary account (lưu ảnh)
- [ ] Chuẩn bị PostgreSQL database trên Render
- [ ] (Nếu cần) Bắt đầu đăng ký VNPay/MoMo merchant
- [ ] Team thống nhất branching strategy (Git flow)
- [ ] Cập nhật pubspec.yaml với tất cả packages cần thiết
- [ ] Setup Flutter project: Riverpod + go_router + HTTP client

---

> 📝 **Tài liệu này được tạo dựa trên Use Case Specification V0.1 (26/06/2026) và phân tích source code hiện tại của CareNest Mobile.**
> 
> **Cập nhật lần cuối:** 09/06/2026
