# 📘 Tài Liệu Kỹ Thuật Dự Án DevBoard (Project Documentation)

> **Tên dự án:** DevBoard (Developer Workspace & Internal Tooling)  
> **Khách hàng / Phạm vi:** Công cụ nội bộ (Internal Tools) dành cho lập trình viên  
> **Nền tảng chính:** Angular 17+ (Standalone Components, SSR, Signals)  
> **Ngày cập nhật:** Tháng 09/2026  

---

## 1. 🎯 Tổng Quan Dự Án (Project Overview)

**DevBoard** là nền tảng không gian làm việc tập trung (All-in-one Developer Dashboard & Workspace) được thiết kế đặc thù cho các kỹ sư phần mềm. Dự án giải quyết bài toán phân mảnh công cụ hàng ngày bằng cách tích hợp quản lý mã nguồn, ghi chú kỹ thuật, kho lưu trữ code mẫu (snippets) và theo dõi tiến độ dự án vào một giao diện trực quan, tối giản và hiện đại.

### Mục tiêu cốt lõi:
* **Tích hợp hệ sinh thái GitHub:** Đồng bộ trực tiếp repositories, commits, branches, và issues.
* **Quản lý dự án cá nhân & nhóm (Projects Hub):** Theo dõi danh sách dự án, bookmark và đánh dấu sao (starred) các repository quan trọng.
* **Ghi chú & Tài liệu hóa (Developer Notes):** Hỗ trợ viết ghi chú kỹ thuật dạng Markdown gắn liền với từng tag và dự án.
* **Kho lưu trữ Code Snippets:** Lưu và tái sử dụng các đoạn code chuẩn (best practices, regex, helper functions).
* **Đăng nhập một chạm (Single Sign-On):** Tối ưu hóa cho internal tools thông qua GitHub OAuth Authentication.

---

## 2. 🏛️ Kiến Trúc Kỹ Thuật (Architecture & Tech Stack)

Hệ thống được thiết kế theo mô hình tách biệt Frontend và Backend (Decoupled Client-Server), sẵn sàng mở rộng thành Monorepo hoặc Microservices.

```mermaid
graph TD
    User([Người dùng / Lập trình viên]) -->|Truy cập HTTP/HTTPS| Client[Frontend: Angular 17 SSR]
    
    subgraph Frontend [Angular 17 Client Workspace]
        Router[Angular Router]
        Router --> PublicFlow[Public Route: Landing & Auth Card]
        Router --> AuthFlow[Authenticated App Flow: /app]
        
        AuthFlow --> Layout[Main Layout & Collapsible Sidebar]
        Layout --> DashModule[Dashboard: Overview / Analytics]
        Layout --> ProjModule[Projects: All / Bookmarks / Starred]
        Layout --> NoteModule[Notes: All Notes / Tags]
        Layout --> SnipModule[Snippets: All Snippets / Favorites]
    end

    subgraph External [Dịch vụ bên ngoài]
        GitHubOAuth[GitHub OAuth 2.0 API]
    end

    PublicFlow -.->|Authenticate| GitHubOAuth
    GitHubOAuth -.->|Redirect Token| AuthFlow
    
    subgraph Backend [Backend Service (Đang mở rộng)]
        BackendAPI[REST / GraphQL Services]
        Database[(Database: Postgres / Mongo)]
        BackendAPI --- Database
    end

    AuthFlow -.->|REST API Calls| BackendAPI
```

### Chi tiết Tech Stack:
| Thành phần | Công nghệ / Thư viện | Vai trò & Đặc điểm |
| :--- | :--- | :--- |
| **Frontend Framework** | `Angular 17.3+` | Standalone Components, cú pháp Control Flow mới (`@if`, `@for`), Angular Signals |
| **Server-Side Rendering**| `@angular/ssr` + `Express` | Hỗ trợ SSR và Prerendering, tăng tốc độ tải trang ban đầu và tối ưu SEO |
| **UI Iconography** | `lucide-angular` | Bộ icon SVG tối giản, hiện đại và đồng bộ phong cách thiết kế |
| **Typography & Styling**| `Inter Font` + Modern CSS | Hỗ trợ Flexbox, CSS Grid, Glassmorphism, hiệu ứng chuyển động mượt mà |
| **Quản lý trạng thái** | `Angular Signals` (`signal`) | Quản lý state phản ứng (reactive), không phụ thuộc vào `BehaviorSubject` cồng kềnh |
| **Backend (Target)** | RESTful API / Node.js / .NET | Đang sẵn sàng thư mục `backend/` để kết nối cơ sở dữ liệu và xử lý nghiệp vụ |

---

## 3. 📂 Cấu Trúc Thư Mục Dự Án (Directory Structure)

