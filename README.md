# StudyVault

StudyVault là project cuối kỳ môn IWS, được xây dựng như một hệ thống quản lý tài liệu học tập cho sinh viên. Ứng dụng cho phép đăng ký và đăng nhập tài khoản, tổ chức tài liệu theo thư mục, tải tệp lên, tìm kiếm tài liệu theo nhiều tiêu chí, đánh dấu yêu thích, xem chi tiết tài liệu, sinh tóm tắt AI, và hỏi đáp theo ngữ cảnh tài liệu.

Repo này đã được dọn lại để chỉ giữ những phần phục vụ sản phẩm thật:

- `sks-backend`: NestJS REST API
- `sks-frontend`: React + Vite frontend
- `PROJECT_PROPOSAL.md`: tài liệu giới thiệu và hướng dẫn đọc hiểu dự án
- `QUY_TAC_FRONTEND.md`: quy tắc giao diện và coding cho frontend

## Scope Hiện Tại

StudyVault đang tập trung vào các chức năng ăn điểm trực tiếp theo rubric:

- đăng ký, đăng nhập, quên mật khẩu, đặt lại mật khẩu
- route bảo vệ theo phiên đăng nhập
- CRUD thư mục
- CRUD tài liệu
- tải tệp `PDF`, `DOCX`, `TXT`
- tìm kiếm, lọc, sắp xếp, phân trang từ backend
- đánh dấu yêu thích
- xem chi tiết tài liệu
- sinh tóm tắt AI
- hỏi đáp theo nội dung tài liệu

`Mindmap` không còn là một phần của flow frontend production.

## Cấu Trúc Repo

```text
.
├── sks-backend/          # API, database, auth, document/folder logic, AI services
├── sks-frontend/         # client React gọi API backend
├── PROJECT_PROPOSAL.md   # tài liệu mô tả project chi tiết cho team
├── QUY_TAC_FRONTEND.md   # quy tắc UI/frontend
└── README.md
```

## Công Nghệ Chính

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Axios
- Motion

### Backend

- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication
- class-validator / class-transformer

### AI / Xử Lý Tài Liệu

- Google Gemini
- `pdf-parse`
- `mammoth`
- chunking + retrieval pipeline phục vụ summary và ask-document

## Luồng Người Dùng Chính

1. Người dùng đăng ký hoặc đăng nhập.
2. Hệ thống đưa vào màn `Không gian` tại `/app`.
3. Người dùng tạo thư mục hoặc chọn thư mục có sẵn.
4. Người dùng tải tài liệu lên backend.
5. Tài liệu xuất hiện trong danh sách theo phân trang server-side.
6. Người dùng tìm kiếm, lọc, sắp xếp, đổi tên, di chuyển, xóa, hoặc đánh dấu yêu thích.
7. Khi mở chi tiết tài liệu, người dùng có thể xem preview, metadata, summary, và hỏi đáp theo tài liệu.

## Chạy Project Local

### 1. Backend

```powershell
cd D:\S2026\iws\projectfinal\sks-backend
npm install
copy .env.example .env
npm run migration:run
npm run start:dev
```

Backend mặc định chạy tại:

- `http://localhost:8000/api`

### 2. Frontend

```powershell
cd D:\S2026\iws\projectfinal\sks-frontend
npm install
copy .env.example .env
npm run dev
```

Frontend mặc định chạy tại:

- `http://localhost:3000`

## Biến Môi Trường Quan Trọng

### Backend

Xem mẫu tại [sks-backend/.env.example](/D:/S2026/iws/projectfinal/sks-backend/.env.example)

- `PORT`
- `CORS_ORIGIN`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `RESET_PASSWORD_TTL_MINUTES`
- `AUTH_RETURN_RESET_TOKEN`
- `GEMINI_API_KEY`

### Frontend

Xem mẫu tại [sks-frontend/.env.example](/D:/S2026/iws/projectfinal/sks-frontend/.env.example)

- `VITE_API_BASE_URL`

## Kiểm Tra Nhanh Trước Khi Demo

### Backend

```powershell
cd D:\S2026\iws\projectfinal\sks-backend
npm run build
npm run test:e2e -- --runInBand
```

### Frontend

```powershell
cd D:\S2026\iws\projectfinal\sks-frontend
npm run lint
npm run build
```

## Tài Liệu Dành Cho Team

Nếu team cần một bản mô tả đầy đủ hơn về mục tiêu, kiến trúc, chức năng, luồng dữ liệu, và cách chia module, đọc file:

- [PROJECT_PROPOSAL.md](/D:/S2026/iws/projectfinal/PROJECT_PROPOSAL.md)

## Ghi Chú

- Repo đã được dọn để bỏ các thư mục planning cũ và các file frontend mẫu không còn dùng.
- Landing page marketing không còn là route thật của app.
- Route `/` hiện chỉ dùng để điều hướng:
  - đã đăng nhập -> `/app`
  - chưa đăng nhập -> `/login`
