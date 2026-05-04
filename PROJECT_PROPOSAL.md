# StudyVault Project Proposal And Team Guide

## 1. Tổng Quan Dự Án

**Tên dự án:** StudyVault

**Loại sản phẩm:** Web application quản lý tài liệu học tập cho sinh viên

**Cập nhật lần cuối:** 2026-05-02, đồng bộ với codebase mới nhất sau đợt sửa bug backend/frontend và refresh UI/UX.

**Bối cảnh:** Trong quá trình học, sinh viên thường phải lưu nhiều loại tài liệu như slide, đề cương, tài liệu tham khảo, báo cáo, bài tập lớn, và ghi chú môn học. Nếu chỉ lưu file rời rạc trong máy tính hoặc Google Drive, việc tìm lại tài liệu, tổ chức theo môn học, và trích xuất nội dung học tập sẽ rất mất thời gian.

StudyVault được xây dựng để giải quyết bài toán đó bằng cách kết hợp:

- quản lý tài liệu có cấu trúc
- tổ chức theo thư mục
- tìm kiếm và lọc dữ liệu có hệ thống
- AI summary
- AI hỏi đáp trên nội dung tài liệu

Mục tiêu của dự án là một **sản phẩm web thật** mà sinh viên có thể đăng nhập và sử dụng trực tiếp để quản lý tài nguyên học tập. Landing page hiện tại được giữ lại như màn hình giới thiệu sản phẩm công khai, còn luồng chính để chấm điểm và demo vẫn là workspace sau đăng nhập.

## 2. Mục Tiêu Dự Án

### 2.1. Mục tiêu nghiệp vụ

- Giúp sinh viên lưu trữ tài liệu học tập một cách gọn gàng.
- Giúp sinh viên tìm lại tài liệu nhanh bằng từ khóa, bộ lọc, và sắp xếp.
- Giúp sinh viên đọc nhanh nội dung tài liệu nhờ AI summary.
- Giúp sinh viên khai thác thông tin từ tài liệu bằng chức năng hỏi đáp theo ngữ cảnh.

### 2.2. Mục tiêu kỹ thuật

- Xây dựng hệ thống frontend và backend tách riêng để gọi API rõ ràng.
- Tuân theo hướng RESTful API.
- Áp dụng xác thực JWT.
- Hỗ trợ CRUD tài liệu và thư mục đầy đủ.
- Có phân trang, lọc, sắp xếp từ phía server.
- Có xử lý lỗi, CORS, validation, rate limit ở mức đủ để trình bày trong defense.

## 3. Đối Tượng Sử Dụng

- Sinh viên đại học hoặc cao đẳng
- Người cần quản lý tài liệu học tập theo môn học
- Người muốn có một workspace để upload, phân loại, đọc nhanh, và khai thác tài liệu bằng AI

## 4. Phạm Vi Chức Năng

## 4.1. Chức năng đã có trong sản phẩm

### Authentication

- Đăng ký tài khoản
- Xác thực email và hoàn tất đăng ký bằng verification token
- Đăng nhập
- Xem thông tin cá nhân
- Quên mật khẩu
- Đặt lại mật khẩu bằng token có hạn dùng
- Đổi mật khẩu trong profile
- Logout phiên hiện tại và logout tất cả phiên
- Route bảo vệ bằng JWT
- Refresh session bằng HttpOnly cookie và CSRF token
- Xử lý session hết hạn và redirect lịch sự

### Workspace

- Landing page công khai tại `/`
- Vào màn hình chính tại `/app`
- Chọn thư mục hiện hành
- Xem danh sách tài liệu trong thư mục
- Tải tài liệu lên
- Tìm kiếm theo từ khóa
- Lọc theo loại tệp
- Sắp xếp theo:
  - thời gian tạo
  - thời gian cập nhật
  - tên
  - dung lượng
- Chuyển đổi chế độ xem danh sách hoặc lưới
- Đánh dấu yêu thích
- Phân trang dữ liệu từ backend

