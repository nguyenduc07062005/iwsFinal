# StudyVault

## Responsive Demo Checklist

Responsive UI is a final-project requirement. Before recording screenshots or presenting the demo, verify the frontend at these sizes:

- `375x667`: phone portrait.
- `768x1024`: iPad portrait.
- `1024x768`: iPad landscape.
- `1366x768`: laptop.
- `1440x900`: desktop.

Current layout rules:

- Mobile/tablet below `1024px` use a compact top header plus bottom navigation.
- Desktop from `1024px` shows the centered Workspace/Favorites navigation in the top header.
- Document viewer stacks preview and AI assistant below `1280px`; wide desktop uses the split preview/assistant layout.
- Auth forms must scroll on short screens and when the on-screen keyboard is open.

Minimum routes to capture for report evidence: `/login`, `/register`, `/app`, `/app/favorites`, `/app/documents/:id`, `/profile`, and `/admin` when logged in as admin.

StudyVault là final project môn IWS, được xây dựng như một hệ thống quản lý tài liệu học tập cho sinh viên. Ứng dụng hỗ trợ đăng ký tài khoản, xác thực email, đăng nhập, tổ chức tài liệu theo thư mục và tag, upload tài liệu, xem tài liệu, tìm kiếm/lọc/sắp xếp, ghi chú học tập, tóm tắt bằng AI và hỏi đáp theo nội dung tài liệu.

## Tổng Quan Hệ Thống

StudyVault có thể chạy theo hai hướng:

- **Full Docker**: frontend, backend, database đều chạy trong Docker Compose.
- **Local dev**: frontend/backend chạy trực tiếp trên máy dev, database có thể là PostgreSQL local hoặc chỉ chạy riêng service database bằng Docker.

Khi chạy bằng Docker Compose, hệ thống gồm ba service chính:

- `studyVault-frontend`: React + Vite frontend.
- `studyVault-backend`: NestJS REST API.
- `database`: PostgreSQL kèm pgvector để lưu dữ liệu và embedding.

Các tài liệu nộp final project nằm trong thư mục `docs/`. Bản chính tiếng Việt:

- [docs/final-project-submission.vi.md](./docs/final-project-submission.vi.md)

## Chức Năng Chính

### Authentication và Security

- Đăng ký bằng tên và email.
- Xác thực email trước khi đặt mật khẩu.
- Đăng nhập bằng email/password.
- Access token ngắn hạn, mặc định `15m`.
- Access token chỉ lưu trong memory phía frontend.
- Refresh token nằm trong HttpOnly cookie.
- Refresh/logout dùng CSRF token qua header `X-CSRF-Token`.
- Forgot password và reset password.
- Password policy tối thiểu 12 ký tự và có yêu cầu độ phức tạp.
- Logout hiện tại và logout tất cả phiên.
- Public registration chỉ tạo tài khoản role `user`.
- Admin được tạo bằng bootstrap qua `ADMIN_EMAILS` và `ADMIN_BOOTSTRAP_PASSWORD`.
- Admin không được khóa chính mình hoặc khóa admin khác.
- Admin actions được ghi audit log.

### Document Workspace

- Upload tài liệu `PDF`, `DOCX`, `TXT`.
- Giới hạn file upload mặc định `10MB`.
- Validate file type, filename, kích thước và nội dung đọc được.
- Upload document không phụ thuộc AI quota: file vẫn được lưu và xem được nếu AI indexing lỗi.
- Danh sách document có pagination/filter/sort.
- Xem chi tiết document và protected file preview.
- Đổi tên, xóa, đánh dấu yêu thích.
- Folder CRUD và move folder.
- Tag CRUD và gán tag cho document.
- Study notes theo từng document.
- Tìm kiếm tài liệu và tài liệu liên quan.

### AI / RAG

- Background indexing sau khi upload.
- Hỏi đáp theo nội dung document.
- Lịch sử hỏi đáp.
- Sinh tóm tắt.
- Mind map / diagram endpoints.
- Nếu `GEMINI_API_KEY` hết quota hoặc chưa cấu hình, upload và xem document vẫn hoạt động.

### Admin

- Danh sách users.
- Khóa/mở khóa user thường.
- Audit logs cho hành động admin.
- Dashboard stats.
- LLM diagnostic endpoints chỉ dành cho admin.

## Công Nghệ

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Axios
- Motion
- Lucide icons

### Backend

- NestJS
- TypeORM
- PostgreSQL
- pgvector
- JWT authentication
- class-validator / class-transformer
- Nodemailer
- Helmet

