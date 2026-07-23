# CareNest — Kịch bản Demo

Toàn bộ giao diện app đã chuyển sang tiếng Việt. Dùng 2 thiết bị/trình duyệt song song — một đăng nhập vai Người cao tuổi (John), một vai Người thân (Linda) — để cảnh báo hiện lên "sống" ngay khi vừa demo bên kia xong.

## Tài khoản demo

| Vai trò | Số điện thoại | Email | Mật khẩu |
|---|---|---|---|
| Người cao tuổi | `+84912345001` | `john.anderson@test.com` | `Demo@1234` |
| Người thân | `+84918111001` | `linda.nguyen@test.com` | `Demo@1234` |

Đăng nhập bằng số điện thoại hoặc email đều được (màn đăng nhập có nút chuyển đổi Số điện thoại / Email).

---

## 1. Đăng nhập & Dashboard (mở màn)

**Thiết bị: John (Người cao tuổi)**
1. Đăng nhập → vào thẳng **Trang chủ**.
2. Chỉ ra: lời chào theo giờ trong ngày, nút **SOS** to màu đỏ, thẻ "Thuốc tiếp theo", 3 chỉ số sức khỏe hôm nay (Nhịp tim / Huyết áp / Đường huyết), thẻ camera, thẻ "Trò chuyện với AI".

**Thiết bị: Linda (Người thân)**
3. Đăng nhập → **Trang chủ** hiện dashboard tổng hợp của John: bệnh nền, trạng thái camera, 3 chỉ số mới nhất, vòng tuân thủ thuốc hôm nay, thẻ "Báo cáo tuần", camera trực tiếp, "Cảnh báo gần đây".
4. Đây là điểm nhấn — một màn hình duy nhất tổng hợp mọi thông tin quan trọng về John.

---

## 2. Thêm thuốc (Người cao tuổi)

**Thiết bị: John**
1. Vào tab **Thuốc** → chạm **+ Thêm**.
2. Nhập tên thuốc, liều lượng, tần suất, giờ uống → **Lưu**.
3. Thuốc mới xuất hiện ngay trong danh sách "Lịch thuốc hôm nay" — không cần tải lại.
4. (Trên điện thoại thật) Nhắc nhở uống thuốc được đặt lịch local trên máy — trên web bước này không áp dụng vì không có thông báo hệ thống.

---

## 3. Đo chỉ số sức khỏe & cảnh báo bất thường

**Thiết bị: John**
1. Vào tab **Sức khỏe** → thêm chỉ số mới → chọn **Huyết áp** → nhập giá trị cao bất thường (vd tâm thu 175).
2. Lưu — hệ thống kiểm tra ngưỡng cảnh báo *và* phân tích bất thường bằng AI ở phía server.

**Thiết bị: Linda**
3. Mở chuông thông báo (góc trên bên phải màn Trang chủ) → thấy thông báo **Cảnh báo sức khỏe** kèm phân tích do AI tạo, không chỉ con số thô.
4. Thông báo được lưu lại lâu dài (không chỉ là push) — tắt mở lại app vẫn còn.

---

## 4. SOS khẩn cấp

**Thiết bị: John**
1. Ở tab **Trang chủ**, nhấn giữ nút **SOS** 3 giây — để đếm ngược chạy hết (không bấm Hủy), đây là cơ chế chống bấm nhầm, nên nhắc tới khi demo.
2. Xuất hiện thông báo xác nhận đã gửi tín hiệu khẩn cấp tới người thân.

**Thiết bị: Linda**
3. Vào **Cảnh báo gần đây → Xem tất cả** trên Trang chủ — sự kiện SOS mới xuất hiện đầu danh sách, trạng thái **ACTIVE**.
4. Có thể xác nhận (acknowledge) ngay trên màn này.
5. Một ảnh chụp camera cũng được ghi lại tự động lúc trigger — xem trong tab **Camera** của thiết bị John.

> Lưu ý: Push thông báo qua FCM chưa được cấu hình trong bản build này, nên cảnh báo sẽ không hiện dạng thông báo hệ thống (banner) — chỉ hiện trong danh sách thông báo/cảnh báo trong app. Đây là kênh đáng tin cậy nhất cho demo.

---

## 5. Trò chuyện với AI (Gemini)

**Thiết bị: John**
1. Vào tab **Chat AI**.
2. Gõ: *"Mấy giờ tôi uống thuốc huyết áp vậy?"* rồi gửi.
3. AI trả lời dựa trên lịch thuốc thật của John (Amlodipine 8:00 sáng) — API key Gemini chỉ nằm ở server, app di động không chạm vào.
4. Có thể hỏi thêm: *"Kể cho tôi một câu chuyện được không? Tôi thấy cô đơn quá."* để thể hiện AI không chỉ trả lời về thuốc mà còn trò chuyện tâm sự.

> Lưu ý: Nút micro (nhập bằng giọng nói) hiện là placeholder — chưa được nối vào tính năng ghi âm/nhận diện giọng nói thật, không demo phần này.

---

## 6. Camera

**Thiết bị: Linda**
1. Vào tab **Camera** (hoặc chạm thẻ camera trên Dashboard → "Xem").
2. Chạm **Chụp ảnh (Snapshot)** — chụp ảnh mới từ camera demo của John, thêm vào dòng thời gian.
3. Cuộn xuống thấy ảnh SOS đã được chụp tự động từ 4 ngày trước, gắn nhãn cảnh báo khẩn cấp.

> Lưu ý: "Xem trực tiếp" (Live View) mở qua link/app ngoài qua API Imou thật, không phải video nhúng trong app, và cần `IMOU_APP_ID`/`IMOU_APP_SECRET` (chưa cấu hình trong bản build này). Nên demo **Chụp ảnh** là chính.

---

## Điều hướng — mỗi màn đều có nút quay lại

Mọi màn hình con (Lịch hẹn, Liên hệ khẩn cấp, Lịch sử thuốc, Báo cáo sức khỏe, Cảnh báo, Gói Premium, Báo cáo tuần, Thông báo, Cài đặt thông báo...) đều có nút mũi tên quay lại ở góc trên bên trái. Các màn gốc trong tab bar (Trang chủ, Thuốc, Camera, Sức khỏe, Hồ sơ) không có nút quay lại vì chuyển bằng tab bar phía dưới, không phải điều hướng "đẩy" (push).

---

## Nếu có sự cố khi demo trực tiếp

- Backend mất kết nối → app hiện toast "Không có kết nối — vui lòng kiểm tra mạng và thử lại" thay vì treo máy im lặng — nếu gặp, đây cũng là lúc hay để nói về xử lý mất kết nối.
- Màn hình trống không có dữ liệu → có thể do seed chưa chạy — kiểm tra log backend tìm dòng "Seed data created successfully".
- Backend đột ngột dừng (crash JVM) → khởi động lại bằng lệnh trong `DEMO_CHECKLIST.md`; đã gặp hiện tượng này vài lần trong lúc test, có vẻ là lỗi JIT/JVM ngẫu nhiên của máy, không liên quan tới code — nên có người túc trực sẵn sàng restart nếu cần.
