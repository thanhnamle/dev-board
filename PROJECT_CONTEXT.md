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
  - Font chữ lập trình, border viền mỏng tinh tế, hiệu ứng glassmorphism, background radial gradient sâu thẳm.
- [x] **Đại tu toàn diện Collapsible Sidebar (Linear Obsidian Tech Aesthetics):**
  - **Brand Logo & Typography:** Chữ `DEV` in đậm sắc nét kết hợp `BOARD` với dải gradient công nghệ (`#818cf8` ➔ `#c084fc` ➔ `#f472b6`) và nhãn phụ `WORKSPACE`.
  - **Vạch chỉ báo Active chuẩn Linear (Active Accent Pill):** Thanh dạ quang tím/indigo phát sáng ở mép trái khi một mục menu được kích hoạt.
  - **Cây thư mục con (Tree Submenu):** Hiệu ứng phát sáng dạ quang neon cho đường nhánh (`tree-curve`) và sub-items khi active.
  - **Nút Toggle mượt mà:** Cố định vị trí bo tròn tinh tế tại cạnh trên (`top: 27px; right: -13px`) cả khi mở lẫn khi thu gọn, không còn bị nhảy lung tung.
  - **Kệ "Pinned Repos" (Bookmarks Quick Shelf):** Hiển thị nhanh các repository bạn đã bookmark kèm chấm màu nhận diện ngôn ngữ (TypeScript, JavaScript, Python, Go,...).
  - **Thẻ Telemetry "DevBoard Sync":** Bổ sung thẻ kính mờ hiển thị trạng thái kết nối GitHub live (`Connected`) cùng 3 thông số tổng quan: Repos (21), Pinned, Commits (201) giải quyết triệt để khoảng trống ở giữa Sidebar.
  - **User Profile Card:** Avatar thật từ GitHub kèm chấm xanh online có hiệu ứng nhịp đập (`pulsing dot`), tích hợp menu nổi với liên kết profile và nút Logout.
- [x] **Spotlight Command Palette (`Cmd + K`):**
  - Hộp thoại tìm kiếm nhanh toàn hệ thống, hỗ trợ phím tắt điều hướng nhanh tới mọi Route, Repositories, Notes, Snippets, Discussions.
- [x] **Chuyển đổi toàn diện từ "Messages" sang "Discussions":**
  - Định tuyến chính thức: `/app/discussions` (tự động chuyển hướng từ `/app/messages` để giữ tương thích ngược).
  - Cập nhật Sidebar: Menu **Discussions** (kèm badge tin chưa đọc) đặt tại phân vùng Communication.
  - Cập nhật trang giao diện: Tiêu đề **Discussions & Inbox**, bộ lọc danh mục (`All discussions`, `Mentions`, `Reviews`, `System`), tìm kiếm thảo luận và form phản hồi nhanh.
  - Tích hợp vào Command Palette: hỗ trợ tìm từ khóa `discussions`, `threads`, `messages`, `inbox`.
- [x] **Xây dựng & Nâng cấp toàn bộ các trang chức năng:**
  - **Landing Page (`/`):** Hero section, Terminal preview, Auth Card tích hợp nút "Continue with GitHub".
  - **Dashboard Overview (`/app/dashboard/overview`):** Metrics Ribbon, danh sách việc cần làm trong ngày (Daily Focus), danh sách PR, trạng thái pipeline CI/CD.
  - **Dashboard Analytics (`/app/dashboard/analytics`):** Biểu đồ vận tốc commit theo ngày (Velocity Chart), phân bổ kích thước PR, khung giờ lập trình hiệu quả.
  - **Projects Hub (`/app/projects/*`):**
    - `all-projects`: Hiển thị 21 repositories thật từ tài khoản GitHub, loại bỏ toàn bộ mock sample repos.
    - `bookmarks`: Kệ lưu trữ cá nhân độc quyền của DevBoard (Local-First) giúp lập trình viên ghim nhanh các dự án quan trọng.
    - `starred`: Danh sách các kho mã nguồn được đánh sao yêu thích.
    - Cả 3 trang hỗ trợ bộ lọc ngôn ngữ, tìm kiếm từ khóa, chế độ xem Grid/List và nút bấm toggle Bookmark/Star đồng bộ tức thì.
  - **Notes Hub (`/app/notes/*`):** `all-notes`, `tags` lưu trữ ghi chú kỹ thuật, phân loại nhãn màu.
  - **Snippets Library (`/app/snippets/*`):** `all-snippets`, `favorites` lưu trữ đoạn code mẫu với tính năng 1-Click Copy vào clipboard.
  - **GitHub Explorer (`/app/github/*`):** `profile`, `activities` tích hợp dữ liệu thật từ tài khoản GitHub người dùng.

