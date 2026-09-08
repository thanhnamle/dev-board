# 📘 Báo Cáo Tổng Thể Dự Án DevBoard: Đã Làm, Đang Làm & Sẽ Làm

> **Dự án:** DevBoard — Personal Developer Workspace & Engineering Tooling  
> **Frontend Stack:** Angular 17.3+ (SSR, Standalone Components, Signals, Modern Control Flow, Lucide Icons)  
> **Backend Stack:** NestJS 10, TypeScript, Express, Cookie-parser, GitHub REST API OAuth 2.0  
> **Kiến trúc bảo mật:** HttpOnly Session Cookie (`devboard_session`), SameSite Lax, CORS Credentials  
> **Cập nhật:** Tháng 09/2026  

---

## 1. 🏁 NHỮNG VIỆC ĐÃ LÀM (COMPLETED)

### A. Giao diện & Trải nghiệm người dùng (Frontend Architecture)
- [x] **Hệ thống Design System Chuẩn Linear & Obsidian:**
  - Dual Theme: Hỗ trợ chuyển đổi Dark / Light Mode mượt mà với biến CSS toàn cục qua `ThemeService`.
  - Font chữ lập trình, border viền mỏng tinh tế, hiệu ứng glassmorphism và blur backdrop.
- [x] **Collapsible Sidebar đa năng:**
  - Quản trị đóng/mở sidebar bằng Angular Signal (`collapsed`).
  - Menu phân cấp lồng nhau (`expandedItem`, accordion animation).
  - Dynamic Badges tự động cập nhật theo số lượng dữ liệu.
  - Floating Dropdown User Card góc dưới với Avatar, tên, role, link GitHub cá nhân và hành động Logout.
- [x] **Spotlight Command Palette (`Cmd + K`):**
  - Hộp thoại tìm kiếm nhanh toàn hệ thống, hỗ trợ phím tắt điều hướng nhanh tới mọi Route, Repositories, Notes, Snippets.
- [x] **Xây dựng toàn bộ các trang chức năng (Mock & Dynamic UI):**
  - **Landing Page (`/`):** Hero section, Terminal preview, Auth Card tích hợp nút "Continue with GitHub".
  - **Dashboard Overview (`/app/dashboard/overview`):** Metrics Ribbon, danh sách việc cần làm trong ngày (Daily Focus), danh sách PR, trạng thái pipeline CI/CD.
  - **Dashboard Analytics (`/app/dashboard/analytics`):** Biểu đồ vận tốc commit theo ngày (Velocity Chart), phân bổ kích thước PR, khung giờ lập trình hiệu quả.
  - **Projects Hub (`/app/projects/*`):** `all-projects`, `bookmarks`, `starred` với bộ lọc công nghệ, tìm kiếm từ khóa, trạng thái build và đánh dấu sao/bookmark.
  - **Notes Hub (`/app/notes/*`):** `all-notes`, `tags` lưu trữ ghi chú kỹ thuật, phân loại nhãn màu.
  - **Snippets Library (`/app/snippets/*`):** `all-snippets`, `favorites` lưu trữ đoạn code mẫu với tính năng 1-Click Copy vào clipboard.
  - **Messages Hub (`/app/messages`):** Trung tâm tin nhắn và thông báo được phân loại (`mentions`, `reviews`, `system`) với giao diện chat threads và gửi phản hồi demo.
  - **GitHub Pages (`/app/github/*`):** `profile`, `repositories`, `activities`.

### B. Xây dựng Backend NestJS & Xác thực GitHub OAuth 2.0
- [x] **Bootstrap Server NestJS:** Khởi tạo backend hoàn chỉnh tại `http://localhost:3000/api`.
- [x] **Bảo mật CORS & Session:** Cấu hình CORS `credentials: true`, tích hợp `cookie-parser` hỗ trợ cookie an toàn `devboard_session` (HttpOnly).
- [x] **Xử lý `.gitignore` triệt để:** Ngăn chặn hơn 10.000 file rác từ `node_modules` và `.env` lọt vào Git.
- [x] **AuthModule (`backend/src/auth/`):**
  - Luồng OAuth 2.0: `/api/auth/github` -> GitHub Authorization -> `/api/auth/github/callback`.
  - Trao đổi Authorization Code lấy Access Token bảo mật ở phía server.
  - Endpoint `GET /api/auth/me` kiểm tra trạng thái đăng nhập.
  - Endpoint `POST /api/auth/logout` thu hồi session và xóa cookie.
  - `AuthGuard` bảo vệ các API riêng tư.
