# StudyVault Backend

NestJS REST API cho StudyVault. Backend chịu trách nhiệm authentication, session, authorization, document/folder/tag/note APIs, upload validation, RAG/AI endpoints, admin dashboard APIs và audit log.

Last updated: 2026-05-02. Tài liệu này phản ánh code backend hiện tại sau các bản sửa security/upload/RAG cache.

## Tech Stack

- NestJS 11
- TypeORM
- PostgreSQL + pgvector
- JWT authentication
- HttpOnly refresh cookie + CSRF token
- class-validator / class-transformer
- Nodemailer
- Google Gemini

## Cách Chạy Backend

Backend có thể chạy theo hai kiểu:

1. Chạy trong Docker Compose cùng frontend/database.
2. Chạy local trực tiếp bằng `npm run start:dev`.

Nếu chạy full Docker, dùng hướng dẫn ở root [README.md](../README.md).

## Chạy Local Với PostgreSQL Local

Cần cài PostgreSQL và pgvector trên máy.

```powershell
copy .env.example .env
npm install
npm run migration:run
npm run start:dev
```

Env mặc định cho hướng này:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=studyvault_iws
```

## Chạy Local Với Database Docker

Nếu không muốn cài PostgreSQL/pgvector trực tiếp, chỉ chạy database từ root project:

```powershell
docker compose up -d database
```

Sau đó trong thư mục backend:

```powershell
copy .env.local-docker-db.example .env
npm install
npm run migration:run
npm run start:dev
```

Env mẫu này dùng:

```env
DATABASE_HOST=localhost
DATABASE_PORT=15432
DATABASE_NAME=studyvault_iws
```

## URL Mặc Định

- API: `http://localhost:8000/api`
- Health: `http://localhost:8000/api/health`
- API docs: `http://localhost:8000/api/docs` nếu `SWAGGER_ENABLED=true`

## Env Quan Trọng

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Port backend |
| `CORS_ORIGIN` | Frontend origins được phép gọi API |
| `FRONTEND_URL` | URL frontend để tạo verification/reset links |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` | Kết nối PostgreSQL |
| `JWT_SECRET` | Secret ký access token |
| `JWT_EXPIRES_IN` | Thời gian sống access token, mặc định `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | Thời gian sống refresh session |
| `AUTH_RETURN_RESET_TOKEN` | Chỉ nên bật trong local/test |
| `ADMIN_EMAILS` | Email được bootstrap thành admin |
| `ADMIN_BOOTSTRAP_PASSWORD` | Password ban đầu cho admin bootstrap |
| `SWAGGER_ENABLED` | Bật/tắt API docs |
| `DATABASE_SYNC` | Phải là `false` trong production; backend sẽ chặn `true` khi `NODE_ENV=production` |
| `SMTP_*`, `MAIL_FROM` | Cấu hình email verification/reset |
| `GEMINI_*` | Cấu hình AI/RAG |

## Useful Scripts

```powershell
npm run start:dev
npm run build
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run migration:run
npm run migration:show
```

## Main API Areas

- `/api/auth`
- `/api/documents`
- `/api/folders`
- `/api/tags`
- `/api/rag`
- `/api/admin`
- `/api/llm`
- `/api/health`

## Document Upload Rules

- Hỗ trợ `PDF`, `DOCX`, `TXT`.
- File upload được validate trước khi lưu: size, MIME type, extension, filename, file signature, và nội dung đọc được.
- Upload và xem document không phụ thuộc AI quota; indexing chạy sau bằng background flow.
- Cùng một user có thể upload cùng file vào nhiều folder khác nhau.
- Cùng một user không thể upload cùng một file hai lần trong cùng một folder.
- Nếu bản trong folder đã bị xóa, user có thể upload lại file đó vào folder đó.
- Khi cùng file được đưa vào nhiều folder của cùng user, backend tạo entry/document phù hợp để frontend/API hiện tại vẫn mở bằng `document.id` một cách rõ ràng.

## Security Notes

- Public registration chỉ tạo role `user`.
- Admin được bootstrap bằng env, không cấp qua public registration.
- Access token ngắn hạn và frontend chỉ lưu trong memory.
- Refresh token nằm trong HttpOnly cookie.
- Refresh/logout yêu cầu CSRF token qua `X-CSRF-Token`.
- User-owned resources luôn được query theo `ownerId` hoặc `userId`.
- Upload document validate file trước khi lưu và không phụ thuộc AI quota.
- Production safety validation chặn wildcard CORS, development JWT secret, `AUTH_RETURN_RESET_TOKEN=true`, và `DATABASE_SYNC=true`.
