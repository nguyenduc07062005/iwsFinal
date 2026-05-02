# Frontend Route Map — StudyVault

## 1. Mục tiêu
Tài liệu này chốt toàn bộ route frontend sau refactor. Mọi page mới phải bám đúng route map này.

---

## 2. Nguyên tắc định tuyến
- Route rõ ràng, dễ demo
- Tách route public và protected
- Không để route marketing / AI showcase lấn át route nghiệp vụ
- Dùng layout riêng cho từng nhóm route

---

## 3. Layout chuẩn

## 3.1. Public Layout
Dùng cho các route công khai:
- `/`

## 3.2. Auth Layout
Dùng cho:
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

## 3.3. App Shell Layout
Dùng cho route protected chính:
- `/app`
- `/app/favorites`
- `/profile`

Bao gồm:
- top navigation / header
- workspace container
- sidebar hoặc secondary panel nếu cần

## 3.4. Detail Layout
Dùng cho:
- `/app/documents/:documentId`

Bao gồm:
- document toolbar
- preview area
- summary panel
- responsive behavior cho màn hẹp

---

## 4. Route map cuối cùng

| Route | Access | Layout | Mục đích |
|------|--------|--------|---------|
| `/` | Public | PublicLayout | Landing / giới thiệu ngắn gọn hệ thống |
| `/login` | Public | AuthLayout | Đăng nhập |
| `/register` | Public | AuthLayout | Đăng ký |
| `/forgot-password` | Public | AuthLayout | Gửi yêu cầu quên mật khẩu |
| `/reset-password` | Public | AuthLayout | Đặt lại mật khẩu |
| `/app` | Protected | AppShell | Workspace dashboard / document library |
| `/app/favorites` | Protected | AppShell | Danh sách tài liệu yêu thích |
| `/app/documents/:documentId` | Protected | DetailLayout | Chi tiết tài liệu + preview + summary |
| `/profile` | Protected | AppShell | Thông tin người dùng |
| `/admin` | Protected admin | AppShell | Admin dashboard, user status, audit logs |

---

## 5. Route tạm loại bỏ khỏi core
Các route sau không nằm trong core demo sau refactor:

- `/subjects`
- `/collections`
- các route AI showcase riêng
- route mindmap riêng

> Nếu cần giữ code cũ để tham khảo, phải tách khỏi luồng routing chính.

---

## 6. Redirect rules
- Nếu user chưa đăng nhập mà vào route protected → redirect `/login`
- Nếu user đã đăng nhập và vào `/login` hoặc `/register` → có thể redirect `/app`
- Route không hợp lệ → redirect về `/` hoặc `/app` tùy trạng thái auth

---

## 7. Route-level responsibilities

### `/`
- chỉ giới thiệu ngắn, không quá nặng animation
- CTA rõ ràng vào login / workspace

### `/login`
- form login
- link sang register / forgot password

### `/register`
- form register
- link sang login

### `/forgot-password`
- email form
- success state rõ ràng

### `/reset-password`
- token validation state
- new password + confirm password

### `/app`
- folder tree / sidebar
- document list
- upload action
- sort / filter / search / pagination

### `/app/favorites`
- list favorite documents
- same controls as list page nếu cần

### `/app/documents/:documentId`
- preview file
- metadata
- summary panel
- rename/favorite/download/open actions

### `/profile`
- profile info cơ bản
- logout action

---

## 8. Navigation chuẩn
Primary nav:
- Home / Workspace
- Favorites
- Profile
- Admin, only when the current user has role `admin`

Secondary actions:
- Upload
- Create folder
- Search
- Filter

Responsive navigation:
- Below `1024px`, `ShellHeader` keeps a compact top bar and uses bottom navigation for primary routes.
- From `1024px`, primary navigation is centered in the top header.
- Detail/document routes stack preview and assistant below `1280px`; split view is only for wide desktop.

---

## 9. Định nghĩa “xong” cho route map
Route map được coi là khóa khi:
- frontend router bám đúng tài liệu này
- không phát sinh route ngoài scope nếu chưa được bổ sung bằng docs
- toàn bộ page refactor đều map được vào route tương ứng
