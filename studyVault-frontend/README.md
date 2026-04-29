# StudyVault Frontend

React + Vite frontend for the StudyVault final project. This is the production-facing client that talks to `studyVault-backend`.

## Product Scope

The current frontend covers the main defense flow:

- auth: login, register, forgot password, reset password
- protected workspace shell
- folder/document CRUD
- favorites
- server-side search, filter, sort, and pagination
- document detail with preview fallback and AI summary

Mindmap is no longer part of the production flow.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Default dev server: `http://localhost:5173`

## Environment Variables

Copy [`.env.example`](/D:/S2026/iws/projectfinal/studyVault-frontend/.env.example).

- `VITE_API_BASE_URL`: backend base URL, default `http://localhost:8000/api`

## Useful Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Architecture Notes

- Visual direction follows `frontendthaythe/studyvault`
- Frontend rules follow `QUY_TAC_FRONTEND.md`
- Product name in the UI is `StudyVault`
- Auth/session UX, error boundary, and redirect handling were polished in Phase 7

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

## Build Status

`npm run lint` and `npm run build` both pass on the current Phase 8 state.
