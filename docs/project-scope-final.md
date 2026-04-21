# Project Scope Final — IWS Final Project

## 1. Tên dự án
**StudyVault / Smart Knowledge System (IWS Final)**

Một hệ thống quản lý tài liệu học tập và nghiên cứu theo kiến trúc **RESTful API + frontend web tách biệt**, cho phép người dùng đăng ký tài khoản, quản lý thư mục và tài liệu, tìm kiếm tài liệu, đánh dấu yêu thích, xem chi tiết tài liệu, và tạo **AI Summary** cho tài liệu.

---

## 2. Mục tiêu học phần
Dự án phải đạt các tiêu chí chấm điểm cao nhất của môn IWS:

- Backend tách biệt, tuân thủ RESTful API
- Frontend tiêu thụ API độc lập
- CRUD đầy đủ cho entity chính
- Authentication hoàn chỉnh gồm:
  - Register
  - Login
  - Forgot Password
  - Reset Password
- Sorting + Pagination + Filtering phía server
- UI responsive, đồng bộ, chuyên nghiệp
- Security rõ ràng: validation, ownership check, rate limiting, strict CORS
- 1 tính năng nâng cao có giá trị thực tế: **AI Summary**

---

## 3. Scope cuối cùng được giữ

## 3.1. Core Features
### Authentication
- Register
- Login
- Logout
- Get Profile
- Forgot Password
- Reset Password

### Folder Management
- Create folder
- Read folder list/tree
- Update folder name
- Move folder
- Delete folder

### Document Management
- Upload document
- List documents
- View document detail
- Rename document
- Delete document
- Favorite / unfavorite
- Open / download document
- Assign document to folder

### Search / Retrieval
- Keyword search
- Semantic search (nếu backend hiện có ổn định)
- Related documents (nếu ổn định)

### AI Feature
- Generate document summary
- Refresh summary
- View summary in detail page

### Frontend UX
- Responsive layout
- Empty / loading / error states
- Confirm dialogs
- Toast / success feedback
- Search, filter, sort, pagination controls

---

## 4. Scope bị loại khỏi core demo
Các mục sau **không còn là tính năng trọng tâm** để tránh phân tán công sức và giảm rủi ro demo:

- Mindmap
- Diagram generation
- AI chat nhiều mode
- Các trang AI showcase quá nặng về hiệu ứng
- Landing page marketing quá cầu kỳ không phục vụ rubric

> Nếu các phần này còn tồn tại trong codebase, chúng chỉ được coi là **bonus / legacy / optional**, không được làm chậm tiến độ của core scope.

---

## 5. Entity chính của hệ thống
- User
- PasswordResetToken (hoặc entity tương đương)
- Folder
- Document
- UserDocument / ownership relation
- Summary artifact / summary cache (nếu dùng)

---

## 6. User flows chính phải demo được

### Flow A — Authentication
1. User đăng ký
2. User đăng nhập
3. User vào workspace
4. User quên mật khẩu
5. User nhận reset token / link
6. User đặt lại mật khẩu thành công

### Flow B — Workspace CRUD
1. User tạo folder
2. User upload tài liệu
3. User xem danh sách tài liệu
4. User đổi tên tài liệu
5. User di chuyển tài liệu vào folder
6. User xóa tài liệu hoặc folder

### Flow C — Retrieval
1. User tìm kiếm tài liệu
2. User dùng sort / filter / pagination
3. User mở document detail
4. User đánh dấu favorite

### Flow D — AI Summary
1. User mở detail tài liệu
2. User bấm generate summary
3. Hệ thống trả về summary
4. User refresh summary nếu cần

---

## 7. Chỉ tiêu chất lượng bắt buộc

### Backend
- RESTful API rõ ràng, đúng HTTP methods
- DTO validation đầy đủ
- Protected routes bằng JWT
- Ownership check cho tài nguyên riêng tư
- Pagination + sorting ở các endpoint trả danh sách
- Filtering động ở document list
- Rate limiting cho các endpoint nhạy cảm
- Strict CORS cấu hình theo môi trường

### Frontend
- React + TypeScript + Tailwind + motion + lucide-react
- Tách component hợp lý
- Không hard-code UI ngẫu hứng ngoài rule
- Đồng bộ design system
- Mobile-first
- Không để page file quá phình to

---

## 8. Non-goals
Các mục sau **không phải mục tiêu bắt buộc** của bản final:

- Mô phỏng mạng xã hội tài liệu
- Realtime collaboration
- AI đa agent
- OCR nâng cao
- Full text editor trong trình duyệt
- Mobile app native

---

## 9. Định nghĩa “xong” cho toàn project
Project được coi là khóa scope thành công khi:

- Tất cả thành viên chỉ bám core scope này
- Không thêm tính năng ngoài danh sách đã chốt
- Mọi phase code về sau phải đối chiếu tài liệu này
- Frontend refactor chỉ phục vụ hệ thống trong scope này

---

## 10. Chốt cuối
Từ thời điểm này, hệ thống sẽ được triển khai theo hướng:

**Ít tính năng hơn, nhưng đúng rubric hơn, sạch hơn, ổn định hơn, dễ bảo vệ hơn, và chuyên nghiệp hơn.**
