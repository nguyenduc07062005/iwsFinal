# StudyVault Backend

NestJS REST API for the StudyVault final project. This service owns:

- authentication: register, login, forgot password, reset password, profile
- document CRUD and upload
- folder CRUD and document organization
- server-side search, filter, sort, and pagination
- AI summary and document Q&A endpoints

## Tech Stack

- NestJS 11
- PostgreSQL + TypeORM
- JWT authentication
- class-validator / class-transformer

## Quick Start

```bash
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

The API runs on `http://localhost:8000` by default and uses the global prefix `/api`.

## Environment Variables

Copy [`.env.example`](/D:/S2026/iws/projectfinal/studyVault-backend/.env.example) and update the values for your machine.

Important variables:

- `PORT`: API port, default `8000`
- `CORS_ORIGIN`: comma-separated allowed frontend origins
- `DATABASE_*`: PostgreSQL connection. The default local database name is `studyvault_iws`.
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: token lifetime, default `1d`
- `RESET_PASSWORD_TTL_MINUTES`: reset token lifetime
- `AUTH_RETURN_RESET_TOKEN`: set `true` in local demo mode if you want the forgot-password API to return the reset token
- `GEMINI_*`: model configuration for AI summary / Q&A

## Useful Scripts

```bash
npm run start:dev
npm run build
npm run migration:run
npm run test:e2e
```

`npm run lint` still reports legacy lint debt in older AI/RAG files outside the Phase 8 scope. Build and targeted lint checks for the critical backend paths pass.

## Main API Areas

- `/api/auth`
- `/api/documents`
- `/api/folders`
- `/api/rag`

The production frontend is expected to call the backend directly through `VITE_API_BASE_URL`.

## Phase 8 Test Coverage

The E2E suite in [test/studyvault.e2e-spec.ts](/D:/S2026/iws/projectfinal/studyVault-backend/test/studyvault.e2e-spec.ts) covers the scoring-critical HTTP flows:

- auth: register, login, forgot password, reset password, profile
- folders: create, update, move, delete, list
- documents: upload, rename, favorite, delete
- server-side query contract: pagination, sorting, filtering, search validation

These tests run against Nest HTTP routes with mocked services so the suite stays stable and does not depend on a local PostgreSQL or external AI service.

## Demo Notes

- For local defense/demo, keep `AUTH_RETURN_RESET_TOKEN=true`.
- For a stricter deployment, switch it to `false`.
- The frontend production flow no longer depends on mindmap.
