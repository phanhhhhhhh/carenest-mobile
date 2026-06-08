# CareNest — Tech Stack (Reviewed)

> **Dự án:** CareNest — Ứng dụng chăm sóc sức khỏe người cao tuổi  
> **Nhóm:** Vela | **Môn:** EXE101 — FPT University  
> **Phiên bản:** 2.0 (reviewed 08/06/2026) | Cập nhật sau phân tích tech stack

---

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                        NGƯỜI DÙNG                           │
│           Elderly (60+)             Family (25–45)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                MOBILE APP (Flutter + Dart)                  │
│        Android APK — cross-platform, một codebase          │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────┐      ┌────────────────────────────────┐
│  Firebase Suite     │      │     REST API (Spring Boot)     │
│  ├─ Auth (OTP SMS)  │      │     Deploy trên Render         │
│  └─ FCM (Push Noti) │      └────────────┬───────────────────┘
└─────────────────────┘                   │
                                          ▼
                    ┌─────────────────────────────────────┐
                    │         PostgreSQL (Render)          │
                    │         Database chính              │
                    └──────┬──────────────┬───────────────┘
                           │              │
                           ▼              ▼
                  ┌──────────────┐  ┌──────────────┐
                  │ Gemini 1.5   │  │  Cloudinary  │
                  │ Flash (AI)   │  │  (Storage)   │
                  └──────────────┘  └──────────────┘
```

**Thay đổi so với v1.0:**
- ✅ Firebase Auth thêm vào → thay Zalo OA làm **primary OTP**
- ⚠️ Zalo OA → hạ xuống Phase 2 (rào cản đăng ký doanh nghiệp)
- ❌ Google Fit Sync → defer sang Phase 2 (manual log thay thế)
- ❌ VNPay/MoMo → defer sang Phase 2 (mockup UI cho EXE2)

---

## 1. Flutter + Dart — Mobile Frontend

**Verdict: ✅ Giữ nguyên**

### Tại sao chọn
Team 3 devs cần build app chạy cả Android và iOS. Native Android mất gấp đôi code. Native iOS đòi Mac + Xcode + Apple Developer account. Flutter cho phép **một codebase** compile ra cả hai nền tảng, team lead đã có kinh nghiệm dẫn dắt.

### Ưu điểm

| Ưu điểm | Áp dụng vào CareNest |
|---|---|
| Cross-platform thật sự | Android APK (chính) + iOS sau — cùng logic, cùng UI |
| Hot reload | Dev nhanh — quan trọng với team nhỏ deadline gấp EXE2 |
| UI tùy biến cao | Font lớn, nút to, contrast cao cho elderly 60+ |
| Dart null-safe | Ít bug runtime — critical khi xử lý data sức khỏe |
| Ecosystem phong phú | `firebase_messaging`, `speech_to_text`, `geolocator`, `flutter_local_notifications` |

### State Management: Riverpod
Compile-time safe, không cần `BuildContext` để đọc state, tự handle dependency injection. Phù hợp hơn Bloc (ít boilerplate) cho team đang học Flutter trong khi làm EXE2.

### Cấu trúc thư mục
```
lib/
├── main.dart              # Entry point, ProviderScope wrapper
├── app.dart               # MaterialApp + routing
├── core/
│   ├── constants/         # Colors, strings, dimensions
│   └── theme/             # AppTheme — font size lớn cho elderly
├── data/
│   ├── models/            # Data classes (JSON serializable)
│   ├── repositories/      # Giao tiếp với API
│   └── datasources/       # HTTP client, local storage
├── presentation/
│   ├── screens/           # UI screens
│   └── widgets/           # Reusable components
└── providers/             # Riverpod providers
```

### Rủi ro cần chú ý
- 2 devs còn lại mới với Flutter → dành 2-3 tuần đầu EXE2 để on-board

---

## 2. Spring Boot 3.2 + Java 21 — Backend API

**Verdict: ✅ Giữ nguyên**

### Tại sao chọn
Team có nền Java từ PRO192, PRO202. Spring Boot là framework Java phổ biến nhất tại Việt Nam. Java 21 Virtual Threads xử lý concurrent requests hiệu quả hơn thread pool truyền thống mà không cần reactive programming phức tạp.

### Ưu điểm

| Ưu điểm | Áp dụng vào CareNest |
|---|---|
| Team đã biết Java | Không mất thời gian học framework từ đầu |
| Spring Security | JWT + role-based auth (Elderly / Family / Admin) out-of-the-box |
| Spring Data JPA | ORM tự động — không viết SQL cho CRUD cơ bản |
| `@Scheduled` | Nhắc thuốc theo giờ, anomaly detection cron — 10 dòng code |
| OpenAPI/Swagger | Auto-generate API docs — team Flutter không cần hỏi backend |
| Actuator | Health check endpoint `/actuator/health` cho Uptime Robot ping |

### Cách vận hành
```
REST Controllers (API Layer)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Spring Data JPA)
    ↓
