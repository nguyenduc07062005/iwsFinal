# Implementation Roadmap — StudyVault (IWS Final)

## Mục tiêu tổng
Refactor và hoàn thiện dự án theo hướng:
- đúng rubric IWS
- UI chuyên nghiệp, đồng bộ, premium
- backend/frontend tách biệt rõ
- dễ demo, dễ bảo vệ, ít rủi ro

---

## Phase 0 — Freeze Architecture & Scope
### Mục tiêu
Khóa toàn bộ scope, route map, component map, và nguyên tắc làm việc.

### Việc làm
- Chốt scope cuối cùng
- Chốt route map
- Chốt component map
- Chốt tính năng loại bỏ khỏi core demo
- Chốt phase roadmap

### Deliverables
- `docs/project-scope-final.md`
- `docs/frontend-route-map.md`
- `docs/frontend-component-map.md`
- `docs/implementation-roadmap.md`

### Definition of Done
- Không thêm tính năng ngoài scope
- Mọi phase sau bám đúng tài liệu

---

## Phase 1 — Frontend Foundation
### Mục tiêu
Dựng bộ xương UI chuẩn theo `QUY_TAC_FRONTEND.md`.

### Frontend tasks
- Tạo cấu trúc thư mục chuẩn mới
- Tạo `cn()` utility
- Tạo base tokens / constants
- Tạo UI components nền:
  - AppButton
  - AppInput
  - AppCard
  - AppModal
  - AppPagination
  - AppEmptyState
  - AppSkeleton
- Tạo layout nền:
  - PublicLayout
  - AuthLayout
  - AppShell
  - DetailLayout

### Output
- Frontend có design system thật
- UI không còn lệch style giữa các page

### Definition of Done
- Có thể dựng page mới chỉ bằng layout + base components

---

## Phase 2 — Router & Layout Refactor
### Mục tiêu
Chuẩn hóa định tuyến toàn frontend.

### Tasks
- Refactor `App.tsx`
- Tách router ra `app/router`
- Gắn các route theo route map
- Tạo protected route guard
- Tạo redirect rules

### Output
- Route rõ ràng, sạch, dễ demo

---

## Phase 3 — Authentication Full Flow
### Mục tiêu
Đạt trọn yêu cầu Merit về authentication.

### Backend tasks
- Register
- Login
- Get Profile
- Forgot Password
- Reset Password
- JWT protected routes
- Password hashing
- Reset token expiry

### Frontend tasks
- Login page
- Register page
- Forgot Password page
- Reset Password page
- Error/loading/success states

### Output
- Full auth flow hoàn chỉnh

---

## Phase 4 — Workspace CRUD
### Mục tiêu
Hoàn thiện CRUD thật sự cho folder và document.

### Backend tasks
- Folder CRUD + move
- Document upload/list/detail/update/delete
- Favorite toggle

### Frontend tasks
- Workspace page
- Folder tree / panel
- Document list
- Upload modal
- Rename modal
- Delete dialog
- Favorite actions

### Output
- App có flow quản lý tài liệu hoàn chỉnh

---

## Phase 5 — Sorting / Pagination / Filtering
### Mục tiêu
Tăng điểm kỹ thuật theo rubric.

### Backend tasks
- Server-side pagination
- Server-side sorting
- Dynamic filtering

### Frontend tasks
- SearchBar
- SortControl
- FilterBar
- Pagination bar

### Output
- Danh sách tài liệu đủ chuẩn chấm điểm cao

---

## Phase 6 — Document Detail + Summary
### Mục tiêu
Giữ 1 AI feature mạnh, ít rủi ro.

### Tasks
- Refactor detail page
- File preview
- Metadata section
- Summary panel
- Summary loading/error/retry states

### Output
- AI Summary trở thành điểm cộng của dự án

---

## Phase 7 — Security & Quality Polish
### Mục tiêu
Đẩy dự án lên mức Excellent.

### Backend tasks
- Strict CORS
- Rate limiting
- Ownership check toàn bộ
- DTO validation hoàn chỉnh
- Upload hardening

### Frontend tasks
- Session expiry UX
- Unauthorized redirect
- Consistent error feedback
- Form validation polish

### Output
- Có thể giải thích rõ security khi defense

---

## Phase 8 — Testing, Deploy, Docs, Defense
### Mục tiêu
Khóa điểm bằng tính chuyên nghiệp.

### Tasks
- Backend tests cho auth / CRUD / protected routes
- Frontend smoke checklist
- README final
- Postman collection
- `.env.example`
- Docker compose nếu kịp
- Screenshot evidence cho personal report
- Demo script / defense notes

### Output
- Project dễ chạy, dễ nộp, dễ thuyết trình

---

## Ưu tiên tuyệt đối
### Bắt buộc xong
1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5

### Rất nên xong
7. Phase 6
8. Phase 7

### Khóa điểm
9. Phase 8

---

## Chốt hướng triển khai
- Ít tính năng hơn nhưng đúng rubric hơn
- Giữ Summary, loại Mindmap khỏi core
- Tập trung vào auth + CRUD + sorting/pagination/filtering + security + responsive UI
- Code theo rule, không code tự do
