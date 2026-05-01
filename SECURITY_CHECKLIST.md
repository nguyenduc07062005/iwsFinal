# StudyVault Security / OWASP Checklist

Current security architecture, demo script, and automated evidence are now
documented in `docs/security-architecture-and-demo.md`. Use that document as
the primary final-report security reference, and use this checklist as the
OWASP-style supporting checklist.

Tài liệu này dùng để chứng minh phần security khi defense môn Internet and Web Services. Mục tiêu là trình bày rõ hệ thống đã có cơ chế bảo vệ nền tảng, không phải khẳng định đây là cấu hình production hoàn hảo.

## 1. Security Headers

Trạng thái: Đã có.

Backend dùng `helmet` trong `studyVault-backend/src/main.ts` để thêm các HTTP security headers mặc định.

Các điểm chính:

- Tắt header `X-Powered-By` để giảm lộ thông tin framework.
- Bật `helmet()` cho API responses.
- Cấu hình `crossOriginResourcePolicy: cross-origin` để frontend tách origin vẫn gọi API/file endpoint được trong kiến trúc decoupled frontend/backend.

Defense note:

- Helmet giúp giảm rủi ro phổ biến liên quan đến HTTP headers như MIME sniffing, clickjacking, policy headers.
- Vì frontend và backend chạy khác port, cấu hình cần cân bằng giữa bảo mật và khả năng gọi API hợp lệ.

## 2. CORS Whitelist

Trạng thái: Đã có.

CORS được cấu hình trong `studyVault-backend/src/main.ts`.

Allowed origins mặc định:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:4173`
- `http://127.0.0.1:4173`

Biến môi trường:

- `CORS_ORIGIN`

Defense note:

- Khi demo/defense không nên để `CORS_ORIGIN=*`.
- Chỉ domain frontend hợp lệ mới được gọi API.
- `Authorization` được whitelist trong `allowedHeaders` để frontend gửi JWT.

## 3. Authentication And Authorization

Trạng thái: Đã có.

Module chính:

- `studyVault-backend/src/modules/authentication`

Các endpoint:

- `POST /api/auth/register`
- `POST /api/auth/complete-registration`
- `POST /api/auth/resend-verification`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/profile`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/password`

Cơ chế:

- Password được hash bằng `bcrypt`.
- User mới chỉ nhập tên/email ở bước đầu, sau đó phải mở link email thật để đặt mật khẩu trước khi đăng nhập.
- Email verification token được tạo ngẫu nhiên, chỉ lưu hash trong database, và có hạn dùng qua `EMAIL_VERIFICATION_TTL_MINUTES`.
- API trả JWT access token sau khi login.
- Protected routes dùng `JwtAuthGuard`.
- Frontend tự redirect về login khi token hết hạn hoặc API trả `401`.

Defense note:

- Mật khẩu không lưu plain text.
- Email giả hoặc email không thuộc quyền sở hữu người đăng ký không thể hoàn tất bước đặt mật khẩu/kích hoạt tài khoản.
- Các thao tác tài liệu/thư mục/profile yêu cầu JWT.
- Token payload có `sub` là user id và `role`.

## 4. Password Recovery

Trạng thái: Đã có.

Endpoint:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Cơ chế:

- Reset token được tạo ngẫu nhiên bằng `crypto.randomBytes`.
- Backend chỉ lưu hash của reset token.
- Token có hạn dùng qua `RESET_PASSWORD_TTL_MINUTES`.
- Forgot password chỉ gửi reset link cho tài khoản đang active và đã xác thực email.
- Reset password xong sẽ xóa token hash và thời hạn khỏi user record.

Defense note:

- Reset link được gửi qua Gmail SMTP bằng `nodemailer`.
- `AUTH_RETURN_RESET_TOKEN=false` là mặc định để frontend không nhìn thấy token khôi phục.
- Chỉ bật `AUTH_RETURN_RESET_TOKEN=true` khi cần test nội bộ và phải tắt lại trước khi demo/chấm điểm.

## 5. Input Validation And Sanitization

Trạng thái: Đã có.

Cấu hình chính:

