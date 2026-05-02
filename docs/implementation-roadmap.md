# StudyVault Implementation Status

Last updated: 2026-05-02.

This document replaces the earlier phase-only roadmap. The project has moved from planning into a working final-project system, so this file records what is implemented and what remains as optional hardening.

## Current Status

StudyVault is a full-stack document study workspace with:

- React + Vite frontend.
- NestJS REST API backend.
- PostgreSQL + pgvector storage.
- Email verification and password recovery.
- JWT access tokens plus HttpOnly refresh cookies and CSRF protection.
- Folder, document, tag, favorite, notes, search, filter, sort, and pagination flows.
- Document viewer with notes, summary, Ask AI, and related documents.
- Admin dashboard with user management, stats, and audit logs.
- Docker development and production-like compose files.

## Completed Milestones

### Foundation

- Frontend/backend split is complete.
- Router is centralized in `src/app/router.jsx`.
- Layouts are separated into `AuthLayout`, `AppShell`, and `DetailLayout`.
- Shared frontend services handle auth, bearer tokens, refresh, and CSRF.
- Backend modules are separated by authentication, documents, folders, tags, RAG, admin, health, and LLM diagnostics.

### Authentication And Security

- Register, verify email, login, refresh, logout, logout-all, forgot password, reset password, change password, and profile update are implemented.
- Access token is short-lived and held in frontend memory.
- Refresh token is HttpOnly and server-side sessions are revocable.
- Refresh/logout cookie actions require `X-CSRF-Token`.
- Production validation blocks unsafe `JWT_SECRET`, wildcard CORS, `AUTH_RETURN_RESET_TOKEN=true`, and `DATABASE_SYNC=true`.

### Workspace

- Users can create, rename, move, and delete folders.
- Folder move/update prevents invalid ownership and cyclic folder nesting.
- Users can upload PDF, DOCX, and TXT files.
- File validation checks type, extension, content signature, size, filename, and readable text.
- Uploads are saved even if AI indexing fails.
- The same file can exist in different folders for the same user, but the same file cannot be uploaded twice into the same folder.
- Opening documents uses document ids, so per-folder copies remain unambiguous for the current frontend/API contract.

### Document Library

- Document lists support server-side pagination, filtering, sorting, search, folder selection, favorite state, and tag filtering.
- Favorites page has its own paginated/filterable list.
- User-owned resources are scoped by authenticated `ownerId` or `userId`.
- Admin role does not bypass private workspace ownership.

### AI / RAG

- Background indexing creates chunks and embeddings when provider quota/configuration allows.
- Ask document, ask history, summary, mind map, and diagram backend endpoints exist.
- Current frontend detail assistant exposes Study notes, Summary, Ask AI, and Related tabs.
- Summary, diagram, and mind-map caches are user-document scoped where user-specific input can affect output.

### Admin

- Admin accounts are bootstrapped via `ADMIN_EMAILS` and `ADMIN_BOOTSTRAP_PASSWORD`.
- Admin can list users, filter/paginate users, lock/unlock normal users, view stats, and inspect audit logs.
- Admin cannot lock self or another admin account.

### UX Refresh

- Landing page has been rebuilt as a clearer public product page.
- Navbar contrast has been improved for the transparent/hero area.
- Workspace theme has stronger contrast and a clearer visual hierarchy.
- Workspace hero keeps "Study smarter" and uses rotating horizontal images.
- Folder navigation/back behavior has smoother loading and safer text truncation.
- Login/logout success feedback is shown in a toast and auto-dismisses.
- Profile no longer shows duplicate change-password controls.

## Current Verification Commands

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

Docker:

```powershell
docker compose config --quiet
docker compose -f docker-compose.prod.yml config --quiet
```

## Remaining Optional Work

These are not blockers for the current final-project scope:

- Add OCR for scanned/image-only PDFs.
- Move rate limiting to Redis for multi-instance deployment.
- Add malware scanning for uploaded files before a real production launch.
- Add richer frontend controls for mind map and diagram if they become part of the main UX.
- Add end-to-end browser automation for the most important user journeys.
- Replace local upload storage with object storage for production hosting.

## Scope Rule Going Forward

New work should preserve the current core: authentication, secure workspace ownership, document/folder/tag CRUD, document preview, server-side list controls, study notes, summary/Ask AI, and admin. Optional AI visualizations should not destabilize the main upload/view/search flow.