### Folder Management

- Tạo thư mục
- Đổi tên thư mục
- Di chuyển thư mục
- Xóa thư mục
- Duyệt cây thư mục theo cấu trúc phân cấp

### Document Management

- Upload tài liệu
- Upload cùng file ở nhiều folder khác nhau
- Chặn upload cùng một file hai lần trong cùng một folder
- Cho phép upload lại file vào folder cũ sau khi bản trong folder đó đã bị xóa
- Đổi tên tài liệu
- Di chuyển tài liệu sang thư mục khác
- Xóa tài liệu
- Tải file gốc về máy
- Xem chi tiết tài liệu
- Đánh dấu yêu thích hoặc bỏ yêu thích

### Document Detail

- Xem preview tài liệu nếu có thể render
- Có fallback khi preview không khả dụng
- Hiển thị metadata
- Ghi chú học tập theo từng tài liệu
- Sinh tóm tắt AI
- Hỏi đáp theo tài liệu
- Xem tài liệu liên quan

### Favorites

- Trang riêng để xem tài liệu yêu thích
- Có tìm kiếm, lọc, sắp xếp, phân trang tương tự workspace chính

## 4.2. Chức năng không còn là luồng frontend trọng tâm

- Diagram không nằm trong luồng frontend chính
- Các trang AI showcase riêng không nằm trong router chính

Lý do:

- không phục vụ trực tiếp cho phần chấm điểm chính
- làm tăng độ phức tạp giao diện
- tăng rủi ro demo
- làm bundle frontend nặng không cần thiết

Landing page không bị loại bỏ. Route `/` hiện là landing page công khai, được thiết kế lại để có tương phản tốt hơn và điều hướng rõ vào sign in/sign up/workspace.

## 5. Kiến Trúc Hệ Thống

## 5.1. Kiến trúc tổng thể

StudyVault sử dụng kiến trúc full-stack tách frontend và backend:

```text
Frontend React (studyVault-frontend)
        |
        | HTTP / JSON
        v
Backend NestJS (studyVault-backend)
        |
        | TypeORM
        v
PostgreSQL
        |
        +-- bảng user
        +-- bảng user_session
        +-- bảng folder
        +-- bảng document
        +-- bảng user_document / favorite / folder relation
        +-- bảng tag / note
        +-- bảng chunk / ask history / artifact cache
        +-- bảng admin audit log
```

## 5.2. Frontend

Frontend chịu trách nhiệm:

- hiển thị giao diện
- quản lý route
- gọi API backend
- hiển thị loading, empty, error state
- điều phối trải nghiệm người dùng

Frontend được viết bằng:

- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Motion
- React Hot Toast
- React Markdown

## 5.3. Backend

Backend chịu trách nhiệm:

- xác thực người dùng
- quản lý dữ liệu người dùng
- quản lý thư mục
- quản lý tài liệu
- upload file
- xử lý query params cho search/filter/sort/pagination
- sinh summary và hỏi đáp AI
- validation, CORS, rate limit, error handling

Backend được viết bằng:

- NestJS
- TypeORM
- PostgreSQL
- JWT
- class-validator
- HttpOnly refresh cookie và CSRF token
- Nodemailer
- Google Gemini

## 6. Cấu Trúc Repo

```text
projectfinal/
├── studyVault-backend/
│   ├── src/
│   │   ├── common/
│   │   ├── database/
│   │   ├── modules/
│   │   │   ├── authentication/
│   │   │   ├── admin/
│   │   │   ├── document/
│   │   │   ├── folder/
│   │   │   ├── tag/
│   │   │   └── rag/
│   │   └── main.ts
│   ├── test/
│   └── README.md
├── studyVault-frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.jsx
│   └── README.md
├── docs/
├── PROJECT_PROPOSAL.md
└── README.md
```

## 7. Backend Module Breakdown

## 7.1. Authentication Module

Module này xử lý:

