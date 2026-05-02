# StudyVault Frontend

React + Vite frontend cho StudyVault. Frontend gọi backend qua `VITE_API_BASE_URL`, quản lý workspace tài liệu, document viewer, authentication UI, profile, favorites và admin dashboard.

Last updated: 2026-05-02. Tài liệu này phản ánh router và UI/UX hiện tại sau đợt refresh giao diện.

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

## Responsive QA Notes

StudyVault is designed around these viewport groups:

- Mobile and tablet: below `1024px`.
- Desktop: `1024px` and wider.
- Wide document workspace: `1280px` and wider.

Important responsive behavior:

- `ShellHeader` keeps the top bar compact on mobile/tablet and shows the bottom navigation until the `lg` breakpoint. This avoids iPad-width crowding between Workspace, Favorites, Upload, and the account menu.
- `DetailLayout` and `DocumentViewer` allow normal page scrolling below the `xl` breakpoint. The full-height split viewer is only used on wide desktop screens.
- Auth screens use `min-h-dvh` on small screens so long forms are scrollable when browser chrome or the software keyboard reduces available height.
- Workspace document lists and admin tables use responsive cards/grids or horizontal table scroll where dense data cannot fit.

Before demo/submission, manually check:

```text
375x667   phone portrait
768x1024  iPad portrait
1024x768  iPad landscape
1366x768  laptop
1440x900  desktop
```

Routes to verify at each size: `/login`, `/register`, `/app`, `/app/favorites`, `/app/documents/:id`, `/profile`, and `/admin` for an admin account.
Include `/` because the landing page is now the public first screen.

## Main Routes

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

Route notes:

- `/` renders the public landing page.
- Auth routes are guest-only and redirect authenticated users to `/app`.
- `/app/documents/:id` uses `DetailLayout` and opens documents by document id.
- `/admin` requires admin role.

## Auth/Session Notes

- Access token được giữ trong memory, không lưu trong localStorage.
- Refresh token nằm trong HttpOnly cookie do backend set.
- Refresh/logout gửi `X-CSRF-Token` theo yêu cầu backend.
- Khi reload trang, frontend có thể rehydrate access token bằng refresh cookie + CSRF token nếu session còn hợp lệ.
- Guest-only auth screens also consider the refresh-session hint so users with a valid refresh cookie are routed back to `/app`.

## Current UI/UX Notes

- Landing page has a higher-contrast navbar and a clearer product hero.
- Workspace uses a stronger, more consistent theme with better contrast.
- Workspace hero keeps the "Study smarter" headline and rotates horizontal study-workspace images.
- Folder names are constrained to avoid broken or missing text.
- Folder back/navigation uses smoother loading states.
- Logout success appears as an auto-dismissing toast.
- Profile has a single change-password flow.
- Document viewer guards against stale async file loads when switching documents quickly.

## Demo Notes

- Nếu AI quota hết, phần upload và xem document vẫn nên hoạt động.
- Upload cùng file được phép ở nhiều folder khác nhau, nhưng backend chặn upload trùng file trong cùng một folder.
- Nếu register không nhận email, kiểm tra SMTP config ở backend.
- Admin dashboard cần backend bootstrap admin bằng `ADMIN_EMAILS` và `ADMIN_BOOTSTRAP_PASSWORD`.