PostgreSQL Database
```

**Luồng nhắc thuốc:**
```
@Scheduled (mỗi phút)
→ Query medications WHERE next_dose_time <= NOW()
→ Tìm thấy → Firebase Admin SDK gửi FCM
→ Elderly nhận push notification
→ Xác nhận uống → POST /api/medication-logs
→ Cập nhật next_dose_time
```

### Rủi ro cần chú ý
- Spring Boot JAR ~60-80MB → Render free khởi động lần đầu mất 60-90s
- **Fix:** Thêm `spring.main.lazy-initialization=true` vào `application.properties`
- RAM Render free 512MB — Spring Boot dùng ~300-400MB → sát mức, cần monitor

---

## 3. PostgreSQL — Database

**Verdict: ✅ Giữ nguyên | ⚠️ Cần upgrade trước 90 ngày**

### Tại sao chọn
Data sức khỏe có schema rõ ràng (chỉ số, thuốc, lịch hẹn) — SQL phù hợp hơn NoSQL. PostgreSQL là RDBMS mạnh nhất trong free tier: Render cung cấp miễn phí 1GB.

### Ưu điểm

| Ưu điểm | Áp dụng vào CareNest |
|---|---|
| ACID transactions | Medication log không bao giờ bị duplicate khi network lỗi |
| JSON column | Lưu notification preferences linh hoạt, không cần alter table |
| Indexing mạnh | Query lịch sử sức khỏe theo date range nhanh |
| JPA tự map | Không cần migration tay cho CRUD cơ bản |
| 1GB free | Với 500 users + health data ~30 ngày: ước tính dùng 100-300MB |

### Schema chính
```sql
Users (id, role, phone, name, dob, fcm_token)
ElderlyProfiles (user_id, health_conditions, emergency_contacts)
FamilyLinks (elderly_id, family_id, relationship)
Medications (id, elderly_id, name, dosage, schedule, next_dose_time)
MedicationLogs (medication_id, taken_at, status, notes)
HealthMetrics (elderly_id, type, value, unit, recorded_at)
Appointments (elderly_id, doctor, datetime, location, notes)
```

### ⚠️ Rủi ro quan trọng nhất
Render PostgreSQL **free tier expire sau 90 ngày** — toàn bộ data bị xóa nếu không upgrade.

**Hành động bắt buộc:** Set calendar reminder 80 ngày sau ngày tạo DB để upgrade lên $7/tháng.

---

## 4. Firebase Auth — Xác thực OTP (THAY THẾ Zalo OA)

**Verdict: ✅ Thêm vào stack | Thay Zalo OA làm primary auth**

### Tại sao chọn (và tại sao thay Zalo OA)
Zalo OA yêu cầu **đăng ký như doanh nghiệp** (mã số thuế hoặc giấy phép kinh doanh) — nhóm sinh viên không có tư cách pháp nhân này, quá trình duyệt 3-7 ngày và có thể bị từ chối. Firebase Auth Phone chỉ cần tạo Firebase project là dùng được.

Thêm vào đó, nhóm đã dùng Firebase (FCM) — cùng FlutterFire SDK, không cần thêm dependency mới.

### Ưu điểm

| Ưu điểm | Áp dụng vào CareNest |
|---|---|
| Không cần đăng ký doanh nghiệp | Sinh viên dùng được ngay, không chờ approval |
| Free 10.000 SMS OTP/tháng | Với 500 users đăng ký 1-2 lần = ~1.000 SMS = $0 |
| Cùng FlutterFire SDK | Đã có Firebase → thêm `firebase_auth` package là xong |
| Google infrastructure | Độ tin cậy cao, delivery rate tốt |
| Tự handle OTP lifecycle | Tự generate, expire, verify — không cần code backend |

### Cách vận hành
```
User nhập số điện thoại
    → Firebase gửi SMS OTP (6 số, TTL 5 phút)
    → User nhập OTP
    → Firebase verify → trả về Firebase UID
    → App gửi Firebase UID lên Spring Boot
    → Spring Boot verify với Firebase Admin SDK
    → Tạo JWT (access + refresh token) nội bộ
    → Mọi request sau đó dùng JWT này
