# StudyVault — Academic Document Management Platform

> **Course**: Internet and Web Services (61FIT3IWS) — Spring 2026  
> **Project Type**: Final Capstone Project

---

## 1. Project Overview

StudyVault is a full-stack web application designed for university students to **upload, organize, and interact** with study materials. The platform provides secure document management with AI-powered features including document summarization and context-aware Q&A.

### Key Features

| Category                | Features                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Authentication**      | Registration with email verification, login, forgot/reset password, JWT-based session management |
| **Document Management** | Upload (PDF, DOCX, TXT), preview, download, rename, delete, favorites                            |
| **Organization**        | Folder hierarchy, tag system with color coding, multi-parameter search & filtering               |
| **AI Integration**      | Document summarization (EN/VI), context-aware Q&A with RAG pipeline, Q&A history                 |
| **Study Tools**         | Personal notes per document, favorites collection, recent documents                              |
| **Admin Panel**         | User management, lock/unlock accounts, audit logs, system statistics                             |
| **Server-Side Data**    | Dynamic sorting (5 fields), pagination with metadata, composable filters                         |
| **Security**            | Rate limiting, CORS whitelist, Helmet headers, bcrypt hashing, input validation                  |

---

## 2. Technology Stack

### Frontend

| Technology          | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| **React 19**        | UI framework with component-based architecture    |
| **Vite**            | Build tool and development server                 |
| **React Router v7** | Client-side routing and navigation                |
| **Tailwind CSS v3** | Utility-first CSS framework for responsive design |
| **Axios**           | HTTP client for API communication                 |
| **Framer Motion**   | Animation library for micro-interactions          |
| **Lucide React**    | Icon system                                       |

### Backend

| Technology          | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| **NestJS**          | Node.js framework with modular architecture        |
| **TypeORM**         | ORM for database operations and migrations         |
| **PostgreSQL**      | Relational database with JSONB support             |
| **pgvector**        | Vector similarity search for RAG embeddings        |
| **JWT**             | Stateless authentication tokens                    |
| **class-validator** | DTO validation and sanitization                    |
| **Helmet**          | HTTP security headers                              |
| **Nodemailer**      | Email delivery for verification and password reset |
| **Google Gemini**   | LLM for summarization, Q&A, and embeddings         |

### Infrastructure

| Technology                   | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| **Docker Compose**           | Multi-container orchestration            |
| **PostgreSQL 16 + pgvector** | Database container with vector extension |

---

## 3. Project Structure

```
.
├── studyVault-backend/           # NestJS REST API
│   ├── src/
│   │   ├── common/               # Shared utilities, guards, filters, middleware
│   │   │   ├── http/             # Rate limiter, exception filter
│   │   │   ├── llm/              # Gemini AI service
│   │   │   └── database/         # Query helpers
│   │   ├── config/               # Environment validation, Swagger, HTTP config
│   │   ├── database/
│   │   │   ├── entities/         # TypeORM entities (User, Document, Folder, Tag, etc.)
│   │   │   ├── migrations/       # Database migration files
│   │   │   └── repositories/     # Custom repositories
│   │   └── modules/
│   │       ├── authentication/   # Login, register, JWT, guards
│   │       ├── document/         # Document CRUD, file handling, notes
│   │       ├── folder/           # Folder CRUD, document-folder relations
│   │       ├── tag/              # Tag CRUD
│   │       ├── rag/              # AI indexing, Q&A, summarization
│   │       └── admin/            # User management, audit logs, stats
│   ├── test/                     # E2E tests
│   └── Dockerfile
│
├── studyVault-frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── pages/                # Route-level page components
│   │   ├── components/           # Reusable UI components
│   │   │   ├── ui/               # Design system (Button, Input, Modal, etc.)
│   │   │   ├── workspace/        # Document library, filters, hero
│   │   │   ├── folders/          # Folder panel
│   │   │   ├── documents/        # Upload modal
│   │   │   ├── navigation/       # App navigation, sidebar
│   │   │   └── auth/             # Auth-specific components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── service/              # API service modules
│   │   ├── services/             # HTTP client and barrel exports
│   │   ├── utils/                # Utility functions
│   │   ├── context/              # React context providers
│   │   ├── layouts/              # Page layout wrappers
│   │   ├── routes/               # Route definitions and guards
│   │   └── lib/                  # Shared libraries (cn, motion)
│   └── Dockerfile
│
├── docs/                         # Project documentation
│   ├── postman/                  # API testing collections
│   ├── authorization-matrix.md   # Permission matrix
│   ├── final-project-submission.md
│   ├── final-project-submission.vi.md
│   └── security-architecture-and-demo.md
│
├── docker-compose.yml            # Development Docker stack
├── docker-compose.prod.yml       # Production-like Docker stack
├── docker.env.example            # Environment template for Docker
└── README.md
```

---

## 4. API Architecture

### RESTful Endpoints

The backend exposes RESTful APIs with proper HTTP method usage. Main endpoints include:

| Method   | Endpoints                                                                                                                                                                                                                                                          | Purpose                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `GET`    | `/api/documents`, `/api/documents/:id`, `/api/documents/:id/file`, `/api/documents/favorites`, `/api/folders`, `/api/tags`, `/api/auth/profile`, `/api/admin/users`, `/api/admin/stats`, `/api/admin/audit-logs`, `/api/rag/documents/:documentId/ask/history`     | Retrieve resources                        |
| `POST`   | `/api/documents/upload`, `/api/folders`, `/api/tags`, `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/complete-registration`, `/api/rag/documents/:documentId/ask`, `/api/rag/documents/:documentId/summary` | Create resources or start auth/AI actions |
| `PATCH`  | `/api/documents/:documentId`, `/api/documents/:id/tags`, `/api/folders/:id`, `/api/tags/:tagId`, `/api/auth/profile`, `/api/auth/password`, `/api/admin/users/:id/status`                                                                                          | Update resources                          |
| `DELETE` | `/api/documents/:id`, `/api/folders/:id`, `/api/tags/:tagId`, `/api/rag/documents/:documentId/ask/history`                                                                                                                                                         | Remove resources                          |

