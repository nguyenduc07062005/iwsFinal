# StudyVault Frontend

React + Vite frontend cho StudyVault. Frontend gọi backend qua `VITE_API_BASE_URL`, quản lý workspace tài liệu, document viewer, authentication UI, profile, favorites và admin dashboard.

## Tech Stack

- React 19
- Vite
- React Router
- Tailwind CSS
- Axios
- Motion
- Lucide icons

## Cách Chạy Frontend

Frontend có thể chạy theo hai kiểu:

1. Chạy trong Docker Compose cùng backend/database.
2. Chạy local trực tiếp bằng `npm run dev`.

Nếu chạy full Docker, dùng hướng dẫn ở root [README.md](../README.md).

## Chạy Local

Backend cần chạy sẵn tại `http://localhost:8000/api`, có thể là backend local hoặc backend trong Docker.

```powershell
copy .env.local.example .env
npm install
npm run dev
```

Frontend mặc định chạy tại:

- `http://localhost:3000`

Env local mặc định:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Useful Scripts

```powershell
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

## Main Routes

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/app`
- `/app/favorites`
- `/app/documents/:id`
- `/profile`

## Auth/Session Notes

- Access token được giữ trong memory, không lưu trong localStorage.
- Refresh token nằm trong HttpOnly cookie do backend set.
- Refresh/logout gửi `X-CSRF-Token` theo yêu cầu backend.
- Khi reload trang, frontend có thể rehydrate access token bằng refresh cookie + CSRF token nếu session còn hợp lệ.

## Demo Notes

- Nếu AI quota hết, phần upload và xem document vẫn nên hoạt động.
- Nếu register không nhận email, kiểm tra SMTP config ở backend.
- Admin dashboard cần backend bootstrap admin bằng `ADMIN_EMAILS` và `ADMIN_BOOTSTRAP_PASSWORD`.