```

### Chi phí
- 0-10.000 OTP/tháng: **Miễn phí**
- Trên 10.000: ~$0.05/SMS (không bao giờ đến mức này ở EXE2)

---

## 5. Firebase Cloud Messaging (FCM) — Push Notification

**Verdict: ✅ Giữ nguyên**

### Tại sao chọn
Tiêu chuẩn industry cho push notification mobile — miễn phí không giới hạn, hoạt động cả Android và iOS, tích hợp sẵn với Flutter.

### Ưu điểm

| Ưu điểm | Áp dụng vào CareNest |
|---|---|
| Miễn phí không giới hạn | Nhắc thuốc hàng ngày cho 500 users = $0 |
| Delivery guaranteed | Queue lại khi device offline, gửi khi online |
| Background notification | App không cần mở — critical với elderly |
| Topic subscription | Broadcast đến tất cả Family của một elderly |

### Cách vận hành
```
Spring Boot (@Scheduled) → Firebase Admin SDK → FCM Server
                                                      ↓
                                             Flutter app (background)
                                             → flutter_local_notifications
                                             → Hiển thị notification
```

---

## 6. Gemini 1.5 Flash — AI Engine

**Verdict: ✅ Giữ nguyên**

### Tại sao chọn
Google cung cấp **Gemini API miễn phí** với quota đủ cho MVP (60 req/phút, 1.500 req/ngày). GPT-4 tính tiền từ request đầu tiên. Gemini 1.5 Flash hỗ trợ tiếng Việt tốt và context window 1M token — đủ để đưa cả lịch sử sức khỏe vào prompt.

### Ưu điểm

| Ưu điểm | Áp dụng vào CareNest |
|---|---|
| Miễn phí | Zero AI cost cho EXE2 |
| Tiếng Việt tốt | Chatbot nói chuyện tự nhiên với elderly |
| Context 1M token | Đưa 30 ngày lịch sử sức khỏe vào prompt |
| Function calling | AI gọi API lấy data thật (UC-12 anomaly detection) |
| Multimodal | Tương lai: chụp ảnh hộp thuốc → AI nhận diện |

### Cách vận hành

**UC-15 to UC-17: AI Chatbot**
```
Elderly nói/gõ → [speech_to_text nếu voice] → Spring Boot
    → System prompt: profile elderly + lịch sử 7 ngày
    → Gemini API → Response
    → App hiển thị [+ flutter_tts nếu cần đọc]