### B. Xây dựng Backend NestJS & Tích hợp GitHub OAuth 2.0
- [x] **Bootstrap Server NestJS:** Khởi tạo backend hoàn chỉnh tại `http://localhost:3000/api`.
- [x] **Bảo mật CORS & Session:** Cấu hình CORS `credentials: true`, tích hợp `cookie-parser` hỗ trợ cookie an toàn `devboard_session` (HttpOnly).
- [x] **Xử lý `.gitignore` triệt để:** Loại bỏ các file rác và dependencies không mong muốn.
- [x] **AuthModule (`backend/src/auth/`):**
  - Luồng OAuth 2.0: `/api/auth/github` -> GitHub Authorization -> `/api/auth/github/callback`.
  - Trao đổi Authorization Code lấy Access Token bảo mật ở server-side.
  - Endpoint `GET /api/auth/me` kiểm tra trạng thái đăng nhập.
  - Endpoint `POST /api/auth/logout` thu hồi session và xóa cookie.
- [x] **GitHubModule (`backend/src/github/`):**
  - Tích hợp gọi GitHub REST API an toàn: `/user`, `/user/repos`, `/users/:login/events`, tính toán đóng góp hàng năm (201 contributions).

### C. Tích hợp dữ liệu thật (Real-Data Integration) vào Frontend
- [x] **Xây dựng `GitHubApiService` (`src/app/core/services/github-api.service.ts`):**
  - Quản lý State toàn cục bằng Angular Signals (`currentUser`, `repositories`, `activities`, `contributions`, `isAuthenticated`, `loading`).
  - Đảm bảo an toàn với Angular SSR (`isPlatformBrowser`).
  - Gửi kèm HttpOnly Session Cookie bằng `credentials: 'include'`.
- [x] **Đồng bộ hóa `WorkspaceDataService`:**
  - Tự động đồng bộ 21 GitHub repositories vào State dự án `workspace.projects()`.
  - Cơ chế Local-First bền bỉ với `localStorage`: lưu trữ danh sách ID các repo được Bookmark và Star, tự động khởi tạo mặc định cho repo nổi bật (`dev-board`).
- [x] **Khắc phục các lỗi kỹ thuật nền tảng:**
  - Xử lý lỗi Angular 17 template compiler (`NG5002: Unexpected character EOF / unescaped {` và `&#64;` interpolation).
  - Điều chỉnh ngân sách build kích thước style trong `angular.json` để `npm run build` vượt qua 100% không lỗi.

---

## 2. ⚡ NHỮNG VIỆC ĐANG LÀM (IN PROGRESS)

### A. Hoàn thiện nghiệp vụ người dùng cho Notes & Snippets
- [ ] **Chức năng Tạo / Chỉnh sửa / Xóa (CRUD) cho Notes:**
  - Bổ sung modal hoặc trang soạn thảo Markdown cho phép người dùng tự viết ghi chú mới và gắn tag riêng.
- [ ] **Chức năng Thêm / Quản lý Snippets mới:**
  - Cho phép người dùng dán các đoạn mã mẫu thường dùng và chọn ngôn ngữ highlight.

### B. Tinh chỉnh Responsive & Mobile Layout
- [ ] **Mobile Sidebar Drawer:**
  - Bổ sung nút hamburger menu và backdrop overlay khi xem trên màn hình điện thoại/tablet nhỏ hơn 768px.

---

## 3. 🚀 NHỮNG VIỆC SẼ LÀM (FUTURE ROADMAP)

### Giai đoạn 4: Database Persistence & Production Ready (Phase 4)
1. **Lưu trữ Session & Dữ liệu vĩnh viễn (PostgreSQL + Prisma ORM):**
   - Thay thế cơ chế lưu session tạm trong RAM (`new Map()`) bằng bảng `sessions` trong PostgreSQL để khi restart backend server, người dùng **không bị mất phiên đăng nhập (hết lỗi 401)**.
   - Tạo bảng `notes` và `snippets` trong database để lưu trữ dữ liệu người dùng trên cloud thay vì dữ liệu bộ nhớ tạm.
2. **Đồng bộ GitHub Gists:**
   - Tự động kéo các đoạn code từ GitHub Gists của tài khoản về thư viện Snippets.
3. **Docker Compose & Triển khai (DevOps):**
   - Viết `Dockerfile` và `docker-compose.yml` chạy trọn gói: Angular Frontend (SSR), NestJS Backend, PostgreSQL Database.
   - Hướng dẫn deploy lên môi trường Production (Render/Railway/Vercel/VPS).