```text
AngularProject/
├── PROJECT_DOCUMENTATION.md         # Tài liệu kỹ thuật dự án (File hiện tại)
├── backend/                         # Thư mục chứa mã nguồn Backend (chuẩn bị kết nối API)
└── frontend/                        # Mã nguồn Frontend (Angular 17)
    ├── package.json                 # Quản lý dependencies và scripts
    ├── angular.json                 # Cấu hình Angular workspace & build
    ├── tsconfig.json                # Cấu hình TypeScript compiler
    ├── server.ts                    # Entry-point cho Express SSR Server
    └── src/
        ├── index.html               # Trang HTML gốc của ứng dụng
        ├── styles.css               # Global styles (CSS reset, font Inter, nền chung)
        ├── main.ts                  # Bootstrap ứng dụng Angular Client
        ├── main.server.ts           # Bootstrap ứng dụng Server SSR
        ├── assets/                  # Tài nguyên tĩnh (Hình ảnh, logo devboard_logo.jpg)
        └── app/
            ├── app.component.*      # Root component (`<router-outlet></router-outlet>`)
            ├── app.routes.ts        # Quản trị định tuyến (Routing Configuration)
            ├── app.config.ts        # Application providers (Router, SSR Client Hydration)
            │
            ├── layout/              # Khung giao diện dùng chung
            │   ├── main-layout/     # Khung chính cho các trang bên trong (`sidebar` + `content`)
            │   └── sidebar/         # Thanh menu bên trái (collapsible, submenus, profile)
            │
            └── pages/               # Các trang giao diện chức năng
                ├── landing/         # Trang Landing Page kết hợp Login Auth Card
                ├── dashboard/       # Bảng điều khiển
                │   ├── overview/    # Tổng quan dự án và hoạt động
                │   └── analytics/   # Thống kê chi tiết, biểu đồ hiệu suất
                ├── projects/        # Quản lý repositories
                │   ├── all-projects/# Tất cả dự án đang tham gia
                │   ├── bookmarks/   # Dự án đã đánh dấu
                │   └── starred/     # Dự án được gắn sao
                ├── notes/           # Quản lý ghi chú cá nhân & kỹ thuật
                │   ├── all-notes/   # Danh sách toàn bộ ghi chú
                │   └── tags/        # Phân loại ghi chú theo chuyên mục/tag
                └── snippets/        # Quản lý mã nguồn mẫu
                    └── all-snippets/# Kho snippet tái sử dụng
```

---

## 4. 🧭 Hệ Thống Định Tuyến (Routing & Navigation)

