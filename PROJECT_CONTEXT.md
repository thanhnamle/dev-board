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
  - Hỗ trợ đổi tài khoản GitHub linh hoạt với tham số `&prompt=select_account`, giải quyết triệt để vấn đề đăng xuất xong đăng nhập lại vẫn dính tài khoản cũ.
  - Trao đổi Authorization Code lấy Access Token bảo mật ở server-side.
  - Endpoint `GET /api/auth/me` kiểm tra trạng thái đăng nhập.
  - Endpoint `POST /api/auth/logout` thu hồi session và xóa cookie.
- [x] **GitHubModule (`backend/src/github/`):**
  - Tích hợp gọi GitHub REST API an toàn: `/user`, `/user/repos`, `/users/:login/events`, tính toán lịch đóng góp và phân loại hoạt động theo tài khoản người dùng thực tế.

### C. Tích hợp dữ liệu thật (Real-Data Integration) vào Frontend
- [x] **Xây dựng `GitHubApiService` (`src/app/core/services/github-api.service.ts`):**
  - Quản lý State toàn cục bằng Angular Signals (`currentUser`, `repositories`, `activities`, `contributions`, `isAuthenticated`, `loading`).
  - Đảm bảo an toàn với Angular SSR (`isPlatformBrowser`).
  - Gửi kèm HttpOnly Session Cookie bằng `credentials: 'include'`.
- [x] **Đồng bộ hóa `WorkspaceDataService` & Cô lập dữ liệu đa tài khoản (User-Scoped Data):**
  - Phân tách Bookmarks & Starred theo từng tài khoản (`devboard_bookmarked_project_ids_${login}`), reset sạch sẽ khi Logout để tránh rò rỉ dữ liệu giữa các tài khoản khác nhau.
  - Cơ chế Local-First bền bỉ với `localStorage`: lưu trữ danh sách ID các repo được Bookmark và Star phản ứng tức thì.
- [x] **Loại bỏ triệt để các Mock/Fallback giả lập (Zero-Data Overhaul):**
  - Khắc phục lỗi dùng toán tử falsy `||` khiến tài khoản mới/trắng (0 commits, 0 PRs, 0 repos) bị nhảy số giả (18 commits, 201 telemetry, 24 PRs ảo).
  - Chuyển toàn bộ sang nullish coalescing `?? 0` và kiểm tra mảng rỗng trên toàn bộ hệ thống (`Overview`, `Analytics`, `Profile`, `Activities`, `Sidebar`).
  - Cung cấp trạng thái rỗng sạch sẽ (Empty States & Zero Metric Badges) chính xác 100% theo dữ liệu API thật.
- [x] **Khắc phục các lỗi kỹ thuật nền tảng:**
  - Xử lý lỗi Angular 17 template compiler (`NG5002: Unexpected character EOF / unescaped {` và `&#64;` interpolation).
  - Điều chỉnh ngân sách build kích thước style trong `angular.json` để `npm run build` vượt qua 100% không lỗi.

---

### D. Hoàn thiện các phân hệ chức năng tương tác (Interactive Workspace Hubs)
- [x] **Phân hệ Ghi chú kỹ thuật (Engineering Notes & Specs CRUD):**
  - **Modal tạo mới & Chỉnh sửa Spec (Linear Obsidian Modal):** Hỗ trợ nhập tiêu đề, danh mục (Architecture RFC, Cloud Infra, Security Policy, Operations Runbook), tóm tắt, gắn nhãn tags và nội dung văn bản Markdown đa đoạn.
  - **Chức năng Chỉnh sửa (Edit) & Xóa (Delete):** Cho phép cập nhật trực tiếp nội dung spec đang xem hoặc xóa khỏi kho ghi chú với xác nhận an toàn.
  - **Tính năng Ghim (Pin/Unpin):** Ghim nhanh các tài liệu kỹ thuật quan trọng lên đầu danh mục.
  - **Chỉ số thời gian thực (Dynamic Metrics):** Tự động đếm tổng số từ (word count), ước tính thời gian đọc (read time) và thống kê số lượng spec theo từng phân loại (thay thế hoàn toàn số liệu hardcode).
  - **Lưu trữ bền vững:** Tự động đồng bộ vào `localStorage` có phân tách theo user login (`devboard_user_notes_${login}`).