### AI và Xử Lý File

- Google Gemini
- `pdf-parse`
- `mammoth`
- chunking + retrieval pipeline

## Cấu Trúc Project

```text
.
├── studyVault-backend/        # NestJS API, auth, database, document, folder, tag, RAG, admin
├── studyVault-frontend/       # React + Vite frontend
├── docs/                      # Tài liệu nộp, security, authorization, demo runbook
├── scripts/                   # Script hỗ trợ demo/readiness
├── docker-compose.yml         # Docker development stack
├── docker-compose.prod.yml    # Production-like Docker stack
├── docker.env.example         # Env mẫu cho Docker development
├── studyVault-backend/.env.example                 # Env mẫu backend local với PostgreSQL local
├── studyVault-backend/.env.local-docker-db.example # Env mẫu backend local với database Docker
├── studyVault-frontend/.env.example                # Env mẫu frontend
├── studyVault-frontend/.env.local.example          # Env mẫu frontend local
└── README.md
```

## Hai Hướng Chạy Project

Bạn có thể chọn một trong hai hướng tùy thói quen dev.

| Hướng chạy | Phù hợp khi | Database host backend dùng |
| --- | --- | --- |
| Full Docker | Muốn setup nhanh, ít phụ thuộc môi trường máy | `database:5432` bên trong Docker network |
| Local dev | Muốn debug frontend/backend trực tiếp bằng IDE | `localhost:5432` nếu dùng PostgreSQL local, hoặc `localhost:15432` nếu dùng database service từ Docker |

## Hướng 1: Full Docker

Hướng này chạy toàn bộ frontend, backend, database bằng Docker Compose từ thư mục root.

### 1. Tạo file môi trường

```powershell
copy docker.env.example .env
```

Nếu chỉ cần chạy thử giao diện và API cơ bản, có thể giữ phần lớn giá trị mặc định.

Nếu muốn demo email verification thật, cấu hình:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM="StudyVault <your-email@gmail.com>"
```

Nếu muốn demo AI summary/Q&A, cấu hình:

```env
GEMINI_API_KEY=your-gemini-api-key
```

Nếu muốn có admin account khi chạy sạch database, cấu hình:

```env
ADMIN_EMAILS=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=Admin#12345678
```

`ADMIN_BOOTSTRAP_PASSWORD` cần tối thiểu 12 ký tự và có chữ hoa, chữ thường, số, ký tự đặc biệt.

### 2. Start hệ thống

```powershell
docker compose up --build
```

Sau khi các container chạy:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- Backend health: `http://localhost:8000/api/health`
- API docs: `http://localhost:8000/api/docs` nếu `SWAGGER_ENABLED=true`
- PostgreSQL: `localhost:15432`

Compose sẽ tự chạy migration trước khi start backend. Database và uploads được lưu trong Docker volumes.

### 3. Kiểm tra readiness trước demo

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-readiness.ps1
```

Script này kiểm tra:

- Docker Compose có đọc được trạng thái service không.
- Backend `/api/health` có trả `ok` và database có sẵn sàng không.
- Frontend có mở được không.

## Các Lệnh Docker Hữu Ích

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

Chạy lại migration thủ công:

```powershell
docker compose exec backend npm run migration:run
```

Xóa sạch database/upload volumes để demo lại từ đầu:

```powershell
docker compose down -v
```

## Hướng 2: Local Dev

Hướng này chạy backend/frontend trực tiếp trên máy dev. Database có hai lựa chọn.

### Lựa chọn database A: Dùng PostgreSQL local

Cần cài PostgreSQL kèm extension `pgvector`, tạo database `studyvault_iws`, rồi dùng env local mặc định:

```powershell
cd studyVault-backend
copy .env.example .env
```

Trong trường hợp này backend kết nối:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

### Lựa chọn database B: Chỉ chạy database bằng Docker

Nếu không muốn cài PostgreSQL/pgvector trực tiếp trên máy, có thể chỉ start service database:

```powershell
docker compose up -d database
```

Sau đó dùng env mẫu dành riêng cho backend local kết nối vào database container qua port expose `15432`:

```powershell
cd studyVault-backend
copy .env.local-docker-db.example .env
```

Trong trường hợp này backend kết nối:

```env
DATABASE_HOST=localhost
DATABASE_PORT=15432
```

### Chạy backend local

```powershell
cd studyVault-backend
npm install
npm run migration:run
npm run start:dev
```

Backend chạy tại:

- `http://localhost:8000/api`
- `http://localhost:8000/api/health`
- `http://localhost:8000/api/docs` nếu `SWAGGER_ENABLED=true`