### Server-Side Sorting

All collection endpoints support sorting via query parameters:

```
GET /api/documents?sortBy=createdAt&sortOrder=desc
```

**Available sort fields**: `createdAt`, `updatedAt`, `title`, `docDate`, `fileSize`  
**Sort orders**: `asc`, `desc`  
**Implementation**: Parameterized `ORDER BY` with `NULLS LAST` and stable secondary sort on `createdAt`

### Server-Side Pagination

```
GET /api/documents?page=1&limit=12
```

**Response format:**

```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 12,
  "totalPages": 13,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**Validation**: `page` ≥ 1, `limit` 1–50, enforced via `class-validator` decorators

### Multi-Parameter Filtering

```
GET /api/documents?keyword=react&type=pdf&folderId=xxx&tagId=yyy&favorite=true&sortBy=title&sortOrder=asc&page=1&limit=12
```

All filters are composable and validated server-side.

---

## 5. Security Implementation

| Security Measure     | Implementation                                                                  |
| -------------------- | ------------------------------------------------------------------------------- |
| **Authentication**   | JWT access tokens (15min) + HttpOnly refresh cookie                             |
| **Password Hashing** | bcrypt with 10 salt rounds                                                      |
| **Input Validation** | `class-validator` with `whitelist: true`, `forbidNonWhitelisted: true`          |
| **Rate Limiting**    | Custom middleware with 9 path-specific configurations, dual-key (IP + Identity) |
| **CORS**             | Strict origin whitelist, explicit methods/headers                               |
| **Security Headers** | Helmet middleware (X-Frame-Options, CSP, etc.)                                  |
| **SQL Injection**    | Parameterized queries via TypeORM QueryBuilder                                  |
| **XSS Prevention**   | Input sanitization, Content-Type validation                                     |
| **CSRF Protection**  | Token-based verification for state-changing cookie operations                   |
| **Access Control**   | Ownership scoping — users can only access their own documents                   |

---

## 6. Getting Started

### Prerequisites

- **Docker** and **Docker Compose** (recommended)
- OR: **Node.js 20+**, **PostgreSQL 16** with pgvector extension

### Option A: Full Docker (Recommended)

**Step 1**: Create environment file

```powershell
copy docker.env.example .env
```

**Step 2**: Configure required variables in `.env`

```env
# Required for email verification
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Required for AI features
GEMINI_API_KEY=your-gemini-api-key

# Admin account
ADMIN_EMAILS=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=Admin#12345678
```

**Step 3**: Start the system

```powershell
docker compose up --build
```

**Step 4**: Access the application
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| Health Check | http://localhost:8000/api/health |
| API Docs | http://localhost:8000/api/docs |

### Option B: Local Development

```powershell
# Start database only
docker compose up -d database

# Backend
cd studyVault-backend
copy .env.local-docker-db.example .env
npm install
npm run migration:run
npm run start:dev

# Frontend (new terminal)
cd studyVault-frontend
copy .env.local.example .env
npm install
npm run dev
```

---

## 7. Testing

### Backend Tests

```powershell
cd studyVault-backend
npm run lint          # ESLint check
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run build         # TypeScript compilation check
```

### Frontend Tests

```powershell
cd studyVault-frontend
npm run lint          # ESLint check
npm test              # Structural validation tests
npm run build         # Production build check
```

---

## 8. Demo Flow

1. Open `http://localhost:3000` — Landing page
2. **Register** a new account (name + email)
3. **Verify email** and set password via verification link
4. **Login** with credentials
5. **Upload** documents (PDF, DOCX, TXT)
6. **Organize** with folders, tags, favorites
7. **Search & filter** using keyword, type, folder, tag, sort
8. **View document** with preview, notes, download
9. **AI Q&A** — Ask questions about document content
10. **AI Summary** — Generate document summaries
11. **Admin panel** — Login as admin to manage users and view audit logs
12. **Logout** and verify session is cleared

---

## 9. Environment Variables Reference

### Backend / Docker

| Variable                  | Description               | Default                     |
| ------------------------- | ------------------------- | --------------------------- |
| `DATABASE_NAME`           | PostgreSQL database name  | `studyvault_iws`            |
| `DATABASE_USERNAME`       | Database user             | `postgres`                  |
| `DATABASE_PASSWORD`       | Database password         | `postgres`                  |
| `JWT_SECRET`              | JWT signing secret        | (required)                  |
| `JWT_EXPIRES_IN`          | Access token TTL          | `15m`                       |
| `CORS_ORIGIN`             | Allowed frontend origins  | `http://localhost:3000,...` |
| `ADMIN_EMAILS`            | Admin bootstrap email(s)  | `admin@example.com`         |
| `SMTP_USER` / `SMTP_PASS` | Email service credentials | (optional)                  |
| `GEMINI_API_KEY`          | Google Gemini API key     | (optional)                  |

### Frontend

| Variable            | Description     | Default                     |
| ------------------- | --------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |

---

## 10. License

This project was developed as an academic capstone for the Internet and Web Services course at Hanoi University, Spring 2026.