- `ValidationPipe`
- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`
- DTO dùng `class-validator` và `class-transformer`

Ví dụ DTO:

- `CreateUserDto`
- `LoginDto`
- `ForgotPasswordDto`
- `ResetPasswordDto`
- `ListDocumentsDto`
- `CreateFolderDto`
- `UpdateFolderDto`
- `DocumentDto`

Defense note:

- Payload sai kiểu hoặc field thừa bị reject.
- Query params như `page`, `limit`, `sortBy`, `sortOrder`, `type`, `folderId`, `favorite` được validate trước khi đi vào service.
- Điều này giảm crash do malformed data và giảm bề mặt tấn công injection.

## 6. Rate Limiting

Trạng thái: Đã có.

Middleware:

- `studyVault-backend/src/common/http/rate-limit.middleware.ts`

Routes đang giới hạn:

- `POST /api/auth/login`: 8 request / 1 phút
- `POST /api/auth/register`: 6 request / 10 phút
- `POST /api/auth/forgot-password`: 4 request / 15 phút
- `POST /api/auth/complete-registration`: 12 request / 15 phút
- `POST /api/auth/resend-verification`: 4 request / 15 phút
- `POST /api/auth/reset-password`: 6 request / 15 phút
- `POST /api/documents/upload`: 12 request / 10 phút
- `GET /api/documents`: 180 request / 1 phút
- `/api/rag/documents`: 30 request / 1 phút

Defense note:

- Login/register/complete-registration/reset/upload/AI là các điểm dễ bị spam nên cần rate limit.
- Response khi vượt giới hạn trả `429 Too Many Requests`.

## 7. File Upload Security

Trạng thái: Đã có.

Controller:

- `studyVault-backend/src/modules/document/document.controller.ts`

Whitelist file types:

- `PDF`
- `DOCX`
- `TXT`

Giới hạn:

- File size tối đa `10MB`

Defense note:

- Backend không nhận file tùy ý như `.exe`, `.js`, `.html`.
- File được validate MIME type trước khi xử lý.
- Nội dung được extract text để chunk/index, không execute file người dùng upload.

## 8. SQL Injection Mitigation

Trạng thái: Đã có ở mức phù hợp với project.

Cơ chế:

- Dùng TypeORM repository/query builder.
- Dynamic query dùng parameter binding, ví dụ `:ownerId`, `:folderId`, `:keyword`.
- Không nối trực tiếp input người dùng vào SQL raw.

Defense note:

- Search/filter/sort không truyền raw SQL từ client.
- `sortBy` và `sortOrder` được giới hạn bằng allowlist trong `ListDocumentsDto`.
- `folderId` được validate UUID trước khi query.

## 9. XSS Mitigation

Trạng thái: Có ở mức frontend/backend cơ bản.

Cơ chế:

- React tự escape text khi render.
- Backend validate input bằng DTO.
- Không render HTML thô từ user input trong flow chính.
- Markdown/AI output cần tiếp tục giữ ở dạng text/markdown an toàn, không dùng `dangerouslySetInnerHTML`.

Defense note:

- Tài liệu/tên thư mục/tên file được render như text.
- Không cho phép user upload HTML để chạy script trong app.
- Frontend không dùng raw HTML injection trong các màn chính.

## 10. Access Control / Ownership

Trạng thái: Đã có.

Cơ chế:

- Document/folder service luôn lấy `ownerId` từ JWT.
- Query document/folder kiểm tra tài nguyên thuộc user hiện tại.
- Người dùng không thể đọc/xóa/sửa tài liệu của người khác nếu không có ownership relation.

Defense note:

- API không tin `userId` từ frontend.
- `ownerId` lấy từ token đã verify qua `JwtAuthGuard`.

## 11. Error Handling

Trạng thái: Đã có.

Cơ chế:

- Validation error trả message rõ.
- Unauthorized trả `401`.
- Rate limit trả `429`.
- File/type/query sai trả `400`.
- Not found trả `404` ở service phù hợp.

Defense note:

- Frontend có interceptor xử lý session expired.
- UI có loading/error/empty states cho workspace, detail, profile.

## 12. Security Tests / Evidence

Trạng thái: Đã có E2E backend.

Lệnh:

```powershell
cd D:\S2026\iws\projectfinal\studyVault-backend
npm run test:e2e -- --runInBand
```

Đang cover:

- Register/login/complete registration/resend verification/forgot/reset/profile.
- Update profile.
- Change password.
- Folder CRUD.
- Document upload/rename/favorite/delete.
- RESTful document/folder alias endpoints.
- Server-side query validation.
- Unsupported upload file type.
- Protected route thiếu token trả `401`.

## 13. Known Residual Risks

Các điểm chưa nên giấu khi defense nếu bị hỏi sâu:

- Backend `npm audit --omit=dev` currently has 2 moderate warnings from TypeORM -> uuid. Do not use `npm audit fix --force` because it downgrades TypeORM and can break migrations/repositories.
- Frontend `npm audit --omit=dev` currently has 0 vulnerabilities after dependency updates and removal of the unused Mermaid renderer.
- Remaining dependency warning is tracked as a TypeORM transitive dependency issue; upgrade TypeORM when a non-breaking patched release is available.
- Rate limit hiện là in-memory, phù hợp local/demo; nếu deploy nhiều instance nên dùng Redis.
- Email verification và forgot password phụ thuộc Gmail SMTP App Password; nếu chưa cấu hình `SMTP_USER`/`SMTP_PASS`, email xác thực/reset cho tài khoản thật sẽ không gửi được.
- Refresh token rotation đã có: refresh session được lưu server-side, rotate khi refresh, revoke khi logout/logout-all/reset/change password/admin lock, và có reuse detection.

## 14. Defense Talking Points

Khi thầy hỏi bảo mật, nên trả lời theo thứ tự:

1. Backend và frontend tách riêng, API protected bằng JWT.
2. Password hash bằng bcrypt, email/reset token có TTL và chỉ lưu hash.
3. ValidationPipe chặn input sai và field thừa.
4. CORS whitelist chỉ cho frontend hợp lệ.
5. Helmet thêm security headers.
6. Rate limit bảo vệ login/register/complete-registration/reset/upload/AI.
7. File upload whitelist PDF/DOCX/TXT và giới hạn 10MB.
8. TypeORM query binding và allowlist sort field giúp giảm SQL injection.
9. React escaping và không render raw HTML giúp giảm XSS.
10. E2E tests chứng minh các route quan trọng hoạt động và reject lỗi đúng.