- [x] **GitHubModule (`backend/src/github/`):**
  - Tích hợp gọi GitHub REST API an toàn từ server-side: `/user`, `/user/repos`, `/notifications`, `/users/:login/events`.

---

## 2. ⚡ NHỮNG VIỆC ĐANG LÀM (IN PROGRESS)

### A. Tích hợp dữ liệu thật (Real-Data Integration) vào Frontend
- [x] **Xây dựng `GitHubApiService` (`src/app/core/services/github-api.service.ts`):**
  - Quản lý State toàn cục bằng Angular Signals (`currentUser`, `repositories`, `activities`, `notifications`, `isAuthenticated`, `loading`).
  - Đảm bảo an toàn với Angular SSR (`isPlatformBrowser`).
  - Gửi kèm HttpOnly Session Cookie bằng `credentials: 'include'`.
- [ ] **Hoàn thiện kết nối dữ liệu thật cho Sidebar:**
  - Avatar, tên thật, `@handle` thật từ tài khoản GitHub người dùng.
  - Badge số lượng Repositories động (`repoCount()`).
  - Logout thật gọi API Backend.
- [ ] **Hoàn thiện kết nối dữ liệu thật cho trang GitHub Repositories:**
  - Sửa lỗi logic điều kiện so sánh `=== 0` thành `> 0`.
  - Dùng `effect()` để tự động cập nhật danh sách ngay khi API trả kết quả.
  - Xử lý mượt mà lỗi `401 Unauthorized` khi phiên đăng nhập hết hạn do server restart.
- [ ] **Hoàn thiện kết nối dữ liệu thật cho trang GitHub Profile:**
  - Sử dụng `effect()` để cập nhật Bio, followers, following, repos count và 4 repos mới nhất vào danh mục Pinned Repos.

---

## 3. 🚀 NHỮNG VIỆC SẼ LÀM (FUTURE ROADMAP)

### Giai đoạn 3.2: Mở rộng dữ liệu thật cho các trang còn lại (Phase 3 Extension)
1. **GitHub Activities (`/app/github/activities`):**
   - Bổ sung `fetchActivities()` trong `GitHubApiService` gọi `GET /api/github/activities`.
   - Ánh xạ các sự kiện GitHub (`PushEvent`, `PullRequestEvent`, `CreateEvent`, `WatchEvent`) vào dòng thời gian hoạt động thực tế của lập trình viên.
2. **Messages Hub (`/app/messages`):**
   - Kết nối `MessagesService` với `GET /api/github/notifications`.
   - Hiển thị thông báo thật từ GitHub (yêu cầu review PR, mention, issue updates) thành danh sách tin nhắn.
3. **Dashboard Analytics (`/app/dashboard/analytics`):**
   - Dùng `computed()` phân tích tỷ lệ phần trăm các ngôn ngữ lập trình (`TypeScript`, `Go`, `Python`...) tự động từ danh sách kho mã nguồn thực tế của người dùng.
4. **Dashboard Overview (`/app/dashboard/overview`):**
   - Hiển thị tổng số star đạt được, số repo đang theo dõi, lời chào cá nhân hóa theo tên thật.
5. **Projects Hub (`/app/projects/*`):**
   - Đồng bộ danh sách repository vào danh mục dự án, lưu trữ trạng thái `isStarred` và `isBookmarked` vào `localStorage` (Local-First pattern).

### Giai đoạn 4: Database Persistence & Production Ready (Phase 4)
1. **Lưu trữ Session & Dữ liệu vĩnh viễn (PostgreSQL + Prisma ORM):**
   - Thay thế cơ chế lưu session tạm trong RAM (`new Map()`) bằng bảng `sessions` trong PostgreSQL. Khi restart server backend, người dùng **không bị mất phiên đăng nhập (hết lỗi 401)**.
   - Tạo bảng `notes` và `snippets` trong database để người dùng có thể tạo, chỉnh sửa, xóa ghi chú và code mẫu của riêng mình.
2. **Đồng bộ GitHub Gists:**
   - Tự động kéo các đoạn code từ GitHub Gists về thư viện Snippets.
3. **Docker Compose & Triển khai (DevOps):**
   - Viết `Dockerfile` và `docker-compose.yml` chạy trọn gói: Angular Frontend (SSR), NestJS Backend, PostgreSQL Database.
   - Hướng dẫn deploy lên môi trường Production (Render/Railway/Vercel/VPS).