```

**UC-12: Anomaly Detection**
```
Cron hàng ngày → Lấy metrics 7 ngày → Gemini analyze
→ Phát hiện bất thường → FCM alert đến Family
```

**System prompt mẫu:**
```
Bạn là trợ lý sức khỏe của người cao tuổi tên [Tên].
Profile: [tuổi], bệnh nền: [danh sách], thuốc đang dùng: [danh sách].
QUAN TRỌNG: Bạn không phải bác sĩ. Mọi thông tin chỉ mang tính tham khảo.
Trả lời bằng tiếng Việt, câu ngắn, dễ hiểu cho người 60+.
Lịch sử 7 ngày: [metrics].
```

### Rủi ro cần chú ý
- 60 req/phút: nếu nhiều user chat cùng lúc → implement simple queue hoặc rate limiting ở Spring Boot
- **Bắt buộc:** Thêm disclaimer y tế vào system prompt

---

## 7. Cloudinary — File Storage

**Verdict: ✅ Giữ nguyên**

### Tại sao chọn
Cần lưu ảnh đại diện, hình ảnh thuốc, tài liệu y tế. Lưu trực tiếp vào PostgreSQL blob làm DB phình to. AWS S3 tính tiền. Cloudinary free tier 25GB đủ cho MVP.

### Ưu điểm

| Ưu điểm | Áp dụng vào CareNest |
|---|---|
| Free 25GB | ~50.000 ảnh 500KB mỗi ảnh |
| Auto-optimize | Tự compress, convert WebP → app load nhanh |
| CDN toàn cầu | Ảnh serve từ edge server gần user |
| Upload từ client | Flutter upload thẳng → không tốn bandwidth Render |

### Cách vận hành
```
Flutter → Upload ảnh thẳng lên Cloudinary (upload preset)
              ↓
         Cloudinary trả URL
              ↓
         App gửi URL lên Spring Boot → lưu PostgreSQL
```

---

## 8. Render — Deploy Backend + Database

**Verdict: ✅ Giữ nguyên | ⚠️ PostgreSQL cần upgrade trước 90 ngày**

### Tại sao chọn
PaaS duy nhất cung cấp free tier thật sự cho cả Web Service lẫn PostgreSQL. Heroku xóa free tier 2022. Railway tính tiền sau $5/tháng. Render phù hợp nhất cho EXE2 zero budget.

### Ưu điểm

| Ưu điểm | Áp dụng vào CareNest |
|---|---|
| Free Web Service + PostgreSQL | $0 cho EXE2 demo |
| Auto-deploy từ GitHub | Push code → tự build → tự deploy |
| Health check | Tự restart nếu service crash |
| Đủ cho 100-500 users | Scale target EXE2 — không cần thay infra |

### Hạn chế và cách xử lý
- Cold start 60-90s sau 15 phút idle → **Uptime Robot** ping mỗi 10 phút
- RAM 512MB sát mức → monitor + bật `lazy-initialization`
- PostgreSQL free expire 90 ngày → **set reminder upgrade**

---

## 9. Uptime Robot — Monitoring

**Verdict: ✅ Giữ nguyên**

### Tại sao chọn
Mitigates Render cold start problem hoàn toàn. Miễn phí, ping mỗi 5 phút, nhận email/Telegram khi server down.

### Cách vận hành
```
Uptime Robot → GET /actuator/health (mỗi 10 phút)
    ↓ OK         → Server tiếp tục awake
    ↓ Timeout    → Email + Telegram alert
