# DevBoard - Developer Workspace & Internal Tools

> Hệ thống công cụ nội bộ hỗ trợ lập trình viên quản lý dự án, ghi chú kỹ thuật, code snippets và tích hợp GitHub.

---

## 📌 Tổng Quan Nhanh

* **Frontend:** Angular 17.3 (Standalone Components, Signals, SSR with Express, Lucide Icons).
* **Backend:** Sẵn sàng cho dịch vụ RESTful API / OAuth Service.
* **Tài liệu kỹ thuật chi tiết:** Vui lòng xem tại [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).

---

## 🚀 Khởi Chạy Nhanh (Quick Start)

1. **Cài đặt thư viện dependencies:**
   ```powershell
   cd frontend
   npm install
   ```

2. **Chạy máy chủ phát triển (Dev Server):**
   ```powershell
   npm start
   # Hoặc: ng serve
   ```
   Mở trình duyệt tại: `http://localhost:4200/`

3. **Build dự án:**
   ```powershell
   npm run build
   ```

## Phát triển tiếp

- [Kế hoạch triển khai](./DEVELOPMENT_PLAN.md) ghi lại hiện trạng và các giai đoạn tiếp theo.
- Messages Hub: mở `/app/messages` sau khi chạy frontend. Thông báo, phản hồi và trạng thái đã đọc hiện là demo trong bộ nhớ; reload sẽ reset.
- Global search: nhấn `Cmd + K` trên macOS hoặc `Ctrl + K` trên Windows/Linux để tìm page, project, note và snippet.
