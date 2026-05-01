# StudyVault Demo Runbook

Tai lieu nay dung de chay demo final project mot cach on dinh, khong them yeu cau production nang nhu Redis hay multi-instance.

## 1. Chuan Bi Truoc Khi Demo

Tu thu muc root cua project:

```powershell
copy docker.env.example .env
```

Kiem tra cac bien quan trong trong `.env`:

- `SMTP_USER` va `SMTP_PASS`: can co neu muon demo register/verify email that.
- `GEMINI_API_KEY`: can co neu muon demo AI summary va Q&A.
- `ADMIN_EMAILS`: email admin dung de demo admin dashboard.
- `ADMIN_BOOTSTRAP_PASSWORD`: mat khau admin ban dau, toi thieu 12 ky tu va co chu hoa, chu thuong, so, ky tu dac biet.

Neu AI quota het, van co the demo upload va xem document. Phan AI co the noi ro la xu ly tach rieng, document khong phu thuoc AI.

## 2. Chay He Thong

Co hai cach chay:

### Cach A: Full Docker

```powershell
docker compose up --build
```

Cho den khi cac service len:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/api/health`
- API docs: `http://localhost:8000/api/docs`

Kiem tra nhanh:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-readiness.ps1
```

### Cach B: Local Dev

Neu muon frontend/backend chay truc tiep tren may dev:

```powershell
docker compose up -d database
cd studyVault-backend
copy .env.local-docker-db.example .env
npm install
npm run migration:run
npm run start:dev
```

Mo terminal khac:

```powershell
cd studyVault-frontend
copy .env.local.example .env
npm install
npm run dev
```

Kiem tra nhanh local mode:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\demo-readiness.ps1 -SkipDocker
```

Neu script bao backend `degraded`, xem log backend:

```powershell
docker compose logs -f backend
```

## 3. Demo Flow De Cham Diem

1. Mo `http://localhost:3000`.
2. Register user moi bang ten va email.
3. Mo email verification, dat password manh.
4. Login vao workspace.
5. Upload mot file `PDF`, `DOCX`, hoac `TXT`.
6. Mo document viewer de chung minh file da xem duoc.
7. Dung filter type/tag/sort, favorite, download.
8. Demo summary hoac Q&A neu AI key con quota.
9. Login bang admin account, mo user management va audit logs.
10. Logout, refresh page, chung minh session da bi xoa.

## 4. Cac Diem Can Noi Khi Bi Hoi Ve Security

- Public registration chi tao role `user`, khong tu cap admin.
- Admin duoc bootstrap bang `ADMIN_EMAILS` va `ADMIN_BOOTSTRAP_PASSWORD`.
- Access token song ngan va chi luu trong memory frontend.
- Refresh token nam trong HttpOnly cookie, co rotation va revoke.
- Refresh/logout can CSRF token qua header `X-CSRF-Token`.
- User A bi chan khi truy cap document/folder/tag/note cua User B.
- Admin khong duoc khoa admin khac.
- Upload validate file type/size va document van ton tai neu AI indexing loi.
- Admin actions duoc ghi audit log.

## 5. Fallback Khi Demo Gap Su Co

| Su co | Cach xu ly nhanh |
| --- | --- |
| Khong nhan email verification | Kiem tra `SMTP_USER`, `SMTP_PASS`, Gmail App Password, va `docker compose logs -f backend`. |
| AI summary/Q&A loi quota | Noi ro AI la background capability; upload/view document van la core flow va van hoat dong. |
| Backend health degraded | Kiem tra database container health va migration log. |
| Frontend khong goi duoc API | Kiem tra `VITE_API_BASE_URL` va `CORS_ORIGIN` trong `.env`. |
| Admin khong login duoc | Kiem tra `ADMIN_EMAILS` va `ADMIN_BOOTSTRAP_PASSWORD`, sau do restart backend. |

## 6. Lenh Verify Truoc Khi Nop

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
