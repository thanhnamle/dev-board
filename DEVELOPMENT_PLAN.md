# Kế hoạch phát triển DevBoard

Cập nhật: 05/09/2026. Đối chiếu tài liệu người dùng cung cấp với mã nguồn hiện tại.

## Hiện trạng xác minh

- Angular 17.3, standalone components, Signals, lazy routes và SSR đã có.
- Messages chưa có component/route trước đợt triển khai này; badge sidebar là số tĩnh.
- Backend trống; chưa có phiên đăng nhập và bảo vệ route thật.
- Nhiều màn hình là demo. Ví dụ All Snippets có 4 bản ghi, trong khi bộ đếm hiển thị 64. “100%” trong báo cáo không đồng nghĩa tính năng đã sẵn sàng production.
- `PROJECT_DOCUMENTATION.md` có thay đổi sẵn trong workspace; đợt này không sửa file đó.

## Đợt 1 — Messages Hub (hoàn thành)

- Route `/app/messages`, giao diện thích ứng kích thước màn hình, dùng biến theme hiện có.
- Dữ liệu mẫu có Mentions, Review requests, System alerts; tìm kiếm và lọc chưa đọc.
- Service Signals chung quản lý thread và badge sidebar; đọc từng thread hoặc đánh dấu tất cả đã đọc.
- Quick reply cục bộ, giữ bản nháp riêng mỗi thread khi chuyển qua lại trong trang; thông báo rõ không gửi lên GitHub.
- Đính kèm code từ cùng nguồn dữ liệu với All Snippets. System alerts chỉ đọc.
- Trạng thái sống trong bộ nhớ; reload sẽ reset. Liên kết mở inbox GitHub, vì thread mẫu không có PR thật.
- Tiêu chí nghiệm thu: route mở được, badge cập nhật ngay, bộ lọc kết hợp đúng, reply không rỗng và không lẫn thread, snippets không bị nhân bản dữ liệu, Angular biên dịch được cả client/server.

## Đợt 2 — Global Command Palette (hoàn thành)

- Tách dữ liệu Projects/Notes/Snippets sang service dùng chung và sửa bộ đếm lấy từ dữ liệu thật.
- Cmd/Ctrl+K và ô search sidebar mở dialog; điều hướng bằng phím mũi tên, Enter, Escape; quản lý focus và hỗ trợ bàn phím.
- Tìm route, repository, note và snippet; kết quả mở đúng bản ghi, có trạng thái không tìm thấy.

### Kết quả triển khai

- `Cmd/Ctrl + K` và cả hai trạng thái search sidebar mở dialog dùng chung; hỗ trợ Arrow Up/Down, Enter, Escape, focus ban đầu, focus trap và trả focus khi đóng.
- Tìm kiếm theo nhiều từ khóa trong page, project, note và snippet. Kết quả giới hạn 20 mục; trạng thái ban đầu hiển thị 12 lối tắt và có empty state.
- Kết quả bản ghi điều hướng kèm ID. Projects/Snippets lọc đúng bản ghi; Notes chọn đúng nội dung, kể cả khi component đang mở và query parameter thay đổi.
- Dữ liệu demo của Projects, Notes và Snippets đã tách khỏi component vào `core/data`, được quản lý bởi `WorkspaceDataService`. Messages cũng đọc snippets từ service này.
- Badge sidebar hiện phản ánh 6 projects, 5 notes, 4 snippets và trạng thái bookmark/star hiện tại. Bộ đếm ngôn ngữ Snippets được tính từ dữ liệu thay vì số mô phỏng.
- Development build đạt và prerender đủ 15 route. Karma/Brave headless đạt 13/13 test liên quan và 25/25 test toàn dự án; `git diff --check` đạt.

## Đợt 3 — Backend nền tảng và đăng nhập GitHub

- Đề xuất NestJS + PostgreSQL + Prisma để đồng bộ TypeScript. Chốt stack trước khi mở rộng backend.
- Xây backend trước phần trao đổi OAuth code: cấu hình môi trường, health endpoint, users và sessions.
- OAuth callback phía server, xác minh state; giữ client secret và GitHub token phía server; session cookie HttpOnly và bảo vệ thao tác ghi.
- Cần người dùng cung cấp cấu hình GitHub OAuth App và callback URL khi kết nối thật; không đưa secrets vào frontend hoặc git.
- AuthGuard dựa trên endpoint phiên; backend kiểm tra quyền cho từng API. Sau đó kết nối notifications thật, mapping PR và trạng thái lỗi/rate limit.

## Đợt 4 — Dữ liệu bền vững

- Schema users, notes, snippets, bookmarks; migration, validation và phân quyền theo chủ sở hữu.
- CRUD Notes/Snippets, tìm kiếm, yêu thích; thay demo bằng API có loading/error/empty states.
- Chỉ bổ sung gửi reply lên GitHub sau khi có xác thực và xử lý lỗi; hành động gửi phải do người dùng chủ động thực hiện.

## Đợt 5 — Vận hành

- Kiểm tra production build, xử lý stylesheet budgets hiện hữu; test các luồng chính và SSR.
- Docker Compose frontend/backend/PostgreSQL, health checks, CI build/test và tài liệu cấu hình.
- Chọn môi trường hosting rồi mới cấu hình deployment, migration và backup.

## Kiểm chứng đợt 1

- `npm run build -- --configuration development`: đạt, prerender 15 route, không còn lỗi trong log. Đã kiểm tra HTML `/app/messages` chứa tiêu đề và thông báo demo.
- Karma với Brave headless: 8/8 test đạt (Messages, All Snippets, AppComponent). Test bao phủ bộ lọc, unread count, draft riêng, snippet, validation và submit qua DOM với nội dung được escape.
- Đã sửa lỗi SSR có sẵn trong UserService do truy cập localStorage trên server; dữ liệu lưu lỗi/không hợp lệ trở về profile mặc định.
- Đã cập nhật test scaffold AppComponent vốn còn tham chiếu thuộc tính title đã xóa và làm cả bộ test không biên dịch được.
- `git diff --check`: đạt. Chưa chạy production build hoặc kiểm tra trực quan các kích thước màn hình; stylesheet budgets hiện hữu cần kiểm tra trong đợt vận hành.
- Chưa kết nối tài khoản hay triển khai dịch vụ bên ngoài.
