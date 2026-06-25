$today = Get-Date -Format "dd-MM-yyyy"
$projectDir = "D:\FPT\Sem 7\EXE101\CareNest\Project\carenest_mobile"

Set-Location $projectDir

$prompt = @"
/ralph "Tạo Daily Report cho ngày hôm nay ($today) dựa trên git history và các file đã thay đổi:

1. Chạy git log --since='today 00:00' --until='now' --oneline để lấy tất cả commits hôm nay
2. Chạy git diff HEAD~10..HEAD --stat để xem files đã thay đổi
3. Đọc docs/UC-01-AUTH-STATUS.md nếu tồn tại

Tạo file docs/daily-reports/DAILY-REPORT-$today.md với format:

---
CareNest | Daily Report $today | Vela Team — EXE101

## Tổng quan
[1-2 câu mô tả ngày hôm nay làm gì]

## Tiến độ cuối ngày
Backend    [progress bar] X%
Flutter    [progress bar] X%
Tổng thể   [progress bar] X%

## Đã làm được
### Backend
[liệt kê theo commit: tên commit, files thay đổi, ý nghĩa]

### Flutter
[liệt kê theo commit: tên commit, files thay đổi, ý nghĩa]

### Documentation
[các docs file được tạo/cập nhật]

## Cần cập nhật — Dev khác đọc trước
[những thứ dev khác cần biết khi pull code: file mới, config mới, breaking changes]

## Vấn đề gặp phải
[issues, workarounds, known bugs]

## Trạng thái UC cuối ngày
| UC | Backend | Flutter | Status |
[điền từng UC đã touch hôm nay]

## Ngày mai cần làm
[top 3-5 việc ưu tiên nhất cho ngày mai]
---

Dựa trên git history thực tế, không bịa. Sau khi tạo xong in nội dung ra màn hình.
--no-deslop"
"@

Write-Host "Generating daily report for $today..." -ForegroundColor Cyan
claude $prompt
