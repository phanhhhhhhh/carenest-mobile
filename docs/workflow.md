# CareNest — Quy trình làm việc nhóm

> **Nhóm Vela | EXE101 — FPT University**  
> Áp dụng cho tất cả thành viên từ ngày đầu tiên.

---

## Mục lục

1. [Quy trình hàng ngày](#1-quy-trình-hàng-ngày)
2. [Quy trình Git](#2-quy-trình-git)
3. [Quy tắc đặt tên — Git](#3-quy-tắc-đặt-tên--git)
4. [Quy tắc đặt tên — Flutter](#4-quy-tắc-đặt-tên--flutter)
5. [Quy tắc đặt tên — Spring Boot](#5-quy-tắc-đặt-tên--spring-boot)
6. [Quy tắc đặt tên — Database](#6-quy-tắc-đặt-tên--database)
7. [Quy tắc API Endpoint](#7-quy-tắc-api-endpoint)
8. [Checklist trước khi push](#8-checklist-trước-khi-push)

---

## 1. Quy trình hàng ngày

### Buổi sáng — trước khi code (5 phút)

```
1. git checkout develop
2. git pull origin develop        ← luôn pull trước khi làm
3. git checkout <branch của mình>
4. git merge develop              ← cập nhật branch của mình với develop mới nhất
5. Xem task đang làm hôm nay
```

> **Lý do:** Tránh conflict lớn cuối ngày. Pull sớm, merge thường xuyên.

---

### Trong ngày — khi code

- Commit **nhỏ và thường xuyên** — mỗi khi xong 1 việc nhỏ, commit ngay
- Không để cuối ngày mới commit 1 đống
- Mỗi commit chỉ làm **1 việc** (thêm 1 screen, fix 1 bug, thêm 1 API)
- Nếu bị block → báo nhóm ngay, không ngồi im >30 phút

---

### Cuối ngày — trước khi tắt máy (10 phút)

```
1. Commit toàn bộ work đang làm (dù chưa xong — dùng prefix wip:)
2. git push origin <branch của mình>
3. Báo nhóm hôm nay làm được gì / đang bị gì
```

> **Lý do:** Không bao giờ để code chỉ nằm trên máy cá nhân — máy hỏng là mất hết.

---

### Checklist hàng tuần (thứ Hai)

- [ ] Review lại toàn bộ task tuần trước: xong chưa, còn gì dở
- [ ] Merge develop vào branch cá nhân (nếu chưa làm)
- [ ] Xóa branch đã merge xong (dọn dẹp)
- [ ] Kiểm tra Docker đang chạy: `docker ps` → thấy `carenest_db` STATUS `healthy`
- [ ] Nếu Docker không chạy: `docker-compose up -d` (từ thư mục gốc project)
- [ ] Kiểm tra Render backend còn up không: `GET /actuator/health`
- [ ] Kiểm tra PostgreSQL Render còn bao nhiêu ngày trước khi expire

---

## 2. Quy trình Git

### Mô hình branch

```
main          ← production, chỉ merge từ develop khi demo/release
  └── develop ← branch chính của nhóm, luôn phải chạy được
        ├── feature/ten-tinh-nang    ← tính năng mới
        ├── fix/ten-bug              ← fix bug
        └── chore/ten-viec          ← config, docs, refactor
```

### Quy tắc branch

| Branch | Ai tạo | Merge vào đâu | Khi nào xóa |
|--------|--------|---------------|-------------|
| `main` | Trưởng nhóm | — | Không xóa |
| `develop` | Trưởng nhóm | — | Không xóa |
| `feature/*` | Dev | `develop` | Sau khi merge |
| `fix/*` | Dev | `develop` | Sau khi merge |
| `chore/*` | Dev | `develop` | Sau khi merge |

### Quy trình tạo tính năng mới

```bash
# 1. Tạo branch từ develop
git checkout develop
git pull origin develop
git checkout -b feature/medication-reminder

# 2. Code + commit thường xuyên
git add .
git commit -m "feat: add medication reminder screen UI"

# 3. Push lên remote
git push origin feature/medication-reminder

# 4. Tạo Pull Request vào develop trên GitHub
# 5. Báo 1 thành viên khác review
# 6. Merge sau khi được approve
```

### Quy tắc merge

- **Không** tự merge branch của mình — phải có ít nhất 1 người khác xem qua
- **Không** merge trực tiếp vào `main` — chỉ merge từ `develop` vào `main` khi demo
- Resolve conflict trên branch của mình trước, đừng để conflict lên develop

---

## 3. Quy tắc đặt tên — Git

### Branch

Format: `<type>/<mô-tả-ngắn-kebab-case>`

| Type | Dùng khi | Ví dụ |
|------|----------|-------|
| `feature` | Thêm tính năng mới | `feature/medication-reminder` |
| `fix` | Fix bug | `fix/login-otp-not-sending` |
| `chore` | Config, docs, refactor | `chore/update-dependencies` |
| `wip` | Đang làm dở, chưa xong | `wip/health-metric-chart` |

**Quy tắc:**
- Dùng **kebab-case** (chữ thường, nối bằng dấu `-`)
- Không dùng tiếng Việt có dấu
- Ngắn gọn, đủ hiểu — tối đa 5 từ

✅ `feature/sos-emergency-alert`  
❌ `feature/ThemTinhNangSOS`  
❌ `feature/add-the-new-sos-emergency-alert-button-for-elderly`

---

### Commit message

Format: `<type>: <mô tả ngắn>`

| Type | Dùng khi |
|------|----------|
| `feat` | Thêm tính năng mới |
| `fix` | Fix bug |
| `chore` | Config, setup, không ảnh hưởng logic |
| `docs` | Cập nhật tài liệu |
| `refactor` | Sửa code không thay đổi behavior |
| `test` | Thêm/sửa test |
| `wip` | Work in progress — đang làm dở |

**Quy tắc:**
- Dùng **tiếng Anh**, **chữ thường**, **không dấu chấm** cuối câu
- Dòng đầu tối đa **72 ký tự**
- Dùng động từ hiện tại: `add`, `fix`, `remove`, `update` — không phải `added`, `fixed`

✅ `feat: add medication reminder push notification`  
✅ `fix: resolve OTP not sending on iOS`  
✅ `wip: health metric chart (in progress)`  
❌ `update code`  
❌ `Fix bug.`  
❌ `Thêm tính năng nhắc thuốc`

---

## 4. Quy tắc đặt tên — Flutter

### Files

Dùng **snake_case**, đuôi `.dart`

| Loại | Format | Ví dụ |
|------|--------|-------|
| Screen | `<tên>_screen.dart` | `medication_list_screen.dart` |
| Widget | `<tên>_widget.dart` hoặc `<tên>_card.dart` | `medication_card.dart` |
| Model | `<tên>.dart` | `medication.dart` |
| Repository | `<tên>_repository.dart` | `medication_repository.dart` |
| Provider | `<tên>_provider.dart` | `medication_provider.dart` |
| Service | `<tên>_service.dart` | `notification_service.dart` |
| Constant | `<tên>_constants.dart` | `app_colors.dart` |

### Classes

Dùng **PascalCase**

```dart
// ✅
class MedicationListScreen extends StatelessWidget {}
class MedicationCard extends StatelessWidget {}
class MedicationRepository {}
class UserModel {}

// ❌
class medicationListScreen {}
class medication_card {}
```

### Variables và Functions

Dùng **camelCase**

```dart
// ✅
final medicationList = [];
String elderlyName = '';
void fetchMedications() {}
Future<void> submitHealthMetric() async {}

// ❌
final MedicationList = [];
String elderly_name = '';
void FetchMedications() {}
```

### Constants

Dùng **camelCase** (Dart convention, không phải SCREAMING_SNAKE)

```dart
// ✅
const double defaultFontSize = 18.0;
const String apiBaseUrl = 'https://api.carenest.app';

// ❌
const double DEFAULT_FONT_SIZE = 18.0;
```

### Enums

Dùng **PascalCase** cho enum, **camelCase** cho values

```dart
// ✅
enum MedicationStatus { taken, missed, pending }
enum UserRole { elderly, family, admin }

// ❌
enum medicationStatus { Taken, MISSED }
```

### Providers (Riverpod)

```dart
// ✅
final medicationListProvider = StateNotifierProvider<...>(...);
final elderlyProfileProvider = FutureProvider<...>(...);

// ❌
final MedicationListProvider = ...
final medication_list_provider = ...
```

---

## 5. Quy tắc đặt tên — Spring Boot

### Packages

Dùng **lowercase**, không dấu gạch

```
com.carenest.backend.entity
com.carenest.backend.repository
com.carenest.backend.service
com.carenest.backend.controller
com.carenest.backend.dto
com.carenest.backend.config
```

### Classes

| Loại | Format | Ví dụ |
|------|--------|-------|
| Entity | `<Tên>.java` | `Medication.java` |
| Repository | `<Tên>Repository.java` | `MedicationRepository.java` |
| Service (interface) | `<Tên>Service.java` | `MedicationService.java` |
| Service (impl) | `<Tên>ServiceImpl.java` | `MedicationServiceImpl.java` |
| Controller | `<Tên>Controller.java` | `MedicationController.java` |
| DTO request | `<Tên>Request.java` | `CreateMedicationRequest.java` |
| DTO response | `<Tên>Response.java` | `MedicationResponse.java` |
| Enum | `<Tên>.java` (PascalCase) | `MedicationStatus.java` |
| Config | `<Tên>Config.java` | `SecurityConfig.java` |

### Methods

Dùng **camelCase**, bắt đầu bằng động từ

```java
// ✅
public List<Medication> findByElderlyId(Long elderlyId) {}
public void createMedication(CreateMedicationRequest request) {}
public MedicationResponse getMedicationById(Long id) {}
public void deleteMedication(Long id) {}

// ❌
public List<Medication> medication(Long id) {}
public void Medication(CreateMedicationRequest request) {}
```

### Variables và Fields

Dùng **camelCase**

```java
// ✅
private Long elderlyId;
private String fcmToken;
private OffsetDateTime createdAt;

// ❌
private Long elderly_id;
private String FcmToken;
```

### Constants

Dùng **SCREAMING_SNAKE_CASE**

```java
// ✅
public static final String DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
public static final int MAX_RETRY_COUNT = 3;

// ❌
public static final String defaultTimezone = "Asia/Ho_Chi_Minh";
```

---

## 6. Quy tắc đặt tên — Database

### Tables

Dùng **snake_case**, số nhiều

```sql
-- ✅
users
elderly_profiles
family_links
medications
medication_logs
health_metrics
health_metric_thresholds
appointments
emergency_events
otp_verifications
refresh_tokens
notifications
reminders

-- ❌
User
ElderlyProfile
medicationLog
```

### Columns

Dùng **snake_case**

```sql
-- ✅
elderly_id
fcm_token
created_at
updated_at
deleted_at
next_dose_time

-- ❌
elderlyId
FcmToken
CreatedAt
```

### Indexes

Format: `idx_<table>_<column(s)>`

```sql
-- ✅
idx_medications_elderly_id
idx_health_metrics_elderly_recorded
idx_medication_logs_medication_taken

-- ❌
medications_index
idx1
```

### Flyway Migration Files

Format: `V{số}__{mô_tả}.sql` (2 dấu gạch dưới)

```
-- ✅
V1__create_users.sql
V2__create_elderly_profiles.sql
V16__add_appointment_type_column.sql   ← tiếp theo sau V15

-- ❌
V1_create_users.sql          ← thiếu 1 dấu gạch dưới
v1__create_users.sql         ← chữ v thường
V01__create_users.sql        ← không dùng số 0 đầu
```

> **Quy tắc số:** Dùng số nguyên tăng dần — hiện tại đang ở **V15**, migration tiếp theo là **V16**.  
> **KHÔNG bao giờ sửa file migration đã commit** — Flyway kiểm tra checksum, sửa là lỗi ngay.

---

## 7. Quy tắc API Endpoint

### Format chung

```
/api/<resource>
/api/<resource>/{id}
/api/<resource>/{id}/<sub-resource>
```

### Quy tắc

- Dùng **kebab-case**, **số nhiều**, **danh từ** — không dùng động từ
- HTTP method thể hiện hành động, không phải URL

| Method | URL | Ý nghĩa |
|--------|-----|---------|
| `GET` | `/api/medications` | Lấy danh sách |
| `GET` | `/api/medications/{id}` | Lấy 1 item |
| `POST` | `/api/medications` | Tạo mới |
| `PUT` | `/api/medications/{id}` | Cập nhật toàn bộ |
| `PATCH` | `/api/medications/{id}` | Cập nhật 1 phần |
| `DELETE` | `/api/medications/{id}` | Xóa |

### Ví dụ CareNest

```
GET    /api/users/{id}/medications          ← thuốc của 1 elderly
POST   /api/medications                     ← thêm thuốc mới
PATCH  /api/medications/{id}               ← sửa thông tin thuốc
POST   /api/medication-logs                ← log uống thuốc
GET    /api/elderly/{id}/health-metrics    ← chỉ số sức khỏe
POST   /api/emergency-events               ← kích hoạt SOS
PATCH  /api/emergency-events/{id}/resolve  ← giải quyết SOS
```

**Không làm:**
```
-- ❌
POST /api/createMedication
GET  /api/getMedicationsForElderly
POST /api/medication/add
```

---

## 8. Checklist trước khi push

### Flutter

- [ ] `flutter analyze` — không có warning/error
- [ ] App chạy được trên emulator (không crash màn hình đang làm)
- [ ] Không để `print()` debug trong code (dùng `debugPrint()` nếu cần)
- [ ] Không hardcode URL, key — dùng constants hoặc env

### Spring Boot

- [ ] Code compile được (`mvn compile` không lỗi)
- [ ] Không để `System.out.println()` debug — dùng `log.info()` / `log.debug()`
- [ ] **KHÔNG commit** `.env`, `application-local.properties`, Firebase key JSON, hoặc bất kỳ file chứa secret
- [ ] Nếu thêm key mới vào `application-local.properties` → cập nhật luôn `application-local.properties.example` trong cùng commit
- [ ] Nếu thêm migration mới: tên file đúng format `V{n}__...sql`, số tiếp theo (hiện tại V15 → dùng V16)

### Git chung

- [ ] Đã pull develop mới nhất trước khi push
- [ ] Commit message đúng format (`feat:`, `fix:`, `chore:`...)
- [ ] Không commit file không liên quan (build output, `.DS_Store`, `*.class`)
- [ ] Branch đặt tên đúng format

---

*Vela Team | EXE101 — FPT University | Cập nhật: 12/06/2026*
