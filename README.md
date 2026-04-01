# Meey CRM — Form Tracking

Form thu thập thông tin khách hàng (Lead) cho landing page Meey CRM, tích hợp tracking events và gửi data đến Google Sheets / Webhook.

## Cấu trúc file

```
form-tracking-meey/
├── index.html        # Trang form chính
├── style.css         # Styling (responsive)
├── script.js         # Logic validate, tracking, submit
├── meey-logo.png     # Logo Meey CRM
├── README.md         # Hướng dẫn sử dụng
└── DEPLOY.md         # Hướng dẫn deploy lên GitHub Pages
```

## Tính năng

- **Form validation**: Validate real-time khi blur, hiển thị lỗi rõ ràng
- **UTM tracking**: Tự động bắt UTM params từ URL (`utm_source`, `utm_medium`, `utm_campaign`, ...)
- **Event tracking**: Ghi nhận focus, change, scroll depth, time on page
- **Google Analytics 4**: Tự động gửi events nếu đã cài GA4
- **Webhook integration**: Gửi data POST đến Google Apps Script / Zapier / n8n
- **Lead ID**: Tự động tạo mã lead unique cho mỗi submission
- **Responsive**: Hiển thị tốt trên mobile, tablet, desktop
- **Success state**: Hiển thị thông báo thành công sau khi submit

## Cách sử dụng

### 1. Chạy local

Mở file `index.html` trực tiếp trên trình duyệt, hoặc dùng Live Server:

```bash
# VS Code Live Server
# Click chuột phải vào index.html → Open with Live Server
```

### 2. Cấu hình Webhook

Mở file `script.js`, tìm phần `CONFIG` và thay đổi `WEBHOOK_URL`:

```javascript
const CONFIG = {
    WEBHOOK_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    ENABLE_TRACKING: true,
};
```

### 3. Tạo Google Apps Script nhận data

1. Mở [Google Sheets](https://sheets.google.com) → tạo sheet mới
2. Vào **Extensions → Apps Script**
3. Dán code sau:

```javascript
function doPost(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
        data.leadId,
        data.timestamp,
        data.fullName,
        data.email,
        data.phone,
        data.jobTitle,
        data.company,
        data.city,
        data.teamSize,
        data.plan,
        data.note,
        data.utm.utm_source,
        data.utm.utm_medium,
        data.utm.utm_campaign,
        data.referrer,
        data.page,
    ]);

    return ContentService.createTextOutput(
        JSON.stringify({ status: 'success' })
    ).setMimeType(ContentService.MimeType.JSON);
}
```

4. **Deploy → New deployment → Web app** → Chọn "Anyone" → Deploy
5. Copy URL và dán vào `WEBHOOK_URL` trong `script.js`

### 4. Thêm UTM vào link

```
https://your-domain.com/?utm_source=facebook&utm_medium=ads&utm_campaign=crm_launch
```

## Dữ liệu gửi đi (Payload)

| Field          | Mô tả                            |
|----------------|-----------------------------------|
| `leadId`       | Mã lead tự động (unique)          |
| `timestamp`    | Thời điểm submit (Asia/HCM)       |
| `fullName`     | Họ và tên                         |
| `email`        | Email                             |
| `phone`        | Số điện thoại                     |
| `jobTitle`     | Vị trí công việc                  |
| `company`      | Tên công ty                       |
| `city`         | Tỉnh/Thành phố                   |
| `teamSize`     | Quy mô nhân sự                   |
| `plan`         | Gói quan tâm                      |
| `note`         | Ghi chú                           |
| `utm`          | Object chứa UTM params            |
| `referrer`     | Trang giới thiệu                  |
| `page`         | URL trang hiện tại                |
| `userAgent`    | Thông tin trình duyệt             |

## Tech Stack

- HTML5 / CSS3 (vanilla, không framework)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter)
- Responsive design

## License

Meey CRM © 2026 — Thuộc hệ sinh thái MeeyGroup.