### Chạy frontend local

Mở terminal khác:

```powershell
cd studyVault-frontend
npm install
copy .env.local.example .env
npm run dev
```

Frontend chạy tại:

- `http://localhost:3000`

### Kiểm tra readiness khi chạy local

Khi backend và frontend local đã chạy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-readiness.ps1 -SkipDocker
```

## Luồng Demo Khuyến Nghị

1. Mở `http://localhost:3000`.
2. Register user mới bằng tên và email.
3. Mở email verification và hoàn tất đặt mật khẩu.
4. Login.
5. Upload file `PDF`, `DOCX`, hoặc `TXT`.
6. Mở document viewer để xem file.
7. Demo filter/sort/tag/folder/favorite/download.
8. Demo summary hoặc Q&A nếu `GEMINI_API_KEY` còn quota.
9. Giải thích rằng upload/view vẫn hoạt động nếu AI quota hết.
10. Login bằng admin account.
11. Xem users, lock/unlock user thường, và audit logs.
12. Logout và refresh page để chứng minh session được xóa.

Runbook chi tiết:

- [docs/demo-runbook.md](./docs/demo-runbook.md)

## Biến Môi Trường Quan Trọng

### Backend / Docker

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Port backend trong container |
| `CORS_ORIGIN` | Danh sách origin frontend được phép gọi API |
| `FRONTEND_URL` | URL frontend để tạo link email |
| `DATABASE_HOST` | Host database |
| `DATABASE_PORT` | Port database |
| `DATABASE_USERNAME` | User database |
| `DATABASE_PASSWORD` | Password database |
| `DATABASE_NAME` | Tên database |
| `JWT_SECRET` | Secret ký JWT |
| `JWT_EXPIRES_IN` | Thời gian sống access token, mặc định `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | Thời gian sống refresh session |
| `AUTH_RETURN_RESET_TOKEN` | Chỉ dùng local/test, không bật khi demo production-like |
| `ADMIN_EMAILS` | Danh sách email admin bootstrap |
| `ADMIN_BOOTSTRAP_PASSWORD` | Password ban đầu cho admin bootstrap |
| `SWAGGER_ENABLED` | Bật/tắt API docs |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Cấu hình SMTP |
| `SMTP_USER`, `SMTP_PASS` | Tài khoản SMTP |
| `MAIL_FROM` | Sender email |
| `GEMINI_API_KEY` | API key cho AI features |
| `GEMINI_TEXT_MODEL` | Model sinh text chính |
| `GEMINI_TEXT_MODEL_FALLBACKS` | Danh sách model fallback |
| `GEMINI_EMBEDDING_MODEL` | Model embedding |

### Frontend

| Biến | Ý nghĩa |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL backend API, mặc định `http://localhost:8000/api` |

## Kiểm Tra Trước Khi Nộp

Backend:

```powershell
cd studyVault-backend
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

Frontend:

```powershell
cd studyVault-frontend
npm run lint
npm test
npm run build
```

Docker config:

```powershell
docker compose config --quiet
```

## Tài Liệu Quan Trọng

- [docs/final-project-submission.vi.md](./docs/final-project-submission.vi.md): bản nộp chính tiếng Việt.
- [docs/authorization-matrix.md](./docs/authorization-matrix.md): ma trận phân quyền chi tiết.
- [docs/security-architecture-and-demo.md](./docs/security-architecture-and-demo.md): kiến trúc security và evidence map.
- [docs/demo-runbook.md](./docs/demo-runbook.md): checklist demo.
- [docs/production-deployment.md](./docs/production-deployment.md): ghi chú Docker production-like.
- [docs/README.md](./docs/README.md): index tài liệu.

## Ghi Chú Trạng Thái Hiện Tại

- CORS đã allow `X-CSRF-Token`, nên refresh/logout dùng CSRF hoạt động với browser thật.
- Upload document đã validate folder/tag trước side effect và dùng transaction/cleanup để tránh dữ liệu mồ côi.
- Admin bootstrap đã có cơ chế sạch, không cần thao tác database thủ công.
- Swagger/API docs không còn bật vô điều kiện trong production-like; dùng `SWAGGER_ENABLED`.
- Dependency audit backend còn cảnh báo transitive `typeorm -> uuid`. Không dùng `npm audit fix --force` vì sẽ kéo TypeORM xuống nhánh cũ không phù hợp.
