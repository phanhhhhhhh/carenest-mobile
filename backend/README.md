# CareNest Backend

Spring Boot 3.2 + Java 21 — REST API cho app chăm sóc sức khỏe người cao tuổi.  
**Nhóm Vela | EXE101 — FPT University**

---

## Yêu cầu cài đặt trước

| Tool | Version | Tải về |
|------|---------|--------|
| JDK | **21** (bắt buộc đúng version) | [Adoptium Temurin 21](https://adoptium.net/) |
| Maven | 3.9+ | [maven.apache.org](https://maven.apache.org/download.cgi) |
| Docker Desktop | Mới nhất | [docker.com](https://www.docker.com/products/docker-desktop/) |
| IntelliJ IDEA | Community hoặc Ultimate | [jetbrains.com](https://www.jetbrains.com/idea/) |

> **Lưu ý Java:** Phải dùng đúng **Java 21**, không phải 17 hay 11.  
> Kiểm tra bằng lệnh: `java -version` → phải thấy `21.x.x`

---

## Setup lần đầu (5 bước)

### Bước 1 — Clone project

```bash
git clone <repo-url>
cd carenest_backend
```

### Bước 2 — Khởi động PostgreSQL bằng Docker

```bash
docker run -d --name carenest-postgres \
  -e POSTGRES_DB=carenest_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

Kiểm tra đang chạy:
```bash
docker ps
# Phải thấy container "carenest-postgres" với STATUS "Up"
```

> Lần sau chỉ cần `docker start carenest-postgres` — không cần chạy lại lệnh dài trên.

### Bước 3 — Mở project trong IntelliJ

1. Mở IntelliJ → **Open** → chọn thư mục `carenest_backend`
2. IntelliJ sẽ tự detect Maven project và tải dependencies (~2-3 phút lần đầu)
3. Vào **File → Project Structure → Project SDK** → chọn Java 21

### Bước 4 — Cấu hình Lombok

Trong IntelliJ:
1. **File → Settings → Plugins** → tìm "Lombok" → Install → Restart
2. **File → Settings → Build → Compiler → Annotation Processors** → tick **Enable annotation processing**

### Bước 5 — Chạy ứng dụng (dev profile)

Trong IntelliJ, mở file `CareNestBackendApplication.java` → click nút **Run** (▶)

Hoặc dùng terminal:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Chạy thành công khi thấy log:
```
Started CareNestBackendApplication in X.XXX seconds
```

**Flyway sẽ tự tạo toàn bộ bảng** khi khởi động lần đầu.  
**Seed data sẽ tự load** (5 người cao tuổi mẫu, 10 gia đình, thuốc, chỉ số sức khỏe).

---

## Kiểm tra hoạt động

| URL | Kết quả mong đợi |
|-----|-----------------|
| `http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| `http://localhost:8080/swagger-ui.html` | Swagger UI — danh sách API |

---

## Chạy test

> **Yêu cầu:** Docker phải đang chạy (Testcontainers tự tạo PostgreSQL tạm thời để test)

```bash
mvn test
```

Lần đầu chạy test sẽ tải image `postgres:15` về (~200MB), các lần sau nhanh hơn.

---

## Cấu trúc project

```
carenest_backend/
├── src/main/java/com/carenest/backend/
│   ├── CareNestBackendApplication.java   ← Entry point
│   ├── entity/                           ← JPA entities (User, Medication, ...)
│   ├── repository/                       ← Spring Data JPA repositories
│   ├── seeder/                           ← DataSeeder (chạy khi profile=dev)
│   └── config/                           ← Config classes (thêm dần theo module)
│
├── src/main/resources/
│   ├── application.properties            ← Config chung
│   ├── application-dev.properties        ← Config local dev (DB local)
│   └── db/
│       ├── migration/                    ← Flyway SQL (V1–V8, KHÔNG sửa trực tiếp)
│       └── rollback/                     ← Script rollback thủ công (R1–R8)
│
├── src/test/                             ← Integration tests
├── docs/
│   └── database-schema.md                ← ERD + mô tả schema
└── README.md                             ← File này
```

---

## Tech Stack

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| Language | Java 21 | Virtual Threads bật sẵn |
| Framework | Spring Boot 3.2 | |
| Database | PostgreSQL 15 | Local: Docker / Prod: Render |
| Migration | Flyway | Tự chạy khi start |
| ORM | Spring Data JPA + Hibernate 6 | |
| Docs | Swagger UI (SpringDoc) | `/swagger-ui.html` |
| Monitoring | Spring Actuator | `/actuator/health` |
| Build | Maven 3.9 | |

**Sẽ thêm vào khi làm module tương ứng:**
- `spring-boot-starter-security` + JWT → khi làm **Module Auth (UC-01)**
- `firebase-admin` → khi có `serviceAccountKey.json` từ **Firebase Console**

---

## Quy tắc migration (QUAN TRỌNG)

- **KHÔNG bao giờ sửa file V1–V8** đã có. Flyway sẽ báo lỗi checksum.
- Cần thêm cột/bảng → tạo file **V9__...sql**, **V10__...sql** mới.
- Tên file phải đúng format: `V{số}__{mô_tả}.sql` (2 dấu gạch dưới giữa)

---

## Lỗi thường gặp

**`Cannot connect to database`**
→ Docker chưa chạy. Kiểm tra: `docker ps` → nếu không thấy `carenest-postgres` thì chạy `docker start carenest-postgres`

**`Flyway checksum mismatch`**
→ Ai đó sửa file migration cũ. Không được sửa file V đã có, phải tạo file V mới.

**`Annotation processor not found` (Lombok không hoạt động)**
→ Kiểm tra lại bước cài Lombok plugin và bật Annotation Processing trong IntelliJ.

**`Test failed: Could not find a valid Docker environment`**
→ Docker Desktop chưa mở. Mở Docker Desktop lên rồi chạy test lại.

---

## Render PostgreSQL — ⚠️ Expire sau 90 ngày

Free tier của Render **tự xóa toàn bộ data sau 90 ngày**.  
→ Set nhắc lịch ở ngày thứ 80 sau khi tạo DB để upgrade lên $7/tháng.

---

*Vela Team | EXE101 — FPT University | Cập nhật: 11/06/2026*