```

---

## 10. Zalo OA — Messaging (PHASE 2, không phải MVP)

**Verdict: ⚠️ Defer sang Phase 2**

### Tại sao defer
Đăng ký Zalo OA yêu cầu **doanh nghiệp có mã số thuế** hoặc giấy phép kinh doanh. Nhóm sinh viên không có tư cách pháp nhân này. Quá trình duyệt 3-7 ngày và có thể bị từ chối.

**Firebase Auth** (SMS OTP) thay thế hoàn toàn cho auth. **FCM** thay thế cho emergency alert.

### Kế hoạch Phase 2
Nếu nhóm tìm được đối tác hoặc mentor hỗ trợ đăng ký OA:
- Zalo OA làm kênh alert thứ 2 (elderly nhận thông báo trong Zalo quen thuộc)
- ZNS template cho nhắc thuốc (đẹp hơn SMS)
- Emergency alert qua Zalo message

---

## Tính năng Defer sang Phase 2

### Google Fit / Health Connect Sync (UC-10) — ❌ Defer

**Lý do defer:**
- Elderly 60+ VN ít dùng smartwatch hoặc fitness app → data không có để sync
- Android Health Connect API cần setup thêm, manual log đơn giản hơn nhiều
- Elderly thích kiểm soát dữ liệu tự nhập hơn sync tự động

**Thay thế trong MVP:** Form nhập tay cho metrics (huyết áp, nhịp tim, cân nặng, đường huyết). Tiết kiệm ~2 tuần dev time.

---

### VNPay / MoMo Payment (UC-24) — ❌ Defer

**Lý do defer:**
- Merchant account registration cần doanh nghiệp + giấy tờ + 1-2 tuần approval
- EXE2 chỉ cần demonstrate business model concept, không cần thanh toán thật

**Thay thế trong MVP:** UI Premium plan đầy đủ (đẹp, rõ pricing) nhưng nút payment → "Liên hệ admin để nâng cấp". Giảng viên vẫn thấy business model rõ ràng. Tiết kiệm ~3 tuần dev time + tránh rủi ro registration.

---

## Tổng quan chi phí

| Công nghệ | Chi phí EXE2 | Ghi chú |
|---|---|---|
| Flutter | Miễn phí | — |
| Spring Boot / Java | Miễn phí | — |
| Render Web Service | Miễn phí | 750h/tháng |
| Render PostgreSQL | **$7/tháng** sau 90 ngày | Upgrade bắt buộc trước khi có real users |
| Firebase Auth | Miễn phí | Free 10K SMS OTP/tháng |
| Firebase FCM | Miễn phí | Không giới hạn |
| Gemini 1.5 Flash | Miễn phí | 1.500 req/ngày |
| Cloudinary | Miễn phí | 25GB storage |
| Uptime Robot | Miễn phí | 50 monitors |
| Zalo OA | Phase 2 | — |
| **Tổng EXE2 demo** | **~$0/tháng** | |
| **Tổng khi real users** | **~$7/tháng** | Chỉ PostgreSQL paid |

---

## Scaling Roadmap

```
EXE2 Demo (100–500 users)
Stack hiện tại → Render free + PostgreSQL $7 → Đủ hoàn toàn

Post-EXE (1.000–5.000 users)
Thêm Redis cache ($10/tháng) → Cache medication schedules
Render paid ($25/tháng) → 2GB RAM, không cold start

Growth (10.000+ users)
Tách Notification microservice
Horizontal scaling (2-3 Spring Boot instances)
PostgreSQL read replica cho Family Dashboard
```

---

## Luồng vận hành tổng thể — Nhắc uống thuốc

```
1. Family setup thuốc → Flutter POST /api/medications
                     → Spring Boot lưu PostgreSQL

2. Đến giờ uống thuốc
   → @Scheduled mỗi phút query medications WHERE next_dose_time <= NOW()
   → Tìm thấy → Firebase Admin SDK

3. FCM push notification đến điện thoại Elderly
   → "Đến giờ uống thuốc: Metformin 500mg — 1 viên"

4. Elderly xác nhận → Flutter POST /api/medication-logs
                    → Spring Boot lưu log, cập nhật next_dose_time

5. Family xem lịch sử → GET /api/medication-logs?elderly_id=X&date=today
                      → Family Dashboard
```

---

## Lý do chọn stack này cho EXE101

1. **Zero cost** — toàn bộ stack chạy miễn phí, chỉ PostgreSQL $7/tháng khi có real users
2. **Team skill match** — Java/Spring Boot team đã biết; Firebase là ecosystem quen thuộc
3. **No registration blocker** — Firebase Auth thay Zalo OA giải quyết rào cản doanh nghiệp
4. **Scalable khi cần** — upgrade Render plan là scale ngay, không cần đổi stack
5. **Vietnamese market fit** — Gemini tiếng Việt tốt, FCM notification reliable
6. **Cross-platform** — Flutter một codebase ra Android, iOS sau khi có budget