- `POST /auth/register`
- `POST /auth/complete-registration`
- `POST /auth/resend-verification`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/profile`
- `PATCH /auth/profile`
- `PATCH /auth/password`

Các điểm chính:

- dùng JWT cho access token
- reset password có token riêng với TTL
- refresh token lưu trong HttpOnly cookie
- refresh/logout dùng CSRF token qua `X-CSRF-Token`
- backend có thể trả token reset trong mode test/local nếu bật `AUTH_RETURN_RESET_TOKEN`, nhưng production không cho bật biến này

## 7.2. Folder Module

Module này xử lý:

- tạo thư mục
- sửa thư mục
- di chuyển thư mục
- xóa thư mục
- lấy cây thư mục
- gán hoặc gỡ document khỏi folder

## 7.3. Document Module

Module này xử lý:

- upload file
- lấy danh sách tài liệu
- xem chi tiết tài liệu
- đổi tên tài liệu
- đánh dấu yêu thích
- tải file
- xóa tài liệu

Ngoài ra module này còn hỗ trợ các query params chấm điểm mạnh:

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `folderId`
- `favorite`
- `type`
- `keyword`

## 7.4. RAG Module

Module này đang phục vụ production flow cho:

- `summary`
- `ask document`
- `related document` thông qua document module
- backend endpoint `diagram`

Flow AI hiện tại:

1. tài liệu được upload
2. backend trích text
3. backend tạo chunk
4. AI xử lý theo context tài liệu
5. trả summary hoặc answer về frontend

## 8. Frontend Module Breakdown

## 8.1. Routing

Các route chính:

- `/`
- `/login`
- `/register`
- `/verify-email`
- `/complete-registration`
- `/forgot-password`
- `/reset-password`
- `/app`
- `/app/favorites`
- `/app/documents/:id`
- `/profile`
- `/admin`

Lưu ý:

- `/` là landing page công khai.
- Auth routes là guest-only; user đã có session hợp lệ sẽ được đưa về `/app`.
- Route không hợp lệ sẽ redirect về `/app` nếu đã đăng nhập, hoặc `/` nếu chưa đăng nhập.

## 8.2. Layouts

Frontend có các layout chính:

- `AuthLayout`
- `AppShell`
- `DetailLayout`

Mục tiêu của việc tách layout:

- auth flow tách biệt khỏi workspace
- workspace có header điều hướng riêng
- document detail có không gian hiển thị riêng

## 8.3. Components

Frontend có các nhóm component chính:

- `components/ui`: các primitive dùng lại
- `components/navigation`: header, nav
- `components/folders`: panel thư mục
- `components/workspace`: document list, modals
- `components/documents`: upload, preview, các block cho tài liệu
- `components/system`: error boundary, route fallback

## 9. Luồng Dữ Liệu Chính

## 9.1. Upload tài liệu

1. User mở upload modal
2. Chọn file
3. Frontend gửi request upload lên backend
4. Backend validate loại file và kích thước
5. Backend lưu file, tạo record document
6. Frontend refresh danh sách và cây thư mục

## 9.2. Tìm kiếm và lọc

1. User nhập từ khóa hoặc chọn loại file
2. Frontend cập nhật query params
3. Frontend gọi lại endpoint danh sách tài liệu
4. Backend xử lý filter/sort/pagination ở server
5. Frontend render lại dữ liệu và metadata phân trang

## 9.3. Summary

1. User mở trang chi tiết tài liệu
2. Frontend gọi summary endpoint
3. Backend tổng hợp nội dung và gọi AI
4. Frontend hiển thị summary cùng loading, retry, error state

## 9.4. Ask Document

1. User nhập câu hỏi
2. Frontend gửi câu hỏi lên backend
3. Backend dùng context tài liệu để trả lời
4. Frontend hiển thị câu trả lời và lịch sử trao đổi

## 10. Công Nghệ Sử Dụng

## 10.1. Frontend

- React 19
- Vite
- React Router DOM
- Tailwind CSS
- Axios
- Motion
- React Hot Toast
- React Markdown

## 10.2. Backend

- NestJS 11
- TypeORM
- PostgreSQL
- Passport JWT
- class-validator
- class-transformer
- Jest / Supertest

## 10.3. AI Và Xử Lý Tài Liệu

- Google Gemini
- pdf-parse
- mammoth

## 11. Cơ Sở Dữ Liệu

Database local mặc định:

- `studyvault_iws`

Các nhóm dữ liệu chính:

- người dùng
- thư mục
- tài liệu
- liên kết người dùng - tài liệu
- chunk nội dung
- lịch sử hỏi đáp
- artifact AI cache

## 12. Trạng Thái Hiện Tại Của Dự Án

Ở thời điểm hiện tại, project đã có:

- full auth flow
- folder CRUD
- document CRUD
- workspace thật
- favorites page
- server-side search/filter/sort/pagination
- document detail
- AI summary
- ask document
- admin dashboard
- landing page công khai đã được refresh
- build frontend pass
- build backend pass
- e2e test backend cho flow quan trọng

## 13. Các Điểm Mạnh Khi Bảo Vệ

- frontend và backend tách riêng rõ ràng
- route và API có cấu trúc dễ giải thích
- dữ liệu thật, không phải flow giả
- có quên mật khẩu và reset mật khẩu
- có phân trang, lọc, sắp xếp từ server
- có AI feature nhưng vẫn giữ scope gọn
- có tài liệu tổ chức dự án đủ để team onboarding

## 14. Các Quyết Định Scope Quan Trọng

### Quyết định 1: giữ landing page nhưng không để nó lấn át workspace

Lý do:

- landing page giúp user hiểu StudyVault trước khi đăng nhập
- workspace vẫn là trọng tâm demo vì thể hiện CRUD, auth, ownership, search/filter/sort/pagination
- landing page được giữ gọn, rõ tương phản, có CTA trực tiếp vào auth/workspace

### Quyết định 2: không đưa AI visualization vào production frontend

Lý do:

- nặng bundle
- tăng rủi ro
- không phải chức năng cần ưu tiên nhất để đạt điểm cao

### Quyết định 3: tập trung vào workspace thật

Lý do:

- workspace là trái tim của sản phẩm
- nơi thể hiện rõ CRUD, search, sort, filter, pagination
- dễ demo và dễ liên hệ với yêu cầu môn học

## 15. Hướng Dẫn Chạy Dự Án

## 15.1. Chạy backend

```powershell
cd studyVault-backend
npm install
copy .env.example .env
npm run migration:run
npm run start:dev
```

Backend chạy mặc định tại:

- `http://localhost:8000/api`

## 15.2. Chạy frontend

```powershell
cd studyVault-frontend
npm install
copy .env.local.example .env
npm run dev
```

Frontend chạy mặc định tại:

- `http://localhost:3000`

## 16. Checklist Team Nên Hiểu Trước Khi Tiếp Tục Làm

- route nào là route thật
- API nào frontend đang gọi
- query params nào backend hỗ trợ
- auth flow hiện đang lưu token ra sao
- workspace page đang là trung tâm của sản phẩm
- summary và ask document là 2 AI feature chính
- AI visualization không còn là phần cần tiếp tục ưu tiên

## 17. Kết Luận

StudyVault hiện là một sản phẩm web quản lý tài liệu học tập có scope tương đối rõ, có kiến trúc frontend/backend sạch hơn trước, và đã tập trung vào những phần có giá trị thực tế nhất cho môn học:

- xác thực
- CRUD
- tổ chức dữ liệu
- tìm kiếm và điều hướng dữ liệu
- AI summary và AI Q&A

Tài liệu này nên được xem như bản proposal nội bộ kiêm guide onboarding để cả team có thể đọc nhanh và hiểu:

- dự án đang làm gì
- hiện đã có gì
- phần nào là cốt lõi
- phần nào không còn nằm trong scope chính