- [x] **Kho lưu trữ Code Snippets & Gists (Snippets CRUD & Favorites):**
  - **Modal tạo mới Snippet:** Cho phép thêm đoạn mã code mẫu với tiêu đề, tên file, phân loại ngôn ngữ (TypeScript, Go, SQL, Docker, Shell, CSS, Python, Rust,...), tags và mô tả.
  - **Hệ thống Favorites đồng bộ:** Nút thả tim (Heart) trên từng thẻ snippet giúp đưa ngay vào danh mục yêu thích (`FavoritesComponent`), đồng bộ 2 chiều tức thì.
  - **1-Click Copy & Xóa snippet:** Sao chép mã nguồn trực tiếp vào clipboard với thông báo phản hồi trực quan; nút xóa bỏ code cũ/thừa.
  - **Lưu trữ bền vững:** Tự động đồng bộ vào `localStorage` (`devboard_user_snippets_${login}`).
- [x] **Trang Favorites Hub (`/app/snippets/favorites`):**
  - Kết nối trực tiếp vào `WorkspaceDataService` (loại bỏ danh sách tĩnh 4 mục trước đây).
  - Thống kê thời gian thực: số lượng stack ngôn ngữ, số lượng util ghim.
  - Bổ sung trạng thái rỗng đẹp mắt (Obsidian Empty State) khi chưa có snippet nào được đánh dấu yêu thích kèm nút tạo nhanh.
- [x] **Phân loại Chủ đề Tags (`/app/notes/tags`):**
  - Modal tạo nhanh **+ New Tag** liên kết ngay một note kỹ thuật ban đầu, giúp từ khóa xuất hiện tức thì trong đám mây chủ đề (Tag Cloud) và các thẻ số liệu.
  - Liên kết điều hướng sâu (`[queryParams]="{ note: note.id }"`): Bấm "Read Note" chuyển thẳng sang xem bài viết tương ứng tại trang `all-notes`.
- [x] **Kênh Thảo luận Kỹ thuật (`/app/discussions`):**
  - Nút và Modal **+ New Discussion**: Tạo chủ đề thảo luận mới với tiêu đề, ngữ cảnh repository (`devboard/frontend`,...), danh mục (`Mentions`, `Code Review`, `System`) và nội dung mở đầu.
  - Tự động kích hoạt xem và phản hồi ngay thread vừa tạo.
- [x] **Hệ thống Modal Glassmorphism Toàn Cục (`styles.css`):**
  - Bộ class tái sử dụng (`modal-backdrop`, `modal-card`, `modal-header`, `modal-body`, `modal-footer`, `form-input`, `form-select`, `form-textarea`,...) đồng bộ 100% phong cách thiết kế Obsidian dark/light trên toàn bộ ứng dụng.

