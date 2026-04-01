# Deploy lên GitHub Pages

Hướng dẫn từng bước đẩy project lên GitHub và bật GitHub Pages.

## Bước 1: Tạo repository trên GitHub

1. Đăng nhập [github.com](https://github.com)
2. Click **"+"** → **New repository**
3. Đặt tên: `form-tracking-meey`
4. Chọn **Public**
5. **Không** tick "Add a README file" (vì đã có sẵn)
6. Click **Create repository**

## Bước 2: Push code lên GitHub

Mở terminal tại thư mục project, chạy lần lượt:

```bash
# Khởi tạo git
git init

# Thêm tất cả file
git add .

# Tạo commit đầu tiên
git commit -m "Initial commit: form tracking page for Meey CRM"

# Đổi branch mặc định thành main
git branch -M main

# Thêm remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/form-tracking-meey.git

# Push lên GitHub
git push -u origin main
```

## Bước 3: Bật GitHub Pages

1. Vào repository trên GitHub
2. Click **Settings** → **Pages** (menu bên trái)
3. Mục **Source**: chọn **Deploy from a branch**
4. Mục **Branch**: chọn `main` → folder `/ (root)` → **Save**
5. Đợi 1-2 phút, trang sẽ live tại:

```
https://YOUR_USERNAME.github.io/form-tracking-meey/
```

## Bước 4: Cập nhật code

Sau khi chỉnh sửa file, chạy:

```bash
git add .
git commit -m "Mô tả thay đổi"
git push
```

GitHub Pages sẽ tự động cập nhật sau 1-2 phút.

## Bước 5: Kết nối Google Sheets (tùy chọn)

1. Mở file `script.js`
2. Thay `WEBHOOK_URL` bằng URL Google Apps Script (xem README.md)
3. Commit và push lại

## Kiểm tra

- Mở link GitHub Pages trên trình duyệt
- Điền form và submit
- Kiểm tra Google Sheets (nếu đã cấu hình) hoặc xem Console (F12)

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Trang 404 | Đợi 2-5 phút sau khi bật Pages, hoặc kiểm tra branch đúng `main` |
| CSS/JS không load | Kiểm tra tên file đúng chính xác (phân biệt hoa/thường) |
| Logo không hiện | Đảm bảo `meey-logo.png` đã được commit và push |
| Form không gửi data | Kiểm tra `WEBHOOK_URL` trong script.js và CORS settings |

## Custom Domain (nâng cao)

1. Settings → Pages → Custom domain
2. Nhập domain (ví dụ: `form.meeycrm.com`)
3. Cấu hình DNS CNAME trỏ về `YOUR_USERNAME.github.io`
4. Tick **Enforce HTTPS**