Hệ thống điều hướng được cấu hình tại [frontend/src/app/app.routes.ts](file:///d:/Coding/Computer%20Science/Personal%20Project/PayooWork/AngularProject/frontend/src/app/app.routes.ts), chia thành 2 luồng truy cập:

### 4.1. Bảng Ánh Xạ Đường Dẫn (Route Mapping)

| Đường dẫn (URL Path) | Component đảm nhiệm | Chế độ | Chức năng chính |
| :--- | :--- | :---: | :--- |
| `/` | `LandingComponent` | Public | Giới thiệu dự án, tính năng GitHub Integration và Card Đăng nhập |
| `/login` | *Redirect về `/`* | Public | Chuyển hướng về trang đăng nhập thống nhất |
| `/app` | `MainLayoutComponent` | Auth | Khung layout chính (Tự chuyển hướng mặc định về `dashboard/overview`) |
| `/app/dashboard/overview` | `OverviewComponent` | Auth | Trang tổng quan chỉ số, hoạt động gần đây |
| `/app/dashboard/analytics`| `AnalyticsComponent`| Auth | Báo cáo phân tích tốc độ phát triển |
| `/app/projects/all-projects`| `AllProjectsComponent`| Auth | Danh mục toàn bộ các repository được kết nối |
| `/app/projects/bookmarks`| `BookmarksComponent` | Auth | Các dự án được bookmark để truy cập nhanh |
| `/app/projects/starred` | `StarredComponent`   | Auth | Các kho mã nguồn ưa thích |
| `/app/notes/all-notes`   | `AllNotesComponent`  | Auth | Trình soạn thảo và danh sách ghi chú dev |
| `/app/notes/tags`        | `TagsComponent`      | Auth | Lọc và quản lý ghi chú theo nhãn |
| `/app/snippets/all-snippets`| `AllSnippetsComponent`| Auth | Thư viện code snippets theo ngôn ngữ |
| `**` (Wildcard)          | *Redirect về `/`*    | - | Bắt lỗi 404 và quay về trang chủ |

---

## 5. 🧩 Chi Tiết Các Thành Phần Chính (Core Components)

### 5.1. Trang Landing & Authentication (`LandingComponent`)
* **Đặc điểm:** Tối giản, tập trung vào trải nghiệm internal tool.
* **Cấu trúc:**
  1. **Sidebar Mini (Bên trái):**
     * Logo DEV BOARD đóng khung màu tối tạo sự chuyên nghiệp.
     * Menu điều hướng các tab nội dung: `Home`, `Features`, `About Us`, `Docs`.
     * Footer liên kết trực tiếp tới GitHub.
  2. **Hero Section (Nội dung chính):**
     * Tiêu đề lớn **GitHub Integration**.
     * Giới thiệu các giá trị mang lại cho đội ngũ kỹ thuật: Đồng bộ repo, gắn snippet, bảo mật nội bộ.
  3. **Auth Card (Khối đăng nhập bên phải):**
     * Thiết kế card trắng nổi bật trên nền xám nhạt (`#cacdd2`), bo góc lớn và đổ bóng mềm.
     * Avatar Mascot GitHub dạng tối giản.
     * Nút bấm **Continue with GitHub** với hiệu ứng hover và điều hướng thẳng vào `/app`.

### 5.2. Thanh Điều Hướng Đa Năng (`SidebarComponent`)
* **Đặc điểm:** 
  * Quản lý trạng thái thu gọn/mở rộng bằng Signal (`collapsed = signal(false)`).
  * Hỗ trợ Accordion menu lồng nhau (Submenu cho Dashboard, Projects, Notes, Snippets, GitHub).
  * Tích hợp khối thông tin User Profile ở chân trang (`name`, `role`, `avatarUrl`).
  * Sử dụng các icon chuyên biệt từ `lucide-angular`: `LayoutGrid`, `Folder`, `NotebookPen`, `Code2`, `Github`, `Search`,...

### 5.3. Khung Ứng Dụng Chính (`MainLayoutComponent`)
* **Đặc điểm:** Sử dụng thẻ `<app-sidebar>` cố định bên trái và vùng hiển thị linh hoạt `<main class="main-content"><router-outlet></router-outlet></main>` giúp chuyển đổi giữa các module mà không cần tải lại toàn trang.

---

## 6. 🚀 Hướng Dẫn Cài Đặt & Vận Hành (Getting Started)

### 6.1. Yêu cầu môi trường
* **Node.js:** Phiên bản `>= 18.13.0` hoặc `>= 20.9.0`
* **npm:** Phiên bản `>= 9.x`
* **Angular CLI:** Khuyến nghị cài đặt toàn cục:
  ```powershell
  npm install -g @angular/cli@17
  ```

### 6.2. Cài đặt thư viện dependencies
Di chuyển vào thư mục frontend và cài đặt các gói cần thiết:
```powershell
cd "d:\Coding\Computer Science\Personal Project\PayooWork\AngularProject\frontend"
npm install
```

### 6.3. Khởi chạy môi trường phát triển (Development Server)
```powershell
npm start
# Hoặc chạy thông qua Angular CLI:
ng serve
```
* Mở trình duyệt và truy cập: `http://localhost:4200/`
* Tính năng Hot Reload (Live Reload) sẽ tự động kích hoạt khi có thay đổi code.

### 6.4. Đóng gói bản phát hành (Production Build)
```powershell
npm run build
```
* Kết quả build sẽ được xuất ra thư mục: `frontend/dist/frontend/`
  * `dist/frontend/browser/`: Chứa các bundle tĩnh dành cho Client.
  * `dist/frontend/server/`: Chứa các bundle phục vụ Server-Side Rendering (Node/Express).

---

## 7. 📋 Kế Hoạch Phát Triển Tiếp Theo (Roadmap)

- [x] Thiết lập khung xương dự án Monorepo (`frontend` & `backend`).
- [x] Xây dựng hệ thống routing 2 luồng (Public Landing & Authenticated App).
- [x] Hoàn thiện Sidebar điều hướng có thể thu gọn với đầy đủ các mục chức năng.
- [x] Thiết kế giao diện Landing Page kết hợp Login Auth Card.
- [ ] **Giai đoạn 1 (Frontend UI/UX):**
  - Xây dựng giao diện trang `Dashboard Overview` (Thống kê số lượng commits, repo đang theo dõi).
  - Xây dựng giao diện trang `Notes` (Trình soạn thảo Markdown, gắn tag màu sắc).
  - Xây dựng trang `Snippets` (Hiển thị code block có syntax highlighting và nút copy nhanh).
- [ ] **Giai đoạn 2 (Backend & Authentication):**
  - Cấu hình GitHub OAuth App trên GitHub Developer Settings để lấy `Client ID` & `Client Secret`.
  - Viết API xử lý OAuth Callback tại `backend/` và cấp phát JWT token.
- [ ] **Giai đoạn 3 (Database & State Management):**
  - Thiết kế lược đồ cơ sở dữ liệu lưu trữ User, Notes, Snippets.
  - Viết Angular Services tích hợp `HttpClient` để gọi API Backend.