### E. Không Gian Làm Việc Kho Mã Nguồn & Git Graph (Repository Workspace Hub)
- [x] **Trang Không Gian Làm Việc Kho Mã Nguồn (`/app/projects/workspace`):**
  - **Bộ chọn Repository thông minh (Repo Selector Dropdown):** Tìm kiếm và chọn tức thì giữa các repository người dùng; tự động đồng bộ qua URL query parameter `?repo=owner/name`.
  - **Dải chỉ số 4 thông số (Repository Metrics Ribbon):** Hiển thị trực quan Stars, Forks, Open PRs, Total Commits theo repository được chọn.
  - **Trình trực quan hóa Git Graph tương tác (Interactive SVG Git Graph Visualizer):**
    - Phân làn nhánh tự động (branch lanes algorithm), node commit phát sáng dạ quang neon theo màu lane.
    - Vẽ đường cong mượt mà (Bezier curves: `M x1 y1 C ... x2 y2`) thể hiện phân nhánh và hợp nhất (merge branches).
    - Phân biệt commit thông thường và merge commit (vòng đôi đan xen).
    - Tương tác click chọn node commit để xem chi tiết ngay lập tức.
  - **Dòng thời gian Commits (Git Commit History Stream):**
    - **Khắc phục triệt để giới hạn 50 commits:** Sử dụng kỹ thuật đọc `Link` header từ request `HEAD` (`per_page=1`) để lấy chính xác 100% tổng số commit (ví dụ: **121 commits** thay vì bị gán ngầm 50 của 1 trang đơn).
    - **Tự động tải đa trang (Auto-fetch multi-page):** Đối với các repo quy mô vừa (<= 300 commits), tự động kéo tất cả các trang tiếp theo để hiển thị đầy đủ 100% commit lên Git Graph và Commit Stream.
    - **Nút "Load More Commits" & Phân trang thông minh:** Hỗ trợ tải thêm từng đợt 100 commits đối với các repository lớn.
    - Danh sách đầy đủ các commit thật từ GitHub với SHA 7 ký tự (1-click copy).
    - Hiển thị commit message, tác giả kèm avatar GitHub thật, huy hiệu Verified GPG, thời gian tương đối (`2h ago`, `Yesterday`,...).
    - Thanh tìm kiếm commit theo nội dung, author hoặc commit SHA.
    - Bộ lọc tác giả (Author Filter) và nút tải thêm commit (Load More).
  - **Bảng kiểm tra chi tiết Commit (Commit Inspector Panel):**
    - Xem SHA đầy đủ, liên kết trực tiếp tới GitHub commit, thông tin author & committer, commit parents SHA, và cây file thay đổi (file tree).
  - **Khám phá Pull Requests (Pull Requests Explorer):**
    - Danh sách PR với bộ lọc trạng thái (`All`, `Open`, `Merged`, `Closed`).
    - Huy hiệu luồng nhánh nguồn ➔ đích (`headRef` ➔ `baseRef`), số lượng bình luận, trạng thái review, liên kết mở PR trên GitHub.
  - **Khám phá Branches & Tags (Branches & Tags Explorer):**
    - Danh sách các nhánh của repository, nhãn `default`, commit SHA mới nhất, thời gian cập nhật.
    - Nút 1-Click sao chép lệnh `git checkout <branch>` vào clipboard.
  - **Tổng quan Kho mã nguồn & Lệnh Clone (Repository Overview & Quick Clone):**
    - Thẻ thông tin repo: giấy phép (License), nhánh mặc định, ngày cập nhật, trạng thái Public/Private.
    - Hộp lệnh 1-Click sao chép lệnh clone HTTPS (`git clone https://...`) và SSH (`git clone git@...`).
- [x] **Mở rộng API Backend NestJS (`backend/src/github/`):**
  - Endpoint `GET /api/github/pulls?repo=owner/repo&state=all`: Truy xuất danh sách PR thật từ GitHub REST API kèm dữ liệu fallback an toàn.
  - Endpoint `GET /api/github/branches?repo=owner/repo`: Truy xuất danh sách branches thật từ GitHub REST API kèm dữ liệu fallback an toàn.
  - Tối ưu `GET /api/github/commits?repo=owner/repo`: Trả về danh sách full commit kèm `parents` SHA phục vụ dựng biểu đồ Git Graph.
- [x] **Tích hợp Điều hướng & Menu toàn hệ thống:**
  - Bổ sung menu **Repo Workspace** trong Sidebar (phân vùng Repositories).
  - Nút **Workspace** nhanh trên từng thẻ repository ở trang `All Projects` (`/app/projects/all-projects`).
  - Lệnh truy cập nhanh `Repo Workspace` trong Spotlight Command Palette (`⌘K`).

---

## 2. ⚡ NHỮNG VIỆC ĐANG LÀM (IN PROGRESS)

### A. Tinh chỉnh Responsive & Mobile Layout
- [ ] **Mobile Sidebar Drawer:**
  - Bổ sung nút hamburger menu và backdrop overlay khi xem trên màn hình điện thoại/tablet nhỏ hơn 768px.
- [ ] **Tối ưu hiển thị bảng Split-view trên thiết bị di động:**
  - Chuyển chế độ xem split-pane 1/3 - 2/3 ở trang Notes sang dạng tab chuyển đổi trên màn hình hẹp.

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
